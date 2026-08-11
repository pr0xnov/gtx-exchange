import { getOptionalUser } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardTopbar } from "@/components/layout/dashboard-topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOptionalUser();
  const initials = user ? `${user.firstName} ${user.lastName}` : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardTopbar userInitials={initials} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
