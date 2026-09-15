/**
 * Admin Panel support queue (app/api/admin/support/conversations/**):
 * requireAdmin() gating (a plain USER must never reach any of this),
 * listing/filtering, replying, and closing a conversation.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { signAccessToken } from "@/lib/auth/jwt";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";
import { GET as listConversations } from "@/app/api/admin/support/conversations/route";
import {
  GET as getConversation,
  PATCH as patchConversation,
} from "@/app/api/admin/support/conversations/[id]/route";
import { POST as adminReply } from "@/app/api/admin/support/conversations/[id]/messages/route";
import { POST as createConversation } from "@/app/api/support/conversations/route";
import { POST as sendUserMessage } from "@/app/api/support/conversations/[id]/messages/route";
import { resetDatabase, seedUserWithWallet } from "./helpers";
import type { User } from "@prisma/client";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

function loginAs(user: User) {
  const token = signAccessToken({ sub: user.id, email: user.email });
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name === ACCESS_COOKIE ? { name, value: token } : undefined),
  } as never);
}

async function seedAdmin() {
  const admin = await seedUserWithWallet(0);
  await prisma.user.update({ where: { id: admin.id }, data: { role: "ADMIN" } });
  return admin;
}

function postJson(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function patchJson(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function withParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function seedUserConversation(owner: User, category = "DEPOSIT") {
  loginAs(owner);
  const res = await createConversation(
    postJson("http://test/api/support/conversations", { category })
  );
  return (await res.json()).data.id as string;
}

beforeEach(async () => {
  await resetDatabase();
});

afterEach(() => {
  vi.mocked(cookies).mockReset();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("A plain USER is rejected from every admin support route", () => {
  it("403s on list/detail/reply/close", async () => {
    const owner = await seedUserWithWallet(0);
    const conversationId = await seedUserConversation(owner);
    const plainUser = await seedUserWithWallet(0);
    loginAs(plainUser);

    expect(
      (
        await listConversations(
          new NextRequest("http://test/api/admin/support/conversations")
        )
      ).status
    ).toBe(403);

    expect(
      (
        await getConversation(
          new NextRequest(
            `http://test/api/admin/support/conversations/${conversationId}`
          ),
          withParams(conversationId)
        )
      ).status
    ).toBe(403);

    expect(
      (
        await adminReply(
          postJson(
            `http://test/api/admin/support/conversations/${conversationId}/messages`,
            { message: "hi" }
          ),
          withParams(conversationId)
        )
      ).status
    ).toBe(403);

    expect(
      (
        await patchConversation(
          patchJson(`http://test/api/admin/support/conversations/${conversationId}`, {
            status: "CLOSED",
          }),
          withParams(conversationId)
        )
      ).status
    ).toBe(403);
  });
});

describe("Admin queue listing", () => {
  it("lists every conversation with the owning user's info and a last-message preview", async () => {
    const admin = await seedAdmin();
    const owner = await seedUserWithWallet(0);
    const conversationId = await seedUserConversation(owner, "SECURITY");
    loginAs(owner);
    await sendUserMessage(
      postJson(`http://test/api/support/conversations/${conversationId}/messages`, {
        message: "My account was locked",
      }),
      withParams(conversationId)
    );

    loginAs(admin);
    const res = await listConversations(
      new NextRequest("http://test/api/admin/support/conversations")
    );
    const rows = (await res.json()).data;
    expect(rows).toHaveLength(1);
    expect(rows[0].category).toBe("SECURITY");
    expect(rows[0].user.email).toBe(owner.email);
    expect(rows[0].messageCount).toBe(1);
    expect(rows[0].lastMessage.message).toBe("My account was locked");
  });

  it("?status=OPEN excludes closed conversations", async () => {
    const admin = await seedAdmin();
    const owner = await seedUserWithWallet(0);
    const conversationId = await seedUserConversation(owner);
    await prisma.supportConversation.update({
      where: { id: conversationId },
      data: { status: "CLOSED" },
    });

    loginAs(admin);
    const res = await listConversations(
      new NextRequest("http://test/api/admin/support/conversations?status=OPEN")
    );
    expect((await res.json()).data).toEqual([]);
  });
});

describe("Admin reply and close", () => {
  it("an admin reply is stored as senderType ADMIN and visible in the thread", async () => {
    const admin = await seedAdmin();
    const owner = await seedUserWithWallet(0);
    const conversationId = await seedUserConversation(owner);

    loginAs(admin);
    const replyRes = await adminReply(
      postJson(`http://test/api/admin/support/conversations/${conversationId}/messages`, {
        message: "We're looking into it",
      }),
      withParams(conversationId)
    );
    expect(replyRes.status).toBe(201);

    const detailRes = await getConversation(
      new NextRequest(`http://test/api/admin/support/conversations/${conversationId}`),
      withParams(conversationId)
    );
    const detail = (await detailRes.json()).data;
    expect(detail.messages).toHaveLength(1);
    expect(detail.messages[0].senderType).toBe("ADMIN");
    expect(detail.messages[0].message).toBe("We're looking into it");
  });

  it("closing a conversation sets status CLOSED and removes it from the OPEN filter", async () => {
    const admin = await seedAdmin();
    const owner = await seedUserWithWallet(0);
    const conversationId = await seedUserConversation(owner);

    loginAs(admin);
    const closeRes = await patchConversation(
      patchJson(`http://test/api/admin/support/conversations/${conversationId}`, {
        status: "CLOSED",
      }),
      withParams(conversationId)
    );
    expect(closeRes.status).toBe(200);

    const conversation = await prisma.supportConversation.findUniqueOrThrow({
      where: { id: conversationId },
    });
    expect(conversation.status).toBe("CLOSED");

    const openList = await listConversations(
      new NextRequest("http://test/api/admin/support/conversations?status=OPEN")
    );
    expect((await openList.json()).data).toEqual([]);
  });

  it("replying to a closed conversation does not silently reopen it", async () => {
    const admin = await seedAdmin();
    const owner = await seedUserWithWallet(0);
    const conversationId = await seedUserConversation(owner);
    await prisma.supportConversation.update({
      where: { id: conversationId },
      data: { status: "CLOSED" },
    });

    loginAs(admin);
    await adminReply(
      postJson(`http://test/api/admin/support/conversations/${conversationId}/messages`, {
        message: "Following up",
      }),
      withParams(conversationId)
    );

    const conversation = await prisma.supportConversation.findUniqueOrThrow({
      where: { id: conversationId },
    });
    expect(conversation.status).toBe("CLOSED");
  });

  it("returns 404 for a conversation that doesn't exist", async () => {
    const admin = await seedAdmin();
    loginAs(admin);

    expect(
      (
        await getConversation(
          new NextRequest("http://test/api/admin/support/conversations/does-not-exist"),
          withParams("does-not-exist")
        )
      ).status
    ).toBe(404);

    expect(
      (
        await patchConversation(
          patchJson("http://test/api/admin/support/conversations/does-not-exist", {
            status: "CLOSED",
          }),
          withParams("does-not-exist")
        )
      ).status
    ).toBe(404);
  });
});
