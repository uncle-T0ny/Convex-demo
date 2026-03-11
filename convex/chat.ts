import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query, internalAction } from "./_generated/server";
import { internal, components } from "./_generated/api";
import { saveMessage, listUIMessages } from "@convex-dev/agent";
import { voiceAgent } from "./agent";

export const sendMessage = mutation({
  args: { threadId: v.string(), prompt: v.string() },
  handler: async (ctx, { threadId, prompt }) => {
    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId,
      prompt,
    });
    await ctx.scheduler.runAfter(0, internal.chat.generateResponse, {
      threadId,
      promptMessageId: messageId,
    });
    return messageId;
  },
});

export const generateResponse = internalAction({
  args: { threadId: v.string(), promptMessageId: v.string() },
  handler: async (ctx, { threadId, promptMessageId }) => {
    await voiceAgent.generateText(ctx, { threadId }, { promptMessageId });
  },
});

export const generateGreeting = internalAction({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId,
      prompt: "Hi!",
    });
    await voiceAgent.generateText(
      ctx,
      { threadId },
      { promptMessageId: messageId },
    );
  },
});

export const listMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await listUIMessages(ctx, components.agent, args);
  },
});
