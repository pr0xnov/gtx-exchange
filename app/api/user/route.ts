import { requireUser } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await requireUser();
    return apiSuccess({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      login: user.login,
      accountType: user.accountType,
      leverageMax: user.leverageMax,
      wallet: user.wallet,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
