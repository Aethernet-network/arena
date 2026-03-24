import * as ed from "@noble/ed25519";

// sha512 sync is needed by @noble/ed25519 — use a simple implementation
// that works in all browsers via the SubtleCrypto API fallback
try {
  // Try to set sha512Sync if the property exists
  const etc = ed.etc as Record<string, unknown>;
  if (!etc.sha512Sync) {
    // Use a sync polyfill — not ideal but works for signing
    // @noble/ed25519 also supports async via sha512Async
    etc.sha512Async = async (...msgs: Uint8Array[]) => {
      const merged = concatBytes(...msgs);
      const hash = await crypto.subtle.digest("SHA-512", merged.buffer as unknown as ArrayBuffer);
      return new Uint8Array(hash);
    };
  }
} catch {}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const len = arrays.reduce((s, a) => s + a.length, 0);
  const result = new Uint8Array(len);
  let offset = 0;
  for (const arr of arrays) { result.set(arr, offset); offset += arr.length; }
  return result;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return bytes;
}

export interface WalletKeypair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  agentId: string;
}

export async function generateKeypair(): Promise<WalletKeypair> {
  const seed = ed.utils.randomSecretKey();
  const publicKey = await ed.getPublicKeyAsync(seed);
  const secretKey = new Uint8Array(64);
  secretKey.set(seed);
  secretKey.set(publicKey, 32);
  return { publicKey, secretKey, agentId: bytesToHex(publicKey) };
}

export async function keypairFromSeed(seed: Uint8Array): Promise<WalletKeypair> {
  const publicKey = await ed.getPublicKeyAsync(seed);
  const secretKey = new Uint8Array(64);
  secretKey.set(seed);
  secretKey.set(publicKey, 32);
  return { publicKey, secretKey, agentId: bytesToHex(publicKey) };
}

export async function signMessage(secretKey: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const seed = secretKey.slice(0, 32);
  return ed.signAsync(message, seed);
}

export async function hashBody(body: string): Promise<string> {
  const data = new TextEncoder().encode(body);
  const hash = await crypto.subtle.digest("SHA-256", data.buffer as unknown as ArrayBuffer);
  return bytesToHex(new Uint8Array(hash));
}

export function publicKeyToBase64(publicKey: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < publicKey.length; i++) binary += String.fromCharCode(publicKey[i]);
  return btoa(binary);
}

export { bytesToHex, hexToBytes };
