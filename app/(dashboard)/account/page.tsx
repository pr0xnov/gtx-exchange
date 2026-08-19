import Link from "next/link";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { AccountInfoPanel } from "@/components/dashboard/account-info-panel";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Button } from "@/components/ui/button";
import { getServerTranslator } from "@/lib/i18n/get-locale";

export default async function AccountPage() {
  const t = await getServerTranslator();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <SummaryCards />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <AccountInfoPanel />
          <Button size="lg" asChild>
            <Link href="/deposit">{t("account.makeDeposit")}</Link>
          </Button>
        </div>
        <RecentTransactions />
      </div>
    </div>
  );
}
