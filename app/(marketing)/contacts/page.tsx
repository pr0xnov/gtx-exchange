import { getOptionalUser } from "@/lib/auth/session";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/marketing/footer";
import { ContactForm } from "@/components/marketing/contact-form";
import { MessageCircle, Mail, Phone, MapPin } from "lucide-react";

const CHANNELS = [
  {
    icon: MessageCircle,
    title: "Live chat",
    detail: "Available 24/7 from your account dashboard",
  },
  {
    icon: Mail,
    title: "Email",
    detail: "support@gtx.com",
  },
  {
    icon: Phone,
    title: "Phone",
    detail: "+1 (800) 555-0199",
  },
  {
    icon: MapPin,
    title: "Office",
    detail: "1 Market Street, San Francisco, CA",
  },
];

export default async function ContactsPage() {
  const user = await getOptionalUser();

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        user={user ? { firstName: user.firstName, lastName: user.lastName } : null}
      />

      <section className="relative overflow-hidden bg-green-glow">
        <div className="absolute inset-0 bg-grid-fade bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
        <div className="container relative py-20 text-center">
          <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
            Get in{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-300 bg-clip-text text-transparent">
              touch
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted">
            Questions about the platform, a bug to report, or feedback on what to build
            next — we read everything.
          </p>
        </div>
      </section>

      <section className="container grid gap-6 py-16 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-8 lg:col-span-2">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Send a message</h2>
          <ContactForm />
        </div>

        <div className="space-y-4">
          {CHANNELS.map((c) => (
            <div key={c.title} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">{c.title}</h3>
              <p className="mt-1 text-sm text-muted">{c.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
