"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Mail, Phone } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const FAQ = [
  {
    q: "Is GTX a real cryptocurrency exchange?",
    a: "No. GTX is a paper trading simulator. All balances are virtual and no real money is ever deposited, traded, or withdrawn.",
  },
  {
    q: "How do I reset my virtual balance?",
    a: "Contact support and we'll reset your account back to the starting 10,000 USDT balance.",
  },
  {
    q: "Where do the prices come from?",
    a: "Live prices are streamed directly from Binance's public market data feed, so charts reflect real market conditions.",
  },
  {
    q: "What leverage is available?",
    a: "You can trade with up to 1:100 leverage on supported pairs, matching real CFD-style trading conditions.",
  },
];

export default function SupportPage() {
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Your message has been sent. We'll reply within 24 hours.");
    setMessage("");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-foreground">Support</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contact us</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Subject</Label>
                <Input className="mt-1.5" placeholder="What can we help with?" required />
              </div>
              <div>
                <Label>Message</Label>
                <textarea
                  className="mt-1.5 min-h-[120px] w-full rounded-xl border border-border bg-surface p-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Describe your issue..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>
              <Button type="submit">Send message</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Get in touch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-muted">
              <MessageCircle className="h-4 w-4 text-primary" />
              Live chat, 24/7
            </div>
            <div className="flex items-center gap-3 text-sm text-muted">
              <Mail className="h-4 w-4 text-primary" />
              support@gtx.com
            </div>
            <div className="flex items-center gap-3 text-sm text-muted">
              <Phone className="h-4 w-4 text-primary" />
              +1 (800) 555-0199
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Frequently asked questions</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-3">
              <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
                {item.q}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
