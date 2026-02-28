import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";

export const listForTriage = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const employees = await ctx.db
      .query("employees")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return Promise.all(
      employees.map(async (emp) => {
        const skills = await Promise.all(
          (emp.skillIds ?? []).map(async (sid) => {
            const s = await ctx.db.get("skills", sid);
            return s ? { name: s.name, description: s.description } : null;
          })
        );
        return {
          _id: emp._id,
          name: emp.name,
          specialty: emp.specialty,
          instructions: emp.instructions ?? "",
          skills: skills.filter((x): x is { name: string; description: string } =>
            x !== null
          ),
        };
      })
    );
  },
});

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
    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch("employees", employeeId, filteredUpdates as any);
    }
  },
});
