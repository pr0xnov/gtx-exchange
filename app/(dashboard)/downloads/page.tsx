import { Monitor, Smartphone, Apple } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getServerTranslator } from "@/lib/i18n/get-locale";
import type { DictionaryKey } from "@/lib/i18n/dictionaries";

const PLATFORMS: { icon: typeof Monitor; name: string; descKey: DictionaryKey }[] = [
  { icon: Monitor, name: "Windows", descKey: "downloads.desktopTerminal" },
  { icon: Apple, name: "macOS", descKey: "downloads.desktopTerminal" },
  { icon: Smartphone, name: "iOS / Android", descKey: "downloads.tradeOnTheGo" },
];

export default async function DownloadsPage() {
  const t = await getServerTranslator();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-foreground">{t("downloads.title")}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {PLATFORMS.map((p) => (
          <Card key={p.name}>
            <CardHeader>
              <p.icon className="h-8 w-8 text-primary" />
            </CardHeader>
            <CardContent>
              <CardTitle>{p.name}</CardTitle>
              <p className="mb-4 mt-1 text-sm text-muted">{t(p.descKey)}</p>
              <Button variant="outline" size="sm" className="w-full">
                {t("downloads.download")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
