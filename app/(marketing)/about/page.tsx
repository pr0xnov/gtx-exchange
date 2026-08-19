import { getOptionalUser } from "@/lib/auth/session";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/marketing/footer";
import { getServerTranslator } from "@/lib/i18n/get-locale";
import { ShieldCheck, Target, Users, Sparkles } from "lucide-react";

export default async function AboutPage() {
  const user = await getOptionalUser();
  const t = await getServerTranslator();

  const VALUES = [
    {
      icon: ShieldCheck,
      title: t("marketing.about.values.zeroRisk.title"),
      description: t("marketing.about.values.zeroRisk.description"),
    },
    {
      icon: Target,
      title: t("marketing.about.values.realConditions.title"),
      description: t("marketing.about.values.realConditions.description"),
    },
    {
      icon: Users,
      title: t("marketing.about.values.builtForLearning.title"),
      description: t("marketing.about.values.builtForLearning.description"),
    },
    {
      icon: Sparkles,
      title: t("marketing.about.values.alwaysImproving.title"),
      description: t("marketing.about.values.alwaysImproving.description"),
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
            {t("marketing.about.hero.titlePrefix")}{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-300 bg-clip-text text-transparent">
              GTX
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted">
            {t("marketing.about.hero.subtitle")}
          </p>
        </div>
      </section>

      <section className="container py-16">
        <div className="mb-12 max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            {t("marketing.about.why.title")}
          </h2>
          <p className="mt-3 text-muted">{t("marketing.about.why.description")}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{v.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{v.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-24">
        <div className="rounded-3xl border border-border bg-card p-10 sm:p-16">
          <div className="grid gap-10 sm:grid-cols-3">
            <div>
              <div className="text-3xl font-extrabold text-foreground">$10,000</div>
              <p className="mt-1 text-sm text-muted">
                {t("marketing.about.stats.balance.label")}
              </p>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-foreground">1:100</div>
              <p className="mt-1 text-sm text-muted">
                {t("marketing.about.stats.leverage.label")}
              </p>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-foreground">
                {t("marketing.about.stats.live.value")}
              </div>
              <p className="mt-1 text-sm text-muted">
                {t("marketing.about.stats.live.label")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
