const DB_NAME = "aethernet_wallet";
const STORE_NAME = "wallets";
const DB_VERSION = 1;

export interface StoredWallet {
  agentId: string;
  publicKeyHex: string;
  encryptedSecretKey: ArrayBuffer;
  salt: ArrayBuffer;
  iv: ArrayBuffer;
  createdAt: string;
  name: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => { req.result.createObjectStore(STORE_NAME, { keyPath: "agentId" }); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function deriveKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
  );
}

export async function saveWallet(agentId: string, publicKeyHex: string, secretKey: Uint8Array, password: string, name: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt.buffer as ArrayBuffer);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, secretKey as BufferSource);
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put({
    agentId, publicKeyHex, encryptedSecretKey: encrypted,
    salt: salt.buffer, iv: iv.buffer, createdAt: new Date().toISOString(), name,
  });
  return new Promise((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
}

export async function loadWallet(agentId: string, password: string): Promise<Uint8Array> {
  const db = await openDB();
  const stored: StoredWallet = await new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(agentId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  if (!stored) throw new Error("Wallet not found");
  const key = await deriveKey(password, stored.salt);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(stored.iv) }, key, stored.encryptedSecretKey);
  return new Uint8Array(decrypted);
}

export async function listWallets(): Promise<StoredWallet[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteWallet(agentId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).delete(agentId);
  return new Promise((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
}

function abToB64(buf: ArrayBuffer): string { return btoa(String.fromCharCode(...new Uint8Array(buf))); }

export async function exportWallet(agentId: string): Promise<string> {
  const db = await openDB();
  const stored: StoredWallet = await new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(agentId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  if (!stored) throw new Error("Wallet not found");
  return JSON.stringify({
    version: 1, agentId: stored.agentId, publicKeyHex: stored.publicKeyHex,
    encryptedSecretKey: abToB64(stored.encryptedSecretKey),
    salt: abToB64(stored.salt), iv: abToB64(stored.iv),
    createdAt: stored.createdAt, name: stored.name,
  }, null, 2);
}
