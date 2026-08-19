import { HistoryTable } from "@/components/dashboard/history-table";
import { getServerTranslator } from "@/lib/i18n/get-locale";

export default async function HistoryPage() {
  const t = await getServerTranslator();

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {t("history.pageTitle")}
      </h1>
      <HistoryTable />
    </div>
  );
}
