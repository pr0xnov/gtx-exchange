import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminForbidden } from "@/components/admin/admin-forbidden";

/**
 * The real authorization gate for the whole /admin subtree — every page
 * under it renders through this layout, so there's exactly one place
 * that decides who gets in, always re-checked fresh from the DB (never
 * a cached/client-supplied role). middleware.ts only handles "redirect
 * to /login if not authenticated at all" (see its own comment on why the
 * role check can't safely live there); this is where role is actually
 * enforced.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getOptionalUser();
  if (!user) redirect("/login?redirect=/admin");

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return <AdminForbidden />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar role={user.role} />
      <main className="min-w-0 flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
