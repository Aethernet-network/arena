import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "../../wallet/context";
import { generateKeypair, publicKeyToBase64, keypairFromSeed } from "../../wallet/crypto";
import { saveWallet, loadWallet, listWallets, exportWallet, type StoredWallet } from "../../wallet/storage";
import { api } from "../../services/api";

const mono = "'IBM Plex Mono', monospace";
const body = "'Inter', sans-serif";
const heading = "'Space Grotesk', sans-serif";

type View = "choose" | "create" | "unlock" | "import";

export default function ConnectWallet({ onClose, onFunded }: { onClose: () => void; onFunded?: (agentId: string) => void }) {
  const { connect } = useWallet();
  const [view, setView] = useState<View>("choose");
  const [wallets, setWallets] = useState<StoredWallet[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Create state
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fundingState, setFundingState] = useState("");

  // Unlock state
  const [selectedWallet, setSelectedWallet] = useState<StoredWallet | null>(null);
  const [unlockPassword, setUnlockPassword] = useState("");

  useEffect(() => { listWallets().then(setWallets).catch(() => {}); }, []);

  async function handleCreate() {
    if (!name.trim() || !password || password !== confirm) {
      setError(password !== confirm ? "Passwords don't match" : "Name and password required");
      return;
    }
    setLoading(true); setError("");
    try {
      const kp = await generateKeypair();
      await saveWallet(kp.agentId, kp.agentId, kp.secretKey, password, name.trim());

      // Register on protocol — hard error if this fails
      const regParams = { agent_id: kp.agentId, public_key_b64: publicKeyToBase64(kp.publicKey) };
      console.log("registerAgent params:", regParams);
      const regResult = await api.registerAgent(regParams);

      // Activate wallet BEFORE faucet so signedFetch works
      connect(kp, name.trim());
      setLoading(false);

      // Wait for onboarding grant settlement
      if (regResult.grant_event_id) {
        setFundingState("Funding your wallet (50,000 AET)...");
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 3000));
          try {
            const ev = await api.getEvent(regResult.grant_event_id);
            if (ev.settlement_state === "Settled" || ev.settlement_state === "Adjusted") break;
          } catch {}
        }
        await new Promise((r) => setTimeout(r, 2000));
      }

      setFundingState("");

      // Refresh TopBar balance
      onFunded?.(kp.agentId);

      // Auto-download backup
      try {
        const backup = await exportWallet(kp.agentId);
        const blob = new Blob([backup], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `aethernet-wallet-${name.trim().toLowerCase().replace(/\s+/g, "-")}.json`;
        a.click(); URL.revokeObjectURL(url);
      } catch {}

      onClose();
    } catch (e: any) { setError(e.message || "Failed to create wallet"); }
    setLoading(false);
  }

  async function handleUnlock() {
    if (!selectedWallet || !unlockPassword) return;
    setLoading(true); setError("");
    try {
      const secretKey = await loadWallet(selectedWallet.agentId, unlockPassword);
      const kp = await keypairFromSeed(secretKey.slice(0, 32));
      connect(kp, selectedWallet.name);
      onClose();
    } catch {
      setError("Wrong password or corrupted wallet");
    }
    setLoading(false);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.agentId || !data.encryptedSecretKey) throw new Error("Invalid wallet file");
      // Prompt for password then save
      setView("unlock");
      setSelectedWallet({ ...data, encryptedSecretKey: b64ToArrayBuffer(data.encryptedSecretKey), salt: b64ToArrayBuffer(data.salt), iv: b64ToArrayBuffer(data.iv) } as StoredWallet);
    } catch (err: any) { setError(err.message || "Invalid file"); }
  }

  function b64ToArrayBuffer(b64: string): ArrayBuffer {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px", borderRadius: 8, fontSize: 13, fontFamily: body,
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
    color: "#fff", outline: "none", marginBottom: 12,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(5,7,12,0.92)", backdropFilter: "blur(20px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }}
        style={{ width: "100%", maxWidth: 420, borderRadius: 16, background: "rgba(15,18,30,0.98)", border: "1px solid rgba(255,255,255,0.06)", padding: 32, maxHeight: "80vh", overflowY: "auto" }}
      >
        <AnimatePresence mode="wait">
          {/* Choose */}
          {view === "choose" && (
            <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h3 style={{ fontFamily: heading, fontSize: 22, fontWeight: 600, color: "#fff", marginBottom: 8 }}>Connect Wallet</h3>
              <p style={{ fontFamily: body, fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.4)", marginBottom: 28 }}>
                Your keys never leave your browser. Encrypted with AES-256-GCM.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={() => setView("create")} style={{ padding: "14px 20px", borderRadius: 10, background: "linear-gradient(135deg, #00D4FF, #7B61FF)", color: "#000", fontFamily: heading, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", textAlign: "left" }}>
                  Create New Wallet
                  <div style={{ fontFamily: body, fontSize: 11, fontWeight: 400, color: "rgba(0,0,0,0.5)", marginTop: 4 }}>Generate Ed25519 keypair, register on protocol</div>
                </button>

                {wallets.length > 0 && (
                  <button onClick={() => setView("unlock")} style={{ padding: "14px 20px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#E8EDF2", fontFamily: heading, fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                    Unlock Existing ({wallets.length})
                    <div style={{ fontFamily: body, fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Decrypt a stored wallet</div>
                  </button>
                )}

                <label style={{ padding: "14px 20px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#E8EDF2", fontFamily: heading, fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                  Import Wallet File
                  <div style={{ fontFamily: body, fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Upload a wallet backup JSON</div>
                  <input type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
                </label>
              </div>
            </motion.div>
          )}

          {/* Create */}
          {/* Funding in progress */}
          {fundingState && (
            <motion.div key="funding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 48, height: 48, margin: "0 auto 20px", borderRadius: "50%", background: "rgba(255,184,0,0.08)", border: "1px solid rgba(255,184,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFB800", animation: "walletPulse 1.5s ease-in-out infinite" }} />
              </div>
              <div style={{ fontFamily: mono, fontSize: 13, color: "#FFB800", marginBottom: 8 }}>{fundingState}</div>
              <div style={{ fontFamily: mono, fontSize: 10, color: "#4A5568" }}>Settling through consensus...</div>
              <style>{`@keyframes walletPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>
            </motion.div>
          )}

          {view === "create" && !fundingState && (
            <motion.div key="create" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <button onClick={() => setView("choose")} style={{ fontFamily: mono, fontSize: 10, color: "rgba(255,255,255,0.2)", background: "none", border: "none", cursor: "pointer", marginBottom: 16 }}>← Back</button>
              <h3 style={{ fontFamily: heading, fontSize: 22, fontWeight: 600, color: "#fff", marginBottom: 8 }}>Create Wallet</h3>
              <p style={{ fontFamily: body, fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
                Generates an Ed25519 keypair and registers on the AetherNet protocol.
              </p>

              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 6 }}>WALLET NAME</div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Wallet" style={inputStyle} autoFocus />

              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 6 }}>PASSWORD</div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />

              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 6 }}>CONFIRM PASSWORD</div>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" style={inputStyle}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              />

              {error && <div style={{ fontFamily: mono, fontSize: 11, color: "#FF4D6A", marginBottom: 12 }}>{error}</div>}

              <button onClick={handleCreate} disabled={loading} style={{
                width: "100%", padding: "14px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: heading,
                background: loading ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg, #00D4FF, #7B61FF)",
                color: loading ? "#4A5568" : "#000", border: "none", cursor: loading ? "default" : "pointer", marginTop: 8,
              }}>{loading ? "Creating..." : "Create & Register"}</button>
            </motion.div>
          )}

          {/* Unlock */}
          {view === "unlock" && (
            <motion.div key="unlock" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <button onClick={() => { setView("choose"); setSelectedWallet(null); }} style={{ fontFamily: mono, fontSize: 10, color: "rgba(255,255,255,0.2)", background: "none", border: "none", cursor: "pointer", marginBottom: 16 }}>← Back</button>
              <h3 style={{ fontFamily: heading, fontSize: 22, fontWeight: 600, color: "#fff", marginBottom: 20 }}>Unlock Wallet</h3>

              {!selectedWallet && wallets.map((w) => (
                <div key={w.agentId} onClick={() => setSelectedWallet(w)} style={{
                  padding: "14px 16px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                  cursor: "pointer", marginBottom: 8, transition: "all 0.15s",
                }}>
                  <div style={{ fontFamily: heading, fontSize: 14, fontWeight: 600, color: "#E8EDF2" }}>{w.name}</div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: "#4A5568", marginTop: 4 }}>{w.agentId.slice(0, 16)}...</div>
                </div>
              ))}

              {selectedWallet && (
                <>
                  <div style={{ fontFamily: heading, fontSize: 14, color: "#E8EDF2", marginBottom: 4 }}>{selectedWallet.name}</div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: "#4A5568", marginBottom: 20 }}>{selectedWallet.agentId.slice(0, 24)}...</div>

                  <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 6 }}>PASSWORD</div>
                  <input type="password" value={unlockPassword} onChange={(e) => setUnlockPassword(e.target.value)} placeholder="••••••••"
                    style={inputStyle} autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }}
                  />

                  {error && <div style={{ fontFamily: mono, fontSize: 11, color: "#FF4D6A", marginBottom: 12 }}>{error}</div>}

                  <button onClick={handleUnlock} disabled={loading} style={{
                    width: "100%", padding: "14px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: heading,
                    background: loading ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg, #00D4FF, #7B61FF)",
                    color: loading ? "#4A5568" : "#000", border: "none", cursor: loading ? "default" : "pointer",
                  }}>{loading ? "Decrypting..." : "Unlock"}</button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
