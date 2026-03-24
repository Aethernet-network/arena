import { WalletProvider } from "./wallet/context";
import AllianceMapViewer from "./components/Map/AllianceMapViewer";

export default function App() {
  return (
    <WalletProvider>
      <AllianceMapViewer />
    </WalletProvider>
  );
}
