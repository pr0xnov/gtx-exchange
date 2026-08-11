import { Navbar } from "@/components/layout/navbar";
import { MarketsClient } from "@/components/markets/markets-client";

export default function MarketsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <MarketsClient />
    </div>
  );
}
