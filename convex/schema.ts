import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sessions: defineTable({
    title: v.optional(v.string()),
    threadId: v.optional(v.string()),
    profileId: v.optional(v.string()),
    createdAt: v.number(),
    resetRequested: v.optional(v.boolean()),
  }).index("by_threadId", ["threadId"]),

  patientProfiles: defineTable({
    sessionId: v.string(),
    name: v.string(),
    age: v.number(),
    protocol: v.string(),
    cycleDay: v.number(),
    cycleStartDate: v.number(),
    clinicName: v.string(),
    doctorName: v.string(),
  }).index("by_session", ["sessionId"]),

  medications: defineTable({
    sessionId: v.string(),
    name: v.string(),
    dosage: v.string(),
    frequency: v.string(),
    startDay: v.number(),
    endDay: v.number(),
    purpose: v.string(),
    sideEffects: v.string(),
    notes: v.optional(v.string()),
  }).index("by_session", ["sessionId"]),

  treatmentTasks: defineTable({
    sessionId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    scheduledDate: v.string(),
    scheduledTime: v.optional(v.string()),
    // "medication" | "appointment" | "logging" | "other"
    category: v.string(),
    // "pending" | "done" | "skipped"
    status: v.string(),
    completedAt: v.optional(v.number()),
  })
    .index("by_session", ["sessionId"])
    .index("by_session_date", ["sessionId", "scheduledDate"]),

  appointments: defineTable({
    sessionId: v.string(),
    title: v.string(),
    dateTime: v.number(),
    location: v.optional(v.string()),
    doctorName: v.optional(v.string()),
    notes: v.optional(v.string()),
    prepQuestions: v.optional(v.array(v.string())),
  }).index("by_session", ["sessionId"]),

  symptomLogs: defineTable({
    sessionId: v.string(),
    date: v.string(),
    cycleDay: v.number(),
    symptoms: v.array(v.string()),
    mood: v.optional(v.string()),
    notes: v.optional(v.string()),
    loggedAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_session_date", ["sessionId", "date"]),
});
