/**
 * AETHERNET-TX-V1 Transaction Signer
 *
 * Signs write requests per the TX-V1 spec: 7 HTTP headers, JCS-canonicalized
 * sign bytes, Ed25519 signature over the raw canonical bytes.
 *
 * The request body is sent unchanged — signing is header-only.
 */

import canonicalize from "canonicalize";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { signMessage } from "./crypto";

const TX_VERSION = "AETHERNET-TX-V1";
const CHAIN_ID = "aethernet-testnet-1";
const TX_LIFETIME_SECS = 120;

export interface TxV1Headers {
  "X-AetherNet-Version": string;
  "X-AetherNet-Chain-ID": string;
  "X-AetherNet-Actor": string;
  "X-AetherNet-Created": string;
  "X-AetherNet-Expires": string;
  "X-AetherNet-Nonce": string;
  "X-AetherNet-Signature": string;
}

function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hashBodyJCS(body: string): string {
  // JCS-canonicalize the body, then SHA-256
  let canonical: string;
  if (!body || body === "") {
    // Empty body → hash empty bytes
    canonical = "";
  } else {
    try {
      const parsed = JSON.parse(body);
      canonical = canonicalize(parsed) || "";
    } catch {
      // Not JSON — hash raw bytes
      canonical = body;
    }
  }
  const hash = sha256(new TextEncoder().encode(canonical));
  return bytesToHex(hash);
}

/**
 * Build TX-V1 signing headers for a write request.
 *
 * Process (per spec):
 * 1. JCS-canonicalize the request body → SHA-256 → body_sha256
 * 2. Build transaction object {version, chain_id, actor, method, path, body_sha256, created_at, expires_at, nonce}
 * 3. JCS-canonicalize the transaction object → sign_bytes
 * 4. Ed25519.Sign(private_key, sign_bytes) → signature
 * 5. Return 7 HTTP headers
 */
export async function signRequestTxV1(
  method: string,
  path: string,
  body: string,
  agentIdHex: string,
  secretKey: Uint8Array,
): Promise<TxV1Headers> {
  const createdAt = Math.floor(Date.now() / 1000);
  const expiresAt = createdAt + TX_LIFETIME_SECS;
  const nonce = generateNonce();
  const bodySha256 = hashBodyJCS(body);

  // Build the transaction object (field names match the Go struct JSON tags)
  const tx = {
    version: TX_VERSION,
    chain_id: CHAIN_ID,
    actor: agentIdHex,
    method,
    path,
    body_sha256: bodySha256,
    created_at: createdAt,
    expires_at: expiresAt,
    nonce,
  };

  // JCS-canonicalize → sign_bytes
  const signBytes = canonicalize(tx);
  if (!signBytes) throw new Error("TX-V1: JCS canonicalization failed");

  // Ed25519 sign the raw canonical bytes
  const signBytesEncoded = new TextEncoder().encode(signBytes);
  const signature = await signMessage(secretKey, signBytesEncoded);

  return {
    "X-AetherNet-Version": TX_VERSION,
    "X-AetherNet-Chain-ID": CHAIN_ID,
    "X-AetherNet-Actor": agentIdHex,
    "X-AetherNet-Created": String(createdAt),
    "X-AetherNet-Expires": String(expiresAt),
    "X-AetherNet-Nonce": nonce,
    "X-AetherNet-Signature": bytesToHex(signature),
  };
}
