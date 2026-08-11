import { Monitor, Smartphone, Apple } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PLATFORMS = [
  { icon: Monitor, name: "Windows", desc: "Desktop trading terminal" },
  { icon: Apple, name: "macOS", desc: "Desktop trading terminal" },
  { icon: Smartphone, name: "iOS / Android", desc: "Trade on the go" },
];

export default function DownloadsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-foreground">Downloads</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {PLATFORMS.map((p) => (
          <Card key={p.name}>
            <CardHeader>
              <p.icon className="h-8 w-8 text-primary" />
            </CardHeader>
            <CardContent>
              <CardTitle>{p.name}</CardTitle>
              <p className="mt-1 mb-4 text-sm text-muted">{p.desc}</p>
              <Button variant="outline" size="sm" className="w-full">
                Download
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
