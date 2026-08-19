import Link from "next/link";
import { getOptionalUser } from "@/lib/auth/session";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import { getServerTranslator } from "@/lib/i18n/get-locale";
import { Check } from "lucide-react";

export default async function TariffsPage() {
  const user = await getOptionalUser();
  const t = await getServerTranslator();

  const TIERS = [
    {
      name: "Standard",
      price: t("marketing.tariffs.priceFree"),
      description: t("marketing.tariffs.standard.description"),
      startingBalance: t("marketing.tariffs.standard.startingBalance"),
      leverage: t("marketing.tariffs.leverageUpTo50"),
      highlight: false,
      features: [
        t("marketing.tariffs.standard.feature1"),
        t("marketing.tariffs.standard.feature2"),
        t("marketing.tariffs.standard.feature3"),
        t("marketing.tariffs.standard.feature4"),
        t("marketing.tariffs.standard.feature5"),
      ],
    },
    {
      name: "Pro",
      price: t("marketing.tariffs.priceFree"),
      description: t("marketing.tariffs.pro.description"),
      startingBalance: t("marketing.tariffs.pro.startingBalance"),
      leverage: t("marketing.tariffs.leverageUpTo100"),
      highlight: true,
      features: [
        t("marketing.tariffs.pro.feature1"),
        t("marketing.tariffs.pro.feature2"),
        t("marketing.tariffs.pro.feature3"),
        t("marketing.tariffs.pro.feature4"),
        t("marketing.tariffs.pro.feature5"),
      ],
    },
    {
      name: "VIP",
      price: t("marketing.tariffs.priceFree"),
      description: t("marketing.tariffs.vip.description"),
      startingBalance: t("marketing.tariffs.vip.startingBalance"),
      leverage: t("marketing.tariffs.leverageUpTo100"),
      highlight: false,
      features: [
        t("marketing.tariffs.vip.feature1"),
        t("marketing.tariffs.vip.feature2"),
        t("marketing.tariffs.vip.feature3"),
        t("marketing.tariffs.vip.feature4"),
        t("marketing.tariffs.vip.feature5"),
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        user={
          user
            ? { firstName: user.firstName, lastName: user.lastName, email: user.email }
            : null
        }
      />

      <section className="relative overflow-hidden bg-green-glow">
        <div className="absolute inset-0 bg-grid-fade bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
        <div className="container relative py-20 text-center">
          <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
            {t("marketing.tariffs.hero.titlePrefix")}{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-300 bg-clip-text text-transparent">
              {t("marketing.tariffs.hero.titleHighlight")}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted">
            {t("marketing.tariffs.hero.subtitle")}
          </p>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col rounded-2xl border p-8 ${
                tier.highlight
                  ? "border-primary/50 bg-card shadow-glow"
                  : "border-border bg-card"
              }`}
            >
              {tier.highlight && (
                <span className="mb-4 w-fit rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                  {t("marketing.tariffs.mostPopular")}
                </span>
              )}
              <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
              <p className="mt-2 text-sm text-muted">{tier.description}</p>
              <div className="mt-6 text-3xl font-extrabold text-foreground">
                {tier.price}
              </div>

              <div className="mt-6 space-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">
                    {t("marketing.tariffs.startingBalance")}
                  </span>
                  <span className="font-medium text-foreground">
                    {tier.startingBalance}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t("marketing.tariffs.maxLeverage")}</span>
                  <span className="font-medium text-foreground">{tier.leverage}</span>
                </div>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                className="mt-8"
                variant={tier.highlight ? "primary" : "outline"}
                asChild
              >
                <Link href="/register">{t("marketing.tariffs.getStarted")}</Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted">
          {t("marketing.tariffs.contactPrompt")}{" "}
          <Link href="/support" className="text-primary hover:underline">
            {t("marketing.tariffs.contactSupport")}
          </Link>{" "}
          {t("marketing.tariffs.contactSuffix")}
        </p>
      </section>

      <Footer />
    </div>
  );
}
