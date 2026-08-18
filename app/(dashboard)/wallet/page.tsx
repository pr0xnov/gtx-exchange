import { WalletOverview } from "@/components/wallet/wallet-overview";

export default function WalletPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Wallet</h1>
      <WalletOverview />
    </div>
  );
}
