/**
 * Verification resubmit after Reject — the actual bug this task exists to
 * fix. Root cause (confirmed via live testing against the real route, not
 * assumed): POST /api/verification itself was already correct — it always
 * deletes the user's existing VerificationDocument rows and creates fresh
 * ones (both defaulting to PENDING), so a resubmission genuinely does
 * flip REJECTED -> PENDING and clears the old rejectionReason. The real
 * failure was client-side: components/dashboard/verification-form.tsx
 * never pre-filled country/dateOfBirth/address from the user's own
 * already-saved profile, so a user resubmitting after rejection (who
 * reasonably assumes that info is still saved, per the task's own spec of
 * "старые сохранённые country/dateOfBirth/address корректно подставлены")
 * hit the form's own "missing info" client-side guard and the request
 * never reached the server at all.
 *
 * This file covers the server-side contract POST /api/verification must
 * uphold (PENDING -> REJECTED -> PENDING, reason clearing, new documents
 * reaching Admin) — the exact scenarios listed in this task's spec.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  POST as submitVerification,
  GET as getVerification,
} from "@/app/api/verification/route";
import { PATCH as decideVerification } from "@/app/api/admin/verification/[userId]/route";
import { resetDatabase, seedUserWithWallet } from "./helpers";
import type { UserWithWallet } from "./helpers";

vi.mock("@/lib/auth/session", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/auth/session")>("@/lib/auth/session");
  return { ...actual, requireUser: vi.fn(), requireAdmin: vi.fn() };
});

import { requireUser, requireAdmin } from "@/lib/auth/session";

function loginAsUser(user: UserWithWallet) {
  vi.mocked(requireUser).mockResolvedValue(user);
}

function loginAsAdmin(admin: UserWithWallet) {
  vi.mocked(requireAdmin).mockResolvedValue(admin);
}

function submitRequest(fields: {
  country: string;
  dateOfBirth: string;
  address: string;
  identityFile?: File;
  addressFile?: File;
}): NextRequest {
  const form = new FormData();
  form.set("country", fields.country);
  form.set("dateOfBirth", fields.dateOfBirth);
  form.set("address", fields.address);
  form.set(
    "identityFile",
    fields.identityFile ??
      new File([new Uint8Array([1, 2, 3])], "id.png", { type: "image/png" })
  );
  form.set(
    "addressFile",
    fields.addressFile ??
      new File([new Uint8Array([4, 5, 6])], "poa.png", { type: "image/png" })
  );
  return new NextRequest("http://test/api/verification", { method: "POST", body: form });
}

function patchRequest(body: unknown): NextRequest {
  return new NextRequest("http://test/x", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function readJson<T = unknown>(res: Response) {
  return (await res.json()) as { success: boolean; data?: T; error?: string };
}

interface VerificationStatus {
  status: string;
  rejectionReason: string | null;
  documents: { status: string; rejectionReason: string | null }[];
}

beforeEach(async () => {
  await resetDatabase();
});

afterEach(() => {
  vi.mocked(requireUser).mockReset();
  vi.mocked(requireAdmin).mockReset();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Scenario 1 — first submission then Reject", () => {
  it("submits to PENDING, then Admin Reject sets REJECTED with a visible reason", async () => {
    const user = await seedUserWithWallet(0);
    loginAsUser(user);

    const res = await submitVerification(
      submitRequest({ country: "US", dateOfBirth: "1990-01-01", address: "123 Main St" })
    );
    expect(res.status).toBe(201);

    const admin = await seedUserWithWallet(0);
    loginAsAdmin(admin);
    const rejectRes = await decideVerification(
      patchRequest({ decision: "REJECTED", reason: "Document is unclear" }),
      { params: Promise.resolve({ userId: user.id }) }
    );
    expect(rejectRes.status).toBe(200);

    loginAsUser(user);
    const status = await readJson<VerificationStatus>(await getVerification());
    expect(status.data!.status).toBe("REJECTED");
    expect(status.data!.rejectionReason).toBe("Document is unclear");
  });
});

describe("Scenario 2 — resubmit after Reject", () => {
  async function rejectedUser() {
    const user = await seedUserWithWallet(0);
    loginAsUser(user);
    await submitVerification(
      submitRequest({ country: "US", dateOfBirth: "1990-01-01", address: "123 Main St" })
    );
    const oldDocs = await prisma.verificationDocument.findMany({
      where: { userId: user.id },
    });

    const admin = await seedUserWithWallet(0);
    loginAsAdmin(admin);
    await decideVerification(
      patchRequest({ decision: "REJECTED", reason: "Document is unclear" }),
      {
        params: Promise.resolve({ userId: user.id }),
      }
    );

    loginAsUser(user);
    return { user, oldDocIds: oldDocs.map((d) => d.id) };
  }

  it("succeeds without error and flips REJECTED -> PENDING", async () => {
    await rejectedUser();

    const res = await submitVerification(
      submitRequest({ country: "US", dateOfBirth: "1990-01-01", address: "456 New St" })
    );
    expect(res.status).toBe(201);

    const status = await readJson<VerificationStatus>(await getVerification());
    expect(status.data!.status).toBe("PENDING");
  });

  it("clears the old rejection reason from the active status", async () => {
    await rejectedUser();

    await submitVerification(
      submitRequest({ country: "US", dateOfBirth: "1990-01-01", address: "456 New St" })
    );

    const status = await readJson<VerificationStatus>(await getVerification());
    expect(status.data!.rejectionReason).toBeNull();
    for (const doc of status.data!.documents) {
      expect(doc.rejectionReason).toBeNull();
      expect(doc.status).toBe("PENDING");
    }
  });

  it("replaces the old documents with new ones (new documents, not the old rejected rows)", async () => {
    const { user, oldDocIds } = await rejectedUser();

    await submitVerification(
      submitRequest({ country: "US", dateOfBirth: "1990-01-01", address: "456 New St" })
    );

    const currentDocs = await prisma.verificationDocument.findMany({
      where: { userId: user.id },
    });
    expect(currentDocs).toHaveLength(2);
    for (const doc of currentDocs) {
      expect(oldDocIds).not.toContain(doc.id);
    }
    for (const oldId of oldDocIds) {
      expect(
        await prisma.verificationDocument.findUnique({ where: { id: oldId } })
      ).toBeNull();
    }
  });

  it("Admin sees the new request as PENDING and can Approve/Reject it again", async () => {
    const { user } = await rejectedUser();
    await submitVerification(
      submitRequest({ country: "US", dateOfBirth: "1990-01-01", address: "456 New St" })
    );

    const admin = await seedUserWithWallet(0);
    loginAsAdmin(admin);
    const approveRes = await decideVerification(patchRequest({ decision: "APPROVED" }), {
      params: Promise.resolve({ userId: user.id }),
    });
    expect(approveRes.status).toBe(200);

    loginAsUser(user);
    const status = await readJson<VerificationStatus>(await getVerification());
    expect(status.data!.status).toBe("VERIFIED");
  });

  it("does not error even without retyping already-saved profile info (the root-cause guard, once fixed client-side, must still work server-side with that same data)", async () => {
    const { user } = await rejectedUser();

    // Simulates the form now correctly prefilling from the user's own
    // already-saved profile (see components/dashboard/verification-
    // form.tsx's initialCountry/initialDateOfBirth/initialAddress) rather
    // than sending blank fields.
    const saved = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const res = await submitVerification(
      submitRequest({
        country: saved.country ?? "",
        dateOfBirth: saved.dateOfBirth
          ? saved.dateOfBirth.toISOString().slice(0, 10)
          : "",
        address: saved.address ?? "",
      })
    );
    expect(res.status).toBe(201);
  });
});

describe("Security — userId always comes from requireUser(), never trusted input", () => {
  it("a user can only ever submit/resubmit their own verification (no userId in the request body at all)", async () => {
    const user = await seedUserWithWallet(0);
    loginAsUser(user);

    const form = new FormData();
    form.set("country", "US");
    form.set("dateOfBirth", "1990-01-01");
    form.set("address", "123 Main St");
    form.set("userId", "someone-elses-id"); // must be ignored — no such field is read
    form.set(
      "identityFile",
      new File([new Uint8Array([1])], "id.png", { type: "image/png" })
    );
    form.set(
      "addressFile",
      new File([new Uint8Array([2])], "poa.png", { type: "image/png" })
    );

    const res = await submitVerification(
      new NextRequest("http://test/api/verification", { method: "POST", body: form })
    );
    expect(res.status).toBe(201);

    const docs = await prisma.verificationDocument.findMany({
      where: { userId: user.id },
    });
    expect(docs).toHaveLength(2);
  });

  it("Approve/Reject requires requireAdmin() — rejected here means the route never even reaches the DB write", async () => {
    const user = await seedUserWithWallet(0);
    loginAsUser(user);
    await submitVerification(
      submitRequest({ country: "US", dateOfBirth: "1990-01-01", address: "123 Main St" })
    );

    vi.mocked(requireAdmin).mockRejectedValue(
      new (await import("@/lib/auth/session")).ForbiddenError("Admin access required")
    );
    const res = await decideVerification(patchRequest({ decision: "APPROVED" }), {
      params: Promise.resolve({ userId: user.id }),
    });
    expect(res.status).toBe(403);

    const docs = await prisma.verificationDocument.findMany({
      where: { userId: user.id },
    });
    expect(docs.every((d) => d.status === "PENDING")).toBe(true);
  });
});
