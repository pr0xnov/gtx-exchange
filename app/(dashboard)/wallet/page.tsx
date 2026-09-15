import { WalletOverview } from "@/components/wallet/wallet-overview";
import { PageHero } from "@/components/shared/page-hero";
import { getServerTranslator } from "@/lib/i18n/get-locale";

export default async function WalletPage() {
  const t = await getServerTranslator();

  return (
    <>
      <PageHero
        title={t("wallet.page.title")}
        subtitle={t("wallet.page.subtitle")}
        compact
      />
      <div className="mx-auto max-w-6xl p-6">
        <WalletOverview />
      </div>
    </>
  );
}
