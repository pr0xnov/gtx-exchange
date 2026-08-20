import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";

/** Settings page hydration: profile fields + the authenticated user's own
 *  UserSettings row — never another user's, since requireUser() resolves
 *  strictly from the session cookie, not any client-supplied id. */
export async function GET() {
  try {
    const user = await requireUser();

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    return apiSuccess({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      pendingEmail: user.pendingEmail,
      settings: {
        language: settings.language,
        theme: settings.theme,
        twoFactorOn: settings.twoFactorOn,
        notifyEmail: settings.notifyEmail,
        notifyPush: settings.notifyPush,
        notifyMarket: settings.notifyMarket,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
