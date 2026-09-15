/**
 * The /contacts support chat's user-facing API (app/api/support/
 * conversations/**): creating/reusing a conversation, sending messages,
 * and — critically — that a conversationId in the URL is never trusted
 * alone: every route re-verifies the conversation actually belongs to
 * the authenticated user before returning or writing anything.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { signAccessToken } from "@/lib/auth/jwt";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";
import {
  GET as listConversations,
  POST as createConversation,
} from "@/app/api/support/conversations/route";
import {
  GET as listMessages,
  POST as sendMessage,
} from "@/app/api/support/conversations/[id]/messages/route";
import { resetDatabase, seedUserWithWallet } from "./helpers";
import type { User } from "@prisma/client";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

function loginAs(user: User) {
  const token = signAccessToken({ sub: user.id, email: user.email });
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name === ACCESS_COOKIE ? { name, value: token } : undefined),
  } as never);
}

function loggedOut() {
  vi.mocked(cookies).mockResolvedValue({ get: () => undefined } as never);
}

function postJson(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function withParams(id: string) {
  return { params: Promise.resolve({ id }) };
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

describe("POST /api/support/conversations — create/reuse", () => {
  it("creates a new OPEN conversation in the chosen category", async () => {
    const user = await seedUserWithWallet(0);
    loginAs(user);

    const res = await createConversation(
      postJson("http://test/api/support/conversations", { category: "DEPOSIT" })
    );
    expect(res.status).toBe(201);
    const body = (await res.json()).data;
    expect(body.category).toBe("DEPOSIT");
    expect(body.status).toBe("OPEN");
  });

  it("reuses the existing OPEN conversation instead of creating a second one", async () => {
    const user = await seedUserWithWallet(0);
    loginAs(user);

    const first = await createConversation(
      postJson("http://test/api/support/conversations", { category: "DEPOSIT" })
    );
    const firstBody = (await first.json()).data;

    const second = await createConversation(
      postJson("http://test/api/support/conversations", { category: "TRADING" })
    );
    expect(second.status).toBe(200); // reused, not created
    const secondBody = (await second.json()).data;
    expect(secondBody.id).toBe(firstBody.id);
    expect(secondBody.category).toBe("DEPOSIT"); // unchanged — the ORIGINAL category sticks

    expect(await prisma.supportConversation.count({ where: { userId: user.id } })).toBe(
      1
    );
  });

  it("rejects an unknown category", async () => {
    const user = await seedUserWithWallet(0);
    loginAs(user);

    const res = await createConversation(
      postJson("http://test/api/support/conversations", { category: "NOT_REAL" })
    );
    expect(res.status).toBe(422);
  });

  it("rejects a guest with 401", async () => {
    loggedOut();
    const res = await createConversation(
      postJson("http://test/api/support/conversations", { category: "DEPOSIT" })
    );
    expect(res.status).toBe(401);
  });
});

describe("GET /api/support/conversations — own list only", () => {
  it("never returns another user's conversations", async () => {
    const userA = await seedUserWithWallet(0);
    const userB = await seedUserWithWallet(0);

    loginAs(userA);
    await createConversation(
      postJson("http://test/api/support/conversations", { category: "DEPOSIT" })
    );

    loginAs(userB);
    const res = await listConversations();
    const body = (await res.json()).data;
    expect(body).toEqual([]);
  });
});

describe("Messages — ownership is verified server-side, never trusted from the URL", () => {
  async function seedConversation(owner: User) {
    loginAs(owner);
    const res = await createConversation(
      postJson("http://test/api/support/conversations", { category: "TRADING" })
    );
    return (await res.json()).data.id as string;
  }

  it("the owner can send and read their own messages", async () => {
    const owner = await seedUserWithWallet(0);
    const conversationId = await seedConversation(owner);

    loginAs(owner);
    const sendRes = await sendMessage(
      postJson(`http://test/api/support/conversations/${conversationId}/messages`, {
        message: "Hello, I need help",
      }),
      withParams(conversationId)
    );
    expect(sendRes.status).toBe(201);

    const listRes = await listMessages(
      new NextRequest(`http://test/api/support/conversations/${conversationId}/messages`),
      withParams(conversationId)
    );
    const body = (await listRes.json()).data;
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].message).toBe("Hello, I need help");
    expect(body.messages[0].senderType).toBe("USER");
  });

  it("a different user gets 403 reading someone else's conversation", async () => {
    const owner = await seedUserWithWallet(0);
    const intruder = await seedUserWithWallet(0);
    const conversationId = await seedConversation(owner);

    loginAs(intruder);
    const res = await listMessages(
      new NextRequest(`http://test/api/support/conversations/${conversationId}/messages`),
      withParams(conversationId)
    );
    expect(res.status).toBe(403);
  });

  it("a different user gets 403 sending a message into someone else's conversation", async () => {
    const owner = await seedUserWithWallet(0);
    const intruder = await seedUserWithWallet(0);
    const conversationId = await seedConversation(owner);

    loginAs(intruder);
    const res = await sendMessage(
      postJson(`http://test/api/support/conversations/${conversationId}/messages`, {
        message: "I shouldn't be able to post this",
      }),
      withParams(conversationId)
    );
    expect(res.status).toBe(403);
    expect(await prisma.supportMessage.count()).toBe(0);
  });

  it("returns 404 for a conversation that doesn't exist", async () => {
    const user = await seedUserWithWallet(0);
    loginAs(user);

    const res = await sendMessage(
      postJson("http://test/api/support/conversations/does-not-exist/messages", {
        message: "hi",
      }),
      withParams("does-not-exist")
    );
    expect(res.status).toBe(404);
  });

  it("a user's new message reopens a CLOSED conversation", async () => {
    const owner = await seedUserWithWallet(0);
    const conversationId = await seedConversation(owner);
    await prisma.supportConversation.update({
      where: { id: conversationId },
      data: { status: "CLOSED" },
    });

    loginAs(owner);
    await sendMessage(
      postJson(`http://test/api/support/conversations/${conversationId}/messages`, {
        message: "Still need help",
      }),
      withParams(conversationId)
    );

    const conversation = await prisma.supportConversation.findUniqueOrThrow({
      where: { id: conversationId },
    });
    expect(conversation.status).toBe("OPEN");
  });
});
