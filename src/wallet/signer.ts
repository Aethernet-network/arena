import { signMessage, hashBody, bytesToHex } from "./crypto";

export interface SignedHeaders {
  "X-Aethernet-Agent-ID": string;
  "X-Aethernet-Timestamp": string;
  "X-Aethernet-Nonce": string;
  "X-Aethernet-Signature": string;
}

function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return bytesToHex(bytes);
}

export function buildCanonicalString(method: string, path: string, agentId: string, nonce: string, timestamp: number, bodyHash: string): string {
  return ["AETHERNET-REQUEST-V1", `method:${method}`, `path:${path}`, `agent_id:${agentId}`, `nonce:${nonce}`, `timestamp:${timestamp}`, `body_sha256:${bodyHash}`].join("\n");
}

export async function signRequest(method: string, path: string, body: string, agentId: string, secretKey: Uint8Array): Promise<SignedHeaders> {
  const nonce = generateNonce();
  const timestamp = Math.floor(Date.now() / 1000);
  const bodyHash = await hashBody(body || "");
  const canonical = buildCanonicalString(method, path, agentId, nonce, timestamp, bodyHash);
  const signature = await signMessage(secretKey, new TextEncoder().encode(canonical));
  return {
    "X-Aethernet-Agent-ID": agentId,
    "X-Aethernet-Timestamp": String(timestamp),
    "X-Aethernet-Nonce": nonce,
    "X-Aethernet-Signature": bytesToHex(signature),
  };
}
