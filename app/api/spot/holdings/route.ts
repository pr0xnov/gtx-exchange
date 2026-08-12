import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await requireUser();

    const holdings = await prisma.spotHolding.findMany({
      where: { userId: user.id, quantity: { gt: 0 } },
      include: { asset: true },
      orderBy: { updatedAt: "desc" },
    });

    const data = holdings.map((h) => {
      const quantity = Number(h.quantity);
      const price = Number(h.asset.lastPrice);
      return {
        symbol: h.asset.symbol,
        displaySymbol: h.asset.displaySymbol || h.asset.symbol,
        quantity,
        price,
        value: quantity * price,
      };
    });

    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}
