import { getOptionalUser } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOptionalUser();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar
        user={user ? { firstName: user.firstName, lastName: user.lastName } : null}
      />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
