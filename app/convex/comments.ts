import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});

export const add = mutation({
  args: {
    taskId: v.id("tasks"),
    authorId: v.string(),
    authorName: v.string(),
    isAi: v.boolean(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("comments", {
      taskId: args.taskId,
      authorId: args.authorId,
      authorName: args.authorName,
      isAi: args.isAi,
      content: args.content,
    });
  },
});
