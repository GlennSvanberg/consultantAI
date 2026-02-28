import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalQuery, mutation, query } from "./_generated/server";

export const list = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("asc")
      .collect();
  },
});

export const getById = internalQuery({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get("tasks", args.taskId);
  },
});

export const updateStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(
      v.literal("backlog"),
      v.literal("refinement"),
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("need_help"),
      v.literal("review"),
      v.literal("done")
    ),
  },
  handler: async (ctx, args) => {
    if (args.status === "refinement") {
      await ctx.db.patch(args.taskId, {
        status: args.status,
        assignedAgentId: "refinement-agent",
      });
      await ctx.scheduler.runAfter(0, internal.agents.refineTask, {
        taskId: args.taskId,
      });
    } else {
      await ctx.db.patch(args.taskId, { status: args.status });
    }
  },
});

export const updateDetails = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    assignedAgentId: v.optional(v.string()),
    assignedUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { taskId, ...updates } = args;
    // Remove undefined fields
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, val]) => val !== undefined)
    );
    // eslint-disable-next-line @convex-dev/explicit-table-ids
    await ctx.db.patch(taskId, filteredUpdates as any);
  },
});
