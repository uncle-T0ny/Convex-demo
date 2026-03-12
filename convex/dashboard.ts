import { v } from "convex/values";
import { query } from "./_generated/server";
import { toISODate } from "./lib/dates";

export const getTodayOverview = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const today = toISODate();
    const now = Date.now();
    const sid = sessionId as string;

    // Profile
    const profile = await ctx.db
      .query("patientProfiles")
      .withIndex("by_session", (q) => q.eq("sessionId", sid))
      .first();

    // Today's tasks
    const todayTasks = await ctx.db
      .query("treatmentTasks")
      .withIndex("by_session_date", (q) =>
        q.eq("sessionId", sid).eq("scheduledDate", today),
      )
      .collect();

    // Next appointment
    const nextAppointment = await ctx.db
      .query("appointments")
      .withIndex("by_session_dateTime", (q) =>
        q.eq("sessionId", sid).gte("dateTime", now),
      )
      .first();

    return { profile, todayTasks, nextAppointment };
  },
});
