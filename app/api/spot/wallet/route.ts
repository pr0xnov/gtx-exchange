import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await requireUser();

    const wallets = await prisma.spotWallet.findMany({
      where: { userId: user.id },
      orderBy: { currency: "asc" },
    });

    const data = wallets.map((w) => ({
      currency: w.currency,
      balance: Number(w.balance),
      locked: Number(w.locked),
    }));

    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}
