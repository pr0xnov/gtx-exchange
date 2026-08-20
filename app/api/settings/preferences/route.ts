import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { preferencesUpdateSchema } from "@/lib/validation/settings";
import { apiSuccess, handleApiError } from "@/lib/api-response";

/** Backs every Settings toggle/select that isn't security-sensitive
 *  (language, theme, the 3 notification switches) — one endpoint since
 *  they're all just independent UserSettings columns a client may update
 *  one or several of at a time (e.g. ThemeProvider's own fire-and-forget
 *  PATCH only ever sends { theme }). */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const input = preferencesUpdateSchema.parse(body);

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: input,
      create: { userId: user.id, ...input },
    });

    return apiSuccess({
      language: settings.language,
      theme: settings.theme,
      notifyEmail: settings.notifyEmail,
      notifyPush: settings.notifyPush,
      notifyMarket: settings.notifyMarket,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
