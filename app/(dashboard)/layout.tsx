import { getOptionalUserAllowingRefresh } from "@/lib/auth/session";
import { Navbar } from "@/components/layout/navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOptionalUserAllowingRefresh();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar
        user={
          user
            ? { firstName: user.firstName, lastName: user.lastName, email: user.email }
            : null
        }
      />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
