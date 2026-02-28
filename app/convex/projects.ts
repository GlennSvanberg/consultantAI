import { v } from "convex/values";
import { internalQuery, query } from "./_generated/server";

export const getById = internalQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => ctx.db.get("projects", args.projectId),
});

export const list = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
  },
});
