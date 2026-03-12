import { v } from "convex/values";
import {
  mutation,
  query,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal, components } from "./_generated/api";
import { createThread } from "@convex-dev/agent";

export const createSession = mutation({
  args: { title: v.optional(v.string()), tzOffset: v.optional(v.number()) },
  handler: async (ctx, { title, tzOffset }) => {
    const sessionId = await ctx.db.insert("sessions", {
      title: title ?? "New Conversation",
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.sessions.initThread, {
      sessionId,
      tzOffset: tzOffset ?? 0,
    });
    return sessionId;
  },
});

export const initThread = internalAction({
  args: { sessionId: v.id("sessions"), tzOffset: v.number() },
  handler: async (ctx, { sessionId, tzOffset }) => {
    const threadId = await createThread(ctx, components.agent, {});
    // Parallelize independent DB writes
    await Promise.all([
      ctx.runMutation(internal.sessions.setThreadId, { sessionId, threadId }),
      ctx.runMutation(internal.data.seedSessionData, { sessionId, tzOffset }),
    ]);
    // Pre-fetch profile + tasks so greeting skips tool calls
    const todayISO = new Date().toISOString().split("T")[0];
    const [profile, tasks] = await Promise.all([
      ctx.runQuery(internal.data.getProfile, { sessionId: sessionId as string }),
      ctx.runQuery(internal.data.getTasksForDate, {
        sessionId: sessionId as string,
        date: todayISO,
      }),
    ]);
    await ctx.scheduler.runAfter(0, internal.chat.generateGreeting, {
      threadId,
      greetingContext: JSON.stringify({ profile, todaysTasks: tasks }),
    });
  },
});

export const setThreadId = internalMutation({
  args: { sessionId: v.id("sessions"), threadId: v.string() },
  handler: async (ctx, { sessionId, threadId }) => {
    await ctx.db.patch(sessionId, { threadId });
  },
});

export const getSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db.get(sessionId);
  },
});

export const requestReset = internalMutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    await ctx.db.patch(sessionId, { resetRequested: true });
  },
});

export const getSessionByThreadId = internalQuery({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
      .first();
  },
});
