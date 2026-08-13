import { getOptionalUser } from "@/lib/auth/session";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/marketing/footer";
import { ShieldCheck, Target, Users, Sparkles } from "lucide-react";

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Zero risk",
    description:
      "Every account trades with virtual funds only. There is no path from GTX to a real wallet or bank account — the platform exists purely to practice on.",
  },
  {
    icon: Target,
    title: "Real conditions",
    description:
      "Prices, order books, and P&L are computed against live Binance market data, so the mechanics you learn translate directly to real trading.",
  },
  {
    icon: Users,
    title: "Built for learning",
    description:
      "From leverage and liquidation to limit orders and portfolio tracking, GTX mirrors the tools of a real exchange so mistakes stay free.",
  },
  {
    icon: Sparkles,
    title: "Always improving",
    description:
      "We ship new markets, order types, and terminal features regularly based on what our community of practicing traders asks for.",
  },
];

export default async function AboutPage() {
  const user = await getOptionalUser();

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
            About{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-300 bg-clip-text text-transparent">
              GTX
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted">
            GTX is a paper-trading platform that lets anyone practice crypto, forex, and
            CFD-style trading against real market prices — without risking a single
            dollar.
          </p>
        </div>
      </section>

      <section className="container py-16">
        <div className="mb-12 max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Why we built it
          </h2>
          <p className="mt-3 text-muted">
            Most people learn to trade the expensive way: with real money, on their first
            attempt. GTX gives traders a realistic simulator to build intuition for order
            types, leverage, and risk management before a single dollar is ever at stake.
          </p>
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
              <p className="mt-1 text-sm text-muted">virtual balance on signup</p>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-foreground">1:100</div>
              <p className="mt-1 text-sm text-muted">maximum leverage supported</p>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-foreground">Live</div>
              <p className="mt-1 text-sm text-muted">prices streamed from Binance</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
