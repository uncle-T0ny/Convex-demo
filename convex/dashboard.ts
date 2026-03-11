import { v } from "convex/values";
import { query } from "./_generated/server";

export const getTodayOverview = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const today = new Date().toISOString().split("T")[0];
    const now = Date.now();
    const sid = sessionId as string;

    // Profile
    const profiles = await ctx.db
      .query("patientProfiles")
      .withIndex("by_session", (q) => q.eq("sessionId", sid))
      .collect();
    const profile = profiles[0] ?? null;

    // Today's tasks
    const todayTasks = await ctx.db
      .query("treatmentTasks")
      .withIndex("by_session_date", (q) =>
        q.eq("sessionId", sid).eq("scheduledDate", today),
      )
      .collect();

    // Next appointment
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_session", (q) => q.eq("sessionId", sid))
      .collect();
    const upcoming = appointments
      .filter((a) => a.dateTime >= now)
      .sort((a, b) => a.dateTime - b.dateTime);
    const nextAppointment = upcoming[0] ?? null;

    return { profile, todayTasks, nextAppointment };
  },
});
