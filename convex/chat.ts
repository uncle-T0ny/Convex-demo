import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { action, mutation, query, internalAction } from "./_generated/server";
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

export const synthesizeSpeech = action({
  args: { text: v.string() },
  handler: async (_ctx, { text }) => {
    const apiKey = process.env.CARTESIA_API_KEY;
    if (!apiKey) throw new Error("CARTESIA_API_KEY not configured");

    const response = await fetch("https://api.cartesia.ai/tts/bytes", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Cartesia-Version": "2025-04-16",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_id: "sonic-3",
        transcript: text,
        voice: {
          mode: "id",
          id:
            process.env.CARTESIA_VOICE_ID ??
            "156fb8d2-335b-4950-9cb3-a2d33befec77",
        },
        language: "en",
        output_format: {
          container: "mp3",
          bit_rate: 128000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Cartesia API error: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
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
