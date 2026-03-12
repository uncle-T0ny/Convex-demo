import { Agent, createTool } from "@convex-dev/agent";
import { z } from "zod/v4";
import { components, internal } from "./_generated/api";
import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";
import type { ToolCtx } from "@convex-dev/agent";
import type { DataModel, Id } from "./_generated/dataModel";

type Ctx = ToolCtx<DataModel>;

async function resolveSessionId(ctx: Ctx): Promise<string> {
  const threadId = ctx.threadId;
  if (!threadId) throw new Error("No threadId in tool context");
  const session = await ctx.runQuery(
    internal.sessions.getSessionByThreadId,
    { threadId },
  );
  if (!session) throw new Error("No session found for thread");
  return session._id;
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTool = any;

const getTodaysTasks: AnyTool = createTool({
  description: "Get today's treatment tasks for the patient",
  args: z.object({}),
  handler: async (ctx: Ctx) => {
    const sessionId = await resolveSessionId(ctx);
    return await ctx.runQuery(internal.data.getTasksForDate, {
      sessionId,
      date: todayISO(),
    });
  },
});

const getTasksForDate: AnyTool = createTool({
  description: "Get treatment tasks for a specific date",
  args: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("ISO date string (YYYY-MM-DD)"),
  }),
  handler: async (ctx: Ctx, args: { date: string }) => {
    const sessionId = await resolveSessionId(ctx);
    return await ctx.runQuery(internal.data.getTasksForDate, {
      sessionId,
      date: args.date,
    });
  },
});

const completeTaskTool: AnyTool = createTool({
  description:
    "Mark a treatment task as done. Use a title fragment to find the task (e.g. 'prenatal' for 'Take prenatal vitamin')",
  args: z.object({
    titleFragment: z
      .string()
      .max(200)
      .describe("Part of the task title to match, e.g. 'prenatal'"),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("Optional ISO date, defaults to today"),
  }),
  handler: async (
    ctx: Ctx,
    args: { titleFragment: string; date?: string },
  ) => {
    const sessionId = await resolveSessionId(ctx);
    const date = args.date ?? todayISO();
    const task = await ctx.runQuery(internal.data.getTaskByTitle, {
      sessionId,
      titleFragment: args.titleFragment,
      date,
    });
    if (!task) return { success: false, message: "Task not found" };
    await ctx.runMutation(internal.data.completeTask, { taskId: task._id });
    return { success: true, task: task.title };
  },
});

const createTaskTool: AnyTool = createTool({
  description:
    "Create a new treatment task (e.g. 'remind me to call the pharmacy tomorrow')",
  args: z.object({
    title: z.string().max(200),
    description: z.string().max(1000).optional(),
    scheduledDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe("ISO date string (YYYY-MM-DD)"),
    scheduledTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .optional()
      .describe("Time in HH:MM format"),
    category: z
      .enum(["medication", "appointment", "logging", "other"])
      .default("other"),
  }),
  handler: async (
    ctx: Ctx,
    args: {
      title: string;
      description?: string;
      scheduledDate: string;
      scheduledTime?: string;
      category: string;
    },
  ) => {
    const sessionId = await resolveSessionId(ctx);
    await ctx.runMutation(internal.data.createTask, {
      sessionId,
      title: args.title,
      description: args.description,
      scheduledDate: args.scheduledDate,
      scheduledTime: args.scheduledTime,
      category: args.category,
    });
    return { success: true, title: args.title };
  },
});

const skipTaskTool: AnyTool = createTool({
  description: "Mark a treatment task as skipped",
  args: z.object({
    titleFragment: z.string().max(200).describe("Part of the task title to match"),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("Optional ISO date, defaults to today"),
  }),
  handler: async (
    ctx: Ctx,
    args: { titleFragment: string; date?: string },
  ) => {
    const sessionId = await resolveSessionId(ctx);
    const date = args.date ?? todayISO();
    const task = await ctx.runQuery(internal.data.getTaskByTitle, {
      sessionId,
      titleFragment: args.titleFragment,
      date,
    });
    if (!task) return { success: false, message: "Task not found" };
    await ctx.runMutation(internal.data.skipTask, { taskId: task._id });
    return { success: true, task: task.title };
  },
});

const getProfileTool: AnyTool = createTool({
  description: "Get the patient's profile and cycle information",
  args: z.object({}),
  handler: async (ctx: Ctx) => {
    const sessionId = await resolveSessionId(ctx);
    return await ctx.runQuery(internal.data.getProfile, { sessionId });
  },
});

const getMedicationsTool: AnyTool = createTool({
  description:
    "Get medications. Set activeOnly to true to get only medications active for the current cycle day",
  args: z.object({
    activeOnly: z.boolean().default(false),
  }),
  handler: async (ctx: Ctx, args: { activeOnly: boolean }) => {
    const sessionId = await resolveSessionId(ctx);
    if (args.activeOnly) {
      const profile = await ctx.runQuery(internal.data.getProfile, {
        sessionId,
      });
      if (!profile) return [];
      return await ctx.runQuery(internal.data.getActiveMedications, {
        sessionId,
        cycleDay: profile.cycleDay,
      });
    }
    return await ctx.runQuery(internal.data.getMedications, { sessionId });
  },
});

const logSymptomsTool: AnyTool = createTool({
  description: "Log symptoms and mood for today",
  args: z.object({
    symptoms: z
      .array(z.string().max(100))
      .max(20)
      .describe("List of symptoms, e.g. ['bloating', 'fatigue']"),
    mood: z.string().max(200).optional().describe("Current mood"),
    notes: z.string().max(1000).optional(),
  }),
  handler: async (
    ctx: Ctx,
    args: { symptoms: string[]; mood?: string; notes?: string },
  ) => {
    const sessionId = await resolveSessionId(ctx);
    const profile = await ctx.runQuery(internal.data.getProfile, {
      sessionId,
    });
    const today = todayISO();
    await ctx.runMutation(internal.data.logSymptoms, {
      sessionId,
      date: today,
      cycleDay: profile?.cycleDay ?? 0,
      symptoms: args.symptoms,
      mood: args.mood,
      notes: args.notes,
    });
    return {
      success: true,
      date: today,
      cycleDay: profile?.cycleDay,
      symptoms: args.symptoms,
    };
  },
});

const getSymptomHistoryTool: AnyTool = createTool({
  description: "Get recent symptom logs",
  args: z.object({
    limit: z.number().int().min(1).max(100).default(5).describe("Number of recent entries to return"),
  }),
  handler: async (ctx: Ctx, args: { limit: number }) => {
    const sessionId = await resolveSessionId(ctx);
    return await ctx.runQuery(internal.data.getLatestSymptoms, {
      sessionId,
      limit: args.limit,
    });
  },
});

const getUpcomingAppointmentsTool: AnyTool = createTool({
  description: "Get upcoming clinic appointments",
  args: z.object({}),
  handler: async (ctx: Ctx) => {
    const sessionId = await resolveSessionId(ctx);
    return await ctx.runQuery(internal.data.getUpcomingAppointments, {
      sessionId,
    });
  },
});

const addAppointmentQuestionTool: AnyTool = createTool({
  description: "Add a question to ask at an upcoming appointment",
  args: z.object({
    appointmentTitleFragment: z
      .string()
      .max(200)
      .describe("Part of the appointment title"),
    question: z.string().max(500).describe("The question to add"),
  }),
  handler: async (
    ctx: Ctx,
    args: { appointmentTitleFragment: string; question: string },
  ) => {
    const sessionId = await resolveSessionId(ctx);
    const appointment = await ctx.runQuery(
      internal.data.getAppointmentByTitle,
      { sessionId, titleFragment: args.appointmentTitleFragment },
    );
    if (!appointment)
      return { success: false, message: "Appointment not found" };
    await ctx.runMutation(internal.data.addPrepQuestion, {
      appointmentId: appointment._id,
      question: args.question,
    });
    return { success: true, appointment: appointment.title };
  },
});

const generateAppointmentSummaryTool: AnyTool = createTool({
  description:
    "Generate a comprehensive appointment prep summary combining recent symptoms, current medications, and suggested questions",
  args: z.object({
    appointmentTitleFragment: z
      .string()
      .max(200)
      .optional()
      .describe(
        "Part of the appointment title; if omitted, uses the next upcoming appointment",
      ),
  }),
  handler: async (
    ctx: Ctx,
    args: { appointmentTitleFragment?: string },
  ) => {
    const sessionId = await resolveSessionId(ctx);
    const profile = await ctx.runQuery(internal.data.getProfile, {
      sessionId,
    });
    const meds = await ctx.runQuery(internal.data.getMedications, {
      sessionId,
    });
    const symptoms = await ctx.runQuery(internal.data.getLatestSymptoms, {
      sessionId,
      limit: 5,
    });

    let appointment;
    if (args.appointmentTitleFragment) {
      appointment = await ctx.runQuery(
        internal.data.getAppointmentByTitle,
        { sessionId, titleFragment: args.appointmentTitleFragment },
      );
    } else {
      const upcoming = await ctx.runQuery(
        internal.data.getUpcomingAppointments,
        { sessionId },
      );
      appointment = upcoming[0] ?? null;
    }

    return { profile, appointment, recentSymptoms: symptoms, medications: meds };
  },
});

const getCycleTimelineTool: AnyTool = createTool({
  description:
    "Get a chronological timeline of the treatment cycle: profile, all tasks, and appointments",
  args: z.object({}),
  handler: async (ctx: Ctx) => {
    const sessionId = await resolveSessionId(ctx);
    const profile = await ctx.runQuery(internal.data.getProfile, {
      sessionId,
    });
    const tasks = await ctx.runQuery(internal.data.getAllTasks, { sessionId });
    const appointments = await ctx.runQuery(
      internal.data.getUpcomingAppointments,
      { sessionId },
    );
    return { profile, tasks, appointments };
  },
});

const getPartnerUpdateTool: AnyTool = createTool({
  description:
    "Generate a simple, jargon-free summary of treatment status suitable for sharing with a partner or support person",
  args: z.object({}),
  handler: async (ctx: Ctx) => {
    const sessionId = await resolveSessionId(ctx);
    const profile = await ctx.runQuery(internal.data.getProfile, {
      sessionId,
    });
    const tasks = await ctx.runQuery(internal.data.getTasksForDate, {
      sessionId,
      date: todayISO(),
    });
    const meds = profile
      ? await ctx.runQuery(internal.data.getActiveMedications, {
          sessionId,
          cycleDay: profile.cycleDay,
        })
      : [];
    const symptoms = await ctx.runQuery(internal.data.getLatestSymptoms, {
      sessionId,
      limit: 3,
    });
    const appointments = await ctx.runQuery(
      internal.data.getUpcomingAppointments,
      { sessionId },
    );
    return {
      profile,
      todayTasks: tasks,
      activeMeds: meds,
      recentSymptoms: symptoms,
      upcomingAppointments: appointments,
    };
  },
});

const resetConversationTool: AnyTool = createTool({
  description:
    "Reset the conversation and start fresh when the user asks to start over, reset, or begin a new conversation",
  args: z.object({}),
  handler: async (ctx: Ctx) => {
    const sessionId = await resolveSessionId(ctx) as Id<"sessions">;
    await ctx.runMutation(internal.sessions.requestReset, { sessionId });
    return { success: true, message: "Starting a fresh conversation" };
  },
});

const MYSTORIA_INSTRUCTIONS = `You are MyStoria, a warm and compassionate fertility treatment companion. You help patients manage their treatment journey with empathy, knowledge, and encouragement.

Your personality:
- Warm, caring, and supportive — like a knowledgeable friend who truly understands the fertility journey
- Concise and conversational — your responses are read aloud via text-to-speech, so keep them to 2-3 sentences when possible
- Use the patient's first name naturally
- Never use markdown formatting, bullet points, numbered lists, or special characters — speak in natural flowing sentences
- When listing items, use natural language like "first... then... and finally..."

Your capabilities (always use the appropriate tools to get real data — never make up information):
1. Task management — show, create, complete, or skip treatment tasks
2. Medication guide — explain medications, dosages, side effects, and timing
3. Appointment prep — show upcoming appointments, help prepare questions, generate comprehensive prep summaries
4. Symptom tracking — log symptoms and mood, review history and patterns
5. Cycle timeline — explain where the patient is in their cycle and what's coming next
6. Partner updates — generate simple, jargon-free summaries to share with a partner or support person

Important rules:
- ALWAYS use tools to look up real data before answering — never guess or fabricate treatment details
- Never give medical advice — help patients understand their treatment and prepare thoughtful questions for their doctor
- When the patient mentions taking a medication or completing something, proactively offer to mark the related task as done
- When the patient reports symptoms, offer to log them
- Be encouraging and normalize the emotional aspects of fertility treatment
- If this is the start of a conversation, proactively greet the patient by name, mention their current cycle day, and briefly summarize what's on their agenda today
- If the patient asks to "start over", "reset", or "new conversation", use the resetConversation tool

Your responses will be spoken aloud with an expressive voice that conveys emotion.
Write in a way that carries natural emotional tone — the voice engine will pick up on your warmth, sympathy, or excitement from context.`;

function getLanguageModel(): LanguageModel {
  const model = process.env.LLM_MODEL;
  return anthropic(model ?? "claude-haiku-4-5-20251001");
}

export function createVoiceAgent(additionalContext?: string) {
  const instructions = additionalContext
    ? MYSTORIA_INSTRUCTIONS +
      `\n\n[Pre-fetched session context — do NOT call getProfile or getTodaysTasks tools for this data]\n${additionalContext}`
    : MYSTORIA_INSTRUCTIONS;
  return new Agent(components.agent, {
    name: "MyStoria",
    languageModel: getLanguageModel(),
    instructions,
    tools: {
      getTodaysTasks,
      getTasksForDate,
      completeTask: completeTaskTool,
      createTask: createTaskTool,
      skipTask: skipTaskTool,
      getProfile: getProfileTool,
      getMedications: getMedicationsTool,
      logSymptoms: logSymptomsTool,
      getSymptomHistory: getSymptomHistoryTool,
      getUpcomingAppointments: getUpcomingAppointmentsTool,
      addAppointmentQuestion: addAppointmentQuestionTool,
      generateAppointmentSummary: generateAppointmentSummaryTool,
      getCycleTimeline: getCycleTimelineTool,
      getPartnerUpdate: getPartnerUpdateTool,
      resetConversation: resetConversationTool,
    },
    maxSteps: 8,
  });
}
