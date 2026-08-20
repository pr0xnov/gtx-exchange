import { getOptionalUser } from "@/lib/auth/session";
import { AdminForbidden } from "@/components/admin/admin-forbidden";
import { AdminsManager } from "@/components/admin/admins-manager";

/**
 * A regular ADMIN's sidebar link to this page is already hidden (see
 * components/admin/admin-sidebar.tsx), but that's a UX nicety, not the
 * security boundary — nothing stops an ADMIN from typing this URL
 * directly, so this Server Component re-checks role itself before
 * rendering anything, exactly like /api/admin/admins/** does with
 * requireSuperAdmin() on the API side.
 */
export default async function AdminAdminsPage() {
  const user = await getOptionalUser();
  if (user?.role !== "SUPER_ADMIN") {
    return <AdminForbidden />;
  }

  return <AdminsManager />;
}
