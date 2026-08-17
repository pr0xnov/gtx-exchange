import { WalletSummary } from "@/components/wallet/wallet-summary";
import { WalletAssetsTable } from "@/components/wallet/assets-table";

export default function WalletPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Wallet</h1>
      <WalletSummary />
      <WalletAssetsTable />
    </div>
  );
}
