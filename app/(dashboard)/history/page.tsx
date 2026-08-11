import { HistoryTable } from "@/components/dashboard/history-table";

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">History</h1>
      <HistoryTable />
    </div>
  );
}
