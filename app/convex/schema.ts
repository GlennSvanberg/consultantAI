import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    userId: v.string(),
    createdAt: v.number(),
  }),

  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("backlog"),
      v.literal("refinement"),
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("need_help"),
      v.literal("review"),
      v.literal("done")
    ),
    projectId: v.id("projects"),
    assignedAgentId: v.optional(v.string()),
    assignedUserId: v.optional(v.string()), // Added field for assigned user
    artifactUrls: v.optional(v.array(v.string())),
    skillsUsed: v.optional(v.array(v.string())),
  }).index("by_project", ["projectId"]),

  comments: defineTable({
    taskId: v.id("tasks"),
    authorId: v.string(), // can be userId or employeeId
    authorName: v.string(), // store name for easy display
    isAi: v.boolean(),
    content: v.string(),
  }).index("by_task", ["taskId"]),

  skills: defineTable({
    name: v.string(),
    description: v.string(),
    instructions: v.string(),
    toolsRequired: v.array(v.string()),
  }).index("by_name", ["name"]),

  employees: defineTable({
    name: v.string(),
    specialty: v.string(),
    userId: v.optional(v.string()),
    instructions: v.optional(v.string()), // Agent-specific instructions
    skillIds: v.optional(v.array(v.id("skills"))), // Assigned skills
  }).index("by_user", ["userId"]),

  users: defineTable({
    name: v.string(),
  }),
});
