import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { WalletKeypair } from "./crypto";
import { setActiveWallet, clearActiveWallet } from "../services/api";

interface WalletState {
  keypair: WalletKeypair | null;
  walletName: string;
  isLocked: boolean;
  connect: (keypair: WalletKeypair, name: string) => void;
  disconnect: () => void;
  lock: () => void;
}

const WalletContext = createContext<WalletState>({
  keypair: null, walletName: "", isLocked: true,
  connect: () => {}, disconnect: () => {}, lock: () => {},
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [keypair, setKeypair] = useState<WalletKeypair | null>(null);
  const [walletName, setWalletName] = useState("");
  const [isLocked, setIsLocked] = useState(true);

  const connect = useCallback((kp: WalletKeypair, name: string) => {
    setKeypair(kp);
    setWalletName(name);
    setIsLocked(false);
    setActiveWallet(kp.agentId, kp.secretKey);
  }, []);

  const disconnect = useCallback(() => {
    setKeypair(null);
    setWalletName("");
    setIsLocked(true);
    clearActiveWallet();
  }, []);

  const lock = useCallback(() => {
    setKeypair(null);
    setIsLocked(true);
    clearActiveWallet();
  }, []);

  // Inactivity lock — 10 minutes
  useEffect(() => {
    if (!keypair) return;
    let timer: number;
    const reset = () => { clearTimeout(timer); timer = window.setTimeout(() => lock(), 10 * 60 * 1000); };
    window.addEventListener("mousemove", reset);
    window.addEventListener("keydown", reset);
    reset();
    return () => { clearTimeout(timer); window.removeEventListener("mousemove", reset); window.removeEventListener("keydown", reset); };
  }, [keypair, lock]);

  return (
    <WalletContext.Provider value={{ keypair, walletName, isLocked, connect, disconnect, lock }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() { return useContext(WalletContext); }
