import { getOptionalUser } from "@/lib/auth/session";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/marketing/footer";
import { ContactForm } from "@/components/marketing/contact-form";
import { getServerTranslator } from "@/lib/i18n/get-locale";
import { MessageCircle, Mail, Phone, MapPin } from "lucide-react";

export default async function ContactsPage() {
  const user = await getOptionalUser();
  const t = await getServerTranslator();

  const CHANNELS = [
    {
      icon: MessageCircle,
      title: t("marketing.contacts.channels.liveChat.title"),
      detail: t("marketing.contacts.channels.liveChat.detail"),
    },
    {
      icon: Mail,
      title: t("marketing.contacts.channels.email.title"),
      detail: "support@gtx.com",
    },
    {
      icon: Phone,
      title: t("marketing.contacts.channels.phone.title"),
      detail: "+1 (800) 555-0199",
    },
    {
      icon: MapPin,
      title: t("marketing.contacts.channels.office.title"),
      detail: "1 Market Street, San Francisco, CA",
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
            {t("marketing.contacts.hero.titlePrefix")}{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-300 bg-clip-text text-transparent">
              {t("marketing.contacts.hero.titleHighlight")}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted">
            {t("marketing.contacts.hero.subtitle")}
          </p>
        </div>
      </section>

      <section className="container grid gap-6 py-16 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-8 lg:col-span-2">
          <h2 className="mb-6 text-lg font-semibold text-foreground">
            {t("marketing.contacts.form.title")}
          </h2>
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
