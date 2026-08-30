import { requireAdmin } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { totalUnreadRequestCount } from "@/lib/admin/user-summary";

/** Powers the Admin sidebar's "Users" badge — total unread Verification/
 *  Deposit/Withdrawal requests across every user. */
export async function GET() {
  try {
    await requireAdmin();
    const total = await totalUnreadRequestCount();
    return apiSuccess({ total });
  } catch (error) {
    return handleApiError(error);
  }
}
