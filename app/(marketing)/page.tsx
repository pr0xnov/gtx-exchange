import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { PhoneMockup } from "@/components/marketing/phone-mockup";
import { StatsBar } from "@/components/marketing/stats-bar";
import { PopularPairs } from "@/components/marketing/popular-pairs";
import { Footer } from "@/components/marketing/footer";
import { ShieldCheck, Zap, LineChart, Wallet } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Zero risk, real conditions",
    description:
      "Trade with live market prices and a realistic order book — without ever risking real capital.",
  },
  {
    icon: LineChart,
    title: "Professional charting",
    description:
      "Candlestick charts, multiple timeframes, and volume — the same tools used on institutional desks.",
  },
  {
    icon: Wallet,
    title: "$10,000 virtual balance",
    description:
      "Every new account starts with $10,000 in virtual USDT so you can practice sizing and risk management.",
  },
  {
    icon: ShieldCheck,
    title: "Built-in risk controls",
    description:
      "Set Take Profit and Stop Loss on every position to learn disciplined trade management from day one.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-green-glow">
        <div className="absolute inset-0 bg-grid-fade bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
        <div className="container relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Earn on the best{" "}
              <span className="bg-gradient-to-r from-primary to-emerald-300 bg-clip-text text-transparent">
                financial assets
              </span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
              Reliable, simple, innovative. Trade the most popular assets in Europe:
              S&amp;P/ASX 200, Bitcoin, EUR/USD, with our CFD-style paper trading
              service.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Button size="lg" asChild>
                <Link href="/register">Start trading</Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/markets">View markets</Link>
              </Button>
            </div>
          </div>

          <PhoneMockup />
        </div>

        <StatsBar />
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="mb-12 max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Why traders choose GTX
          </h2>
          <p className="mt-3 text-muted">
            Everything you need to learn the mechanics of trading, with none of the
            downside.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular pairs */}
      <section className="container pb-20">
        <PopularPairs />
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-10 text-center sm:p-16">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Ready to start trading?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            Create a free account and get $10,000 in virtual funds instantly. No
            card, no risk.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/register">Create free account</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
