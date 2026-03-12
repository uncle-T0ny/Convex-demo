import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { action, mutation, query, internalAction } from "./_generated/server";
import { internal, components } from "./_generated/api";
import {
  saveMessage,
  listUIMessages,
  syncStreams,
  vStreamArgs,
} from "@convex-dev/agent";
import { createVoiceAgent } from "./agent";

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
    const t0 = Date.now();
    const agent = createVoiceAgent();
    const result = await agent.streamText(
      ctx,
      { threadId },
      { promptMessageId },
      { saveStreamDeltas: true },
    );
    // Drain — agent library saves deltas to DB as stream progresses
    await result.text;
    console.log(`[LLM] generateResponse completed in ${Date.now() - t0}ms`);
  },
});

export const generateGreeting = internalAction({
  args: {
    threadId: v.string(),
    greetingContext: v.optional(v.string()),
  },
  handler: async (ctx, { threadId, greetingContext }) => {
    const t0 = Date.now();
    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId,
      prompt: "Hi!",
    });
    const agent = createVoiceAgent(greetingContext);
    const result = await agent.streamText(
      ctx,
      { threadId },
      { promptMessageId: messageId },
      { saveStreamDeltas: true },
    );
    // Drain — agent library saves deltas to DB as stream progresses
    await result.text;
    console.log(`[LLM] generateGreeting completed in ${Date.now() - t0}ms`);
  },
});

/** @deprecated Use getTtsConfig + client-side Cartesia SDK WebSocket instead */
export const synthesizeSpeech = action({
  args: { text: v.string() },
  handler: async (_ctx, { text }) => {
    const cleaned = text.replace(/[^\p{L}\p{N}]/gu, "").trim();
    if (!cleaned) throw new Error("Transcript is empty or contains only punctuation");

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
          container: "wav",
          encoding: "pcm_s16le",
          sample_rate: 44100,
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Cartesia API error ${response.status}: ${body}`);
    }
    return await response.arrayBuffer();
  },
});

export const getTtsConfig = action({
  args: {},
  handler: async () => {
    const apiKey = process.env.CARTESIA_API_KEY;
    if (!apiKey) throw new Error("CARTESIA_API_KEY not configured");
    return {
      apiKey,
      voiceId:
        process.env.CARTESIA_VOICE_ID ??
        "156fb8d2-335b-4950-9cb3-a2d33befec77",
    };
  },
});

export const listMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    const paginated = await listUIMessages(ctx, components.agent, args);
    const streams = await syncStreams(ctx, components.agent, args);
    return { ...paginated, streams };
  },
});
