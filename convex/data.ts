import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Create a UTC timestamp that represents a given local time.
 * @param daysOffset — days from today (0 = today)
 * @param hours — local hour (0-23)
 * @param minutes — local minutes
 * @param tzOffset — browser's getTimezoneOffset() in minutes (positive = west of UTC)
 */
function localTime(
  daysOffset: number,
  hours: number,
  minutes: number,
  tzOffset: number,
): number {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setUTCHours(hours + tzOffset / 60, minutes, 0, 0);
  return d.getTime();
}

// ─── Profile & Medications ───────────────────────────────────────────────────

export const getProfile = internalQuery({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const profiles = await ctx.db
      .query("patientProfiles")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    return profiles[0] ?? null;
  },
});

export const getMedications = internalQuery({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("medications")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
  },
});

export const getActiveMedications = internalQuery({
  args: { sessionId: v.string(), cycleDay: v.number() },
  handler: async (ctx, { sessionId, cycleDay }) => {
    const meds = await ctx.db
      .query("medications")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    return meds.filter((m) => cycleDay >= m.startDay && cycleDay <= m.endDay);
  },
});

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const getTasksForDate = internalQuery({
  args: { sessionId: v.string(), date: v.string() },
  handler: async (ctx, { sessionId, date }) => {
    return await ctx.db
      .query("treatmentTasks")
      .withIndex("by_session_date", (q) =>
        q.eq("sessionId", sessionId).eq("scheduledDate", date),
      )
      .collect();
  },
});

export const getAllTasks = internalQuery({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("treatmentTasks")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
  },
});

export const completeTask = internalMutation({
  args: { taskId: v.id("treatmentTasks") },
  handler: async (ctx, { taskId }) => {
    await ctx.db.patch(taskId, { status: "done", completedAt: Date.now() });
  },
});

export const skipTask = internalMutation({
  args: { taskId: v.id("treatmentTasks") },
  handler: async (ctx, { taskId }) => {
    await ctx.db.patch(taskId, { status: "skipped" });
  },
});

export const createTask = internalMutation({
  args: {
    sessionId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    scheduledDate: v.string(),
    scheduledTime: v.optional(v.string()),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.scheduledDate)) {
      throw new Error("Invalid date format — expected YYYY-MM-DD");
    }
    if (args.scheduledTime && !/^\d{2}:\d{2}$/.test(args.scheduledTime)) {
      throw new Error("Invalid time format — expected HH:MM");
    }
    return await ctx.db.insert("treatmentTasks", {
      ...args,
      status: "pending",
    });
  },
});

export const getTaskByTitle = internalQuery({
  args: {
    sessionId: v.string(),
    titleFragment: v.string(),
    date: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, titleFragment, date }) => {
    const tasks = date
      ? await ctx.db
          .query("treatmentTasks")
          .withIndex("by_session_date", (q) =>
            q.eq("sessionId", sessionId).eq("scheduledDate", date),
          )
          .collect()
      : await ctx.db
          .query("treatmentTasks")
          .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
          .collect();
    const fragment = titleFragment.toLowerCase();
    return tasks.find((t) => t.title.toLowerCase().includes(fragment)) ?? null;
  },
});

// ─── Symptoms ────────────────────────────────────────────────────────────────

export const logSymptoms = internalMutation({
  args: {
    sessionId: v.string(),
    date: v.string(),
    cycleDay: v.number(),
    symptoms: v.array(v.string()),
    mood: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
      throw new Error("Invalid date format — expected YYYY-MM-DD");
    }
    return await ctx.db.insert("symptomLogs", {
      ...args,
      loggedAt: Date.now(),
    });
  },
});

export const getLatestSymptoms = internalQuery({
  args: { sessionId: v.string(), limit: v.number() },
  handler: async (ctx, { sessionId, limit }) => {
    const logs = await ctx.db
      .query("symptomLogs")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .order("desc")
      .collect();
    return logs.slice(0, limit);
  },
});

// ─── Appointments ────────────────────────────────────────────────────────────

export const getUpcomingAppointments = internalQuery({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const now = Date.now();
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    return appointments
      .filter((a) => a.dateTime >= now)
      .sort((a, b) => a.dateTime - b.dateTime);
  },
});

export const getAppointmentByTitle = internalQuery({
  args: { sessionId: v.string(), titleFragment: v.string() },
  handler: async (ctx, { sessionId, titleFragment }) => {
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    const fragment = titleFragment.toLowerCase();
    return (
      appointments.find((a) => a.title.toLowerCase().includes(fragment)) ??
      null
    );
  },
});

export const addPrepQuestion = internalMutation({
  args: { appointmentId: v.id("appointments"), question: v.string() },
  handler: async (ctx, { appointmentId, question }) => {
    const appointment = await ctx.db.get(appointmentId);
    if (!appointment) return;
    const existing = appointment.prepQuestions ?? [];
    await ctx.db.patch(appointmentId, {
      prepQuestions: [...existing, question],
    });
  },
});

// ─── Seed Data ───────────────────────────────────────────────────────────────

export const seedSessionData = internalMutation({
  args: { sessionId: v.id("sessions"), tzOffset: v.number() },
  handler: async (ctx, { sessionId, tzOffset }) => {
    const now = Date.now();
    const cycleStartDate = now - 7 * 24 * 60 * 60 * 1000;
    const today = formatDate(new Date());
    const sid = sessionId as string;

    // Profile
    const profileId = await ctx.db.insert("patientProfiles", {
      sessionId: sid,
      name: "Sarah",
      age: 34,
      protocol: "IUI with Letrozole",
      cycleDay: 8,
      cycleStartDate,
      clinicName: "Bay Area Fertility Center",
      doctorName: "Dr. Patel",
    });

    await ctx.db.patch(sessionId, { profileId: profileId as string });

    // Medications (4)
    await ctx.db.insert("medications", {
      sessionId: sid,
      name: "Letrozole",
      dosage: "5mg",
      frequency: "Once daily",
      startDay: 3,
      endDay: 7,
      purpose:
        "Stimulates ovulation by temporarily lowering estrogen levels",
      sideEffects: "Hot flashes, headaches, fatigue, dizziness",
      notes: "Completed - taken cycle days 3 through 7",
    });

    await ctx.db.insert("medications", {
      sessionId: sid,
      name: "Prenatal Vitamin",
      dosage: "1 tablet",
      frequency: "Once daily",
      startDay: 1,
      endDay: 28,
      purpose:
        "Provides essential nutrients including folic acid for pregnancy preparation",
      sideEffects: "Mild nausea if taken on empty stomach",
    });

    await ctx.db.insert("medications", {
      sessionId: sid,
      name: "Ovidrel (hCG trigger shot)",
      dosage: "250mcg subcutaneous injection",
      frequency: "Single dose",
      startDay: 12,
      endDay: 12,
      purpose:
        "Triggers final egg maturation and ovulation approximately 36 hours after injection",
      sideEffects: "Injection site reaction, bloating, mild cramping",
      notes: "Will be administered on cycle day 12 after monitoring confirms follicle readiness",
    });

    await ctx.db.insert("medications", {
      sessionId: sid,
      name: "Progesterone",
      dosage: "200mg vaginal suppository",
      frequency: "Twice daily",
      startDay: 15,
      endDay: 28,
      purpose:
        "Supports uterine lining to improve implantation chances after IUI",
      sideEffects: "Drowsiness, bloating, breast tenderness",
      notes: "Starts after IUI procedure on cycle day 15",
    });

    // Tasks — past completed (CD3-7 Letrozole)
    for (let cd = 3; cd <= 7; cd++) {
      const dayOffset = cd - 8;
      const date = formatDate(daysFromNow(dayOffset));
      await ctx.db.insert("treatmentTasks", {
        sessionId: sid,
        title: "Take Letrozole 5mg",
        description: "Take one 5mg tablet by mouth in the evening",
        scheduledDate: date,
        scheduledTime: "21:00",
        category: "medication",
        status: "done",
        completedAt: daysFromNow(dayOffset).getTime(),
      });
    }

    // Today's tasks (CD8)
    await ctx.db.insert("treatmentTasks", {
      sessionId: sid,
      title: "Take prenatal vitamin",
      description: "Take one prenatal vitamin with breakfast",
      scheduledDate: today,
      scheduledTime: "08:00",
      category: "medication",
      status: "pending",
    });

    await ctx.db.insert("treatmentTasks", {
      sessionId: sid,
      title: "Log symptoms and mood",
      description:
        "Record how you're feeling today — any side effects from Letrozole, bloating, mood changes",
      scheduledDate: today,
      category: "logging",
      status: "pending",
    });

    await ctx.db.insert("treatmentTasks", {
      sessionId: sid,
      title: "Monitoring ultrasound appointment",
      description:
        "Follicle monitoring at Bay Area Fertility Center with Dr. Patel",
      scheduledDate: today,
      scheduledTime: "10:00",
      category: "appointment",
      status: "pending",
    });

    // Future tasks (CD9-12 vitamins)
    for (let cd = 9; cd <= 12; cd++) {
      const dayOffset = cd - 8;
      await ctx.db.insert("treatmentTasks", {
        sessionId: sid,
        title: "Take prenatal vitamin",
        description: "Take one prenatal vitamin with breakfast",
        scheduledDate: formatDate(daysFromNow(dayOffset)),
        scheduledTime: "08:00",
        category: "medication",
        status: "pending",
      });
    }

    // Trigger shot CD12
    await ctx.db.insert("treatmentTasks", {
      sessionId: sid,
      title: "Ovidrel trigger shot",
      description:
        "Administer Ovidrel 250mcg subcutaneous injection — timing will be confirmed at monitoring",
      scheduledDate: formatDate(daysFromNow(4)),
      scheduledTime: "22:00",
      category: "medication",
      status: "pending",
    });

    // IUI CD14
    await ctx.db.insert("treatmentTasks", {
      sessionId: sid,
      title: "IUI procedure",
      description: "Intrauterine insemination at Bay Area Fertility Center",
      scheduledDate: formatDate(daysFromNow(6)),
      scheduledTime: "09:00",
      category: "appointment",
      status: "pending",
    });

    // Start progesterone CD15
    await ctx.db.insert("treatmentTasks", {
      sessionId: sid,
      title: "Start progesterone suppositories",
      description:
        "Begin progesterone 200mg vaginal suppository twice daily",
      scheduledDate: formatDate(daysFromNow(7)),
      scheduledTime: "08:00",
      category: "medication",
      status: "pending",
    });

    // Appointments (3)
    await ctx.db.insert("appointments", {
      sessionId: sid,
      title: "Monitoring ultrasound",
      dateTime: localTime(0, 10, 0, tzOffset),
      location: "Bay Area Fertility Center, Suite 200",
      doctorName: "Dr. Patel",
      notes: "Follicle check and uterine lining measurement after Letrozole",
      prepQuestions: [
        "How are my follicles responding to the Letrozole?",
        "Is my lining thickness on track?",
        "When should I expect to trigger?",
      ],
    });

    await ctx.db.insert("appointments", {
      sessionId: sid,
      title: "Final monitoring and trigger shot timing",
      dateTime: localTime(4, 9, 0, tzOffset),
      location: "Bay Area Fertility Center, Suite 200",
      doctorName: "Dr. Patel",
      notes: "Final follicle check before trigger shot",
      prepQuestions: [
        "What time exactly should I take the trigger shot?",
        "Are there any activity restrictions after triggering?",
        "What should I do if I forget to take the shot on time?",
      ],
    });

    await ctx.db.insert("appointments", {
      sessionId: sid,
      title: "IUI procedure",
      dateTime: localTime(6, 9, 0, tzOffset),
      location: "Bay Area Fertility Center, Suite 200",
      doctorName: "Dr. Patel",
      notes: "Intrauterine insemination procedure",
      prepQuestions: [
        "What does the procedure involve step by step?",
        "How long should I rest afterward?",
        "When can I take a pregnancy test?",
      ],
    });

    // Symptom logs (3 past days)
    await ctx.db.insert("symptomLogs", {
      sessionId: sid,
      date: formatDate(daysFromNow(-3)),
      cycleDay: 5,
      symptoms: ["hot flashes", "headache"],
      mood: "anxious",
      notes: "Started Letrozole two days ago, hot flashes are noticeable",
      loggedAt: daysFromNow(-3).getTime(),
    });

    await ctx.db.insert("symptomLogs", {
      sessionId: sid,
      date: formatDate(daysFromNow(-2)),
      cycleDay: 6,
      symptoms: ["fatigue", "bloating"],
      mood: "tired but hopeful",
      loggedAt: daysFromNow(-2).getTime(),
    });

    await ctx.db.insert("symptomLogs", {
      sessionId: sid,
      date: formatDate(daysFromNow(-1)),
      cycleDay: 7,
      symptoms: ["bloating", "mood swings"],
      mood: "emotional",
      notes: "Last day of Letrozole — glad to be done with it",
      loggedAt: daysFromNow(-1).getTime(),
    });

    return profileId;
  },
});
