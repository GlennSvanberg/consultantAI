import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("employees")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getById = query({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.employeeId);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    specialty: v.string(),
    userId: v.optional(v.string()),
    instructions: v.optional(v.string()),
    skillIds: v.optional(v.array(v.id("skills"))),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("employees", args);
  },
});

export const update = mutation({
  args: {
    employeeId: v.id("employees"),
    name: v.optional(v.string()),
    specialty: v.optional(v.string()),
    instructions: v.optional(v.string()),
    skillIds: v.optional(v.array(v.id("skills"))),
  },
  handler: async (ctx, args) => {
    const { employeeId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, val]) => val !== undefined)
    );
    // eslint-disable-next-line @convex-dev/explicit-table-ids
    await ctx.db.patch(employeeId, filteredUpdates as any);
  },
});
