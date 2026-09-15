import { getOptionalUser } from "@/lib/auth/session";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/marketing/footer";
import { ContactsSupportSection } from "@/components/marketing/contacts-support-section";
import { PageHero } from "@/components/shared/page-hero";
import { getServerTranslator } from "@/lib/i18n/get-locale";

export default async function ContactsPage() {
  const user = await getOptionalUser();
  const t = await getServerTranslator();

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        user={
          user
            ? { firstName: user.firstName, lastName: user.lastName, email: user.email }
            : null
        }
      />

      <PageHero
        title={t("marketing.contacts.hero.title")}
        subtitle={t("marketing.contacts.hero.subtitle")}
      />

      <ContactsSupportSection isAuthenticated={Boolean(user)} />

      <Footer />
    </div>
  );
}
