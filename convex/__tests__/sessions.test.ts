import { convexTest } from "convex-test";
import { expect, test, describe, vi, beforeEach, afterEach } from "vitest";
import { api, internal } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.ts");

// Use fake timers to prevent ctx.scheduler.runAfter from auto-executing
// the agent-dependent initThread action.
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("sessions", () => {
  describe("createSession", () => {
    test("inserts with default title", async () => {
      const t = convexTest(schema, modules);
      const sessionId = await t.mutation(api.sessions.createSession, {});
      const session = await t.run(async (ctx) => ctx.db.get(sessionId));
      expect(session?.title).toBe("New Conversation");
    });

    test("uses custom title", async () => {
      const t = convexTest(schema, modules);
      const sessionId = await t.mutation(api.sessions.createSession, {
        title: "My Chat",
      });
      const session = await t.run(async (ctx) => ctx.db.get(sessionId));
      expect(session?.title).toBe("My Chat");
    });

    test("returns valid session ID", async () => {
      const t = convexTest(schema, modules);
      const sessionId = await t.mutation(api.sessions.createSession, {});
      const session = await t.run(async (ctx) => ctx.db.get(sessionId));
      expect(session).not.toBeNull();
    });

    test("sets createdAt timestamp", async () => {
      const t = convexTest(schema, modules);
      const sessionId = await t.mutation(api.sessions.createSession, {});
      const session = await t.run(async (ctx) => ctx.db.get(sessionId));
      expect(session?.createdAt).toBeTypeOf("number");
      expect(session!.createdAt).toBeGreaterThan(0);
    });
  });

  describe("setThreadId", () => {
    test("patches session with threadId", async () => {
      const t = convexTest(schema, modules);
      const sessionId = await t.mutation(api.sessions.createSession, {});
      await t.mutation(internal.sessions.setThreadId, {
        sessionId,
        threadId: "thread_abc",
      });
      const session = await t.run(async (ctx) => ctx.db.get(sessionId));
      expect(session?.threadId).toBe("thread_abc");
    });

    test("preserves other fields", async () => {
      const t = convexTest(schema, modules);
      const sessionId = await t.mutation(api.sessions.createSession, {
        title: "Keep Me",
      });
      const before = await t.run(async (ctx) => ctx.db.get(sessionId));
      await t.mutation(internal.sessions.setThreadId, {
        sessionId,
        threadId: "thread_xyz",
      });
      const after = await t.run(async (ctx) => ctx.db.get(sessionId));
      expect(after?.title).toBe(before?.title);
      expect(after?.createdAt).toBe(before?.createdAt);
    });
  });

  describe("getSession", () => {
    test("returns session by ID", async () => {
      const t = convexTest(schema, modules);
      const sessionId = await t.mutation(api.sessions.createSession, {});
      const session = await t.query(api.sessions.getSession, { sessionId });
      expect(session).not.toBeNull();
      expect(session?.title).toBe("New Conversation");
    });

    test("returns null for non-existent ID", async () => {
      const t = convexTest(schema, modules);
      const sessionId = await t.mutation(api.sessions.createSession, {});
      await t.run(async (ctx) => {
        await ctx.db.delete(sessionId);
      });
      const result = await t.query(api.sessions.getSession, { sessionId });
      expect(result).toBeNull();
    });
  });
});
