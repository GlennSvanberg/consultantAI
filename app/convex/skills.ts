import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("skills").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    instructions: v.string(),
    toolsRequired: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("skills", args);
  },
});

export const update = mutation({
  args: {
    skillId: v.id("skills"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    instructions: v.optional(v.string()),
    toolsRequired: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { skillId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, val]) => val !== undefined)
    );
    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch("skills", skillId, filteredUpdates as any);
    }
  },
});
