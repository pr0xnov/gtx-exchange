import { WalletOverview } from "@/components/wallet/wallet-overview";
import { getServerTranslator } from "@/lib/i18n/get-locale";

export default async function WalletPage() {
  const t = await getServerTranslator();

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {t("wallet.page.title")}
      </h1>
      <WalletOverview />
    </div>
  );
}
