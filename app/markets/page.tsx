import { getOptionalUser } from "@/lib/auth/session";
import { Navbar } from "@/components/layout/navbar";
import { MarketsClient } from "@/components/markets/markets-client";

export default async function MarketsPage() {
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
      <MarketsClient />
    </div>
  );
}
