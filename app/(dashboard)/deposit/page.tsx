import { DepositForm } from "@/components/dashboard/deposit-form";
import { InfoPanel } from "@/components/dashboard/info-panel";
import { getServerTranslator } from "@/lib/i18n/get-locale";

export default async function DepositPage() {
  const t = await getServerTranslator();

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {t("deposit.pageTitle")}
      </h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <DepositForm />
        </div>
        <InfoPanel
          title={t("deposit.infoTitle")}
          items={[
            t("deposit.infoMinAmount"),
            t("deposit.infoCorrectDetails"),
            t("deposit.infoNetworkCorrect"),
            t("deposit.infoNoFee"),
          ]}
        />
      </div>
    </div>
  );
}
