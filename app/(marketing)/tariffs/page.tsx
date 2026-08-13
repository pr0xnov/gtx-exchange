import Link from "next/link";
import { getOptionalUser } from "@/lib/auth/session";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const TIERS = [
  {
    name: "Standard",
    price: "Free",
    description: "Everything you need to start practicing.",
    startingBalance: "$10,000 virtual USDT",
    leverage: "Up to 1:50",
    highlight: false,
    features: [
      "Spot and Futures paper trading",
      "Live Binance market data",
      "Market and Limit orders",
      "Take Profit / Stop Loss",
      "Standard support",
    ],
  },
  {
    name: "Pro",
    price: "Free",
    description: "For traders who want more room to size positions.",
    startingBalance: "$25,000 virtual USDT",
    leverage: "Up to 1:100",
    highlight: true,
    features: [
      "Everything in Standard",
      "Higher starting balance",
      "Full 1:100 leverage on majors",
      "Priority order execution queue",
      "Priority support",
    ],
  },
  {
    name: "VIP",
    price: "Free",
    description: "For traders preparing for prop-desk style evaluations.",
    startingBalance: "$100,000 virtual USDT",
    leverage: "Up to 1:100",
    highlight: false,
    features: [
      "Everything in Pro",
      "Highest starting balance",
      "Balance reset on request",
      "Early access to new markets",
      "Dedicated support channel",
    ],
  },
];

export default async function TariffsPage() {
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
            Simple,{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-300 bg-clip-text text-transparent">
              free tariffs
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted">
            GTX never charges real money — every tier only changes your starting virtual
            balance and leverage cap. Pick the one that matches what you're training for.
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
                  Most popular
                </span>
              )}
              <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
              <p className="mt-2 text-sm text-muted">{tier.description}</p>
              <div className="mt-6 text-3xl font-extrabold text-foreground">
                {tier.price}
              </div>

              <div className="mt-6 space-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Starting balance</span>
                  <span className="font-medium text-foreground">
                    {tier.startingBalance}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Max leverage</span>
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
                <Link href="/register">Get started</Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/support" className="text-primary hover:underline">
            Contact support
          </Link>{" "}
          to request a tier change.
        </p>
      </section>

      <Footer />
    </div>
  );
}
