import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { verificationSchema } from "@/lib/validation/trading";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const input = verificationSchema.parse(body);

    const [identity, address] = await prisma.$transaction([
      prisma.verificationDocument.create({
        data: { userId: user.id, type: "IDENTITY", fileName: input.identityFileName },
      }),
      prisma.verificationDocument.create({
        data: { userId: user.id, type: "PROOF_OF_ADDRESS", fileName: input.addressFileName },
      }),
    ]);

    return apiSuccess({ identity, address }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const documents = await prisma.verificationDocument.findMany({
      where: { userId: user.id },
      orderBy: { uploadedAt: "desc" },
    });
    return apiSuccess(documents);
  } catch (error) {
    return handleApiError(error);
  }
}
