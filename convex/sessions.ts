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
  args: { title: v.optional(v.string()) },
  handler: async (ctx, { title }) => {
    const sessionId = await ctx.db.insert("sessions", {
      title: title ?? "New Conversation",
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.sessions.initThread, {
      sessionId,
    });
    return sessionId;
  },
});

export const initThread = internalAction({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const threadId = await createThread(ctx, components.agent, {});
    await ctx.runMutation(internal.sessions.setThreadId, {
      sessionId,
      threadId,
    });
    await ctx.runMutation(internal.data.seedSessionData, { sessionId });
    await ctx.scheduler.runAfter(0, internal.chat.generateGreeting, {
      threadId,
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

export const getSessionByThreadId = internalQuery({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
      .first();
  },
});
