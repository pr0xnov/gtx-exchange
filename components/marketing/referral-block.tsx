import { Gift, Users, ArrowRight } from "lucide-react";
import { getServerTranslator } from "@/lib/i18n/get-locale";

export async function ReferralBlock() {
  const t = await getServerTranslator();

  const depositLabel = t("marketing.home.referral.depositLabel");
  const receiveLabel = t("marketing.home.referral.receiveLabel");

  const STEPS = [
    {
      icon: Users,
      label: depositLabel,
      value: t("marketing.home.referral.deposit1Value"),
    },
    {
      icon: Gift,
      label: receiveLabel,
      value: t("marketing.home.referral.receive1Value"),
    },
    {
      icon: Users,
      label: depositLabel,
      value: t("marketing.home.referral.deposit2Value"),
    },
    {
      icon: Gift,
      label: receiveLabel,
      value: t("marketing.home.referral.receive2Value"),
    },
  ];

  return (
    <section className="container py-16">
      <div className="grid items-center gap-10 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-8 sm:p-12 lg:grid-cols-2">
        <div>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Gift className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
            {t("marketing.home.referral.titleLine1")}
            <br />
            {t("marketing.home.referral.titleLine2Prefix")}
            <span className="text-primary">
              {t("marketing.home.referral.titleHighlight")}
            </span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            {t("marketing.home.referral.description")}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card/80 px-4 py-3 text-center">
                <step.icon className="h-4 w-4 text-primary" />
                <div className="text-[11px] text-muted">{step.label}</div>
                <div className="font-tabular text-sm font-semibold text-foreground">
                  {step.value}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
