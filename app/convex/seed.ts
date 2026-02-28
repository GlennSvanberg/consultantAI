import { mutation } from "./_generated/server";

export const generate = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete existing data to allow re-seeding
    const existingProjects = await ctx.db.query("projects").collect();
    for (const p of existingProjects) await ctx.db.delete(p._id);

    const existingTasks = await ctx.db.query("tasks").collect();
    for (const t of existingTasks) await ctx.db.delete(t._id);

    const existingEmployees = await ctx.db.query("employees").collect();
    for (const e of existingEmployees) await ctx.db.delete(e._id);

    const existingSkills = await ctx.db.query("skills").collect();
    for (const s of existingSkills) await ctx.db.delete(s._id);

    // Insert mock user data based on Alice
    const projectId = await ctx.db.insert("projects", {
      name: "Q1 Market Research",
      userId: "alice",
      createdAt: Date.now(),
    });

    await ctx.db.insert("projects", {
      name: "Client Onboarding",
      userId: "alice",
      createdAt: Date.now(),
    });

    // Skills
    const triageSkillId = await ctx.db.insert("skills", {
      name: "Triage & Routing",
      description: "Analyze a task and determine which agent should handle it.",
      instructions: "Read the task title and description. Decide if it needs a Researcher, a Writer, or if it needs human input. Update the task accordingly.",
      toolsRequired: [],
    });

    const researchSkillId = await ctx.db.insert("skills", {
      name: "Deep Research",
      description: "Conduct comprehensive web research on a specific topic.",
      instructions: "Use the web search tool to find relevant information. Summarize the findings and attach them to the task as a comment or artifact.",
      toolsRequired: ["google-search"],
    });

    // Agents
    await ctx.db.insert("employees", {
      name: "Triage Agent",
      specialty: "Routing",
      userId: "alice",
      instructions: "You are the first point of contact for new tasks. Read them carefully and use your routing skills to assign them to the right specialized agent.",
      skillIds: [triageSkillId],
    });

    await ctx.db.insert("employees", {
      name: "Research Agent",
      specialty: "Deep Search",
      userId: "alice",
      instructions: "You are an expert researcher. When assigned a task, use your deep research skills to find the most accurate and up-to-date information.",
      skillIds: [researchSkillId],
    });

    // Tasks for Project 1
    await ctx.db.insert("tasks", {
      title: "Define scope and constraints",
      description: "Need to figure out what we are actually doing.",
      status: "backlog",
      projectId: projectId,
    });

    await ctx.db.insert("tasks", {
      title: "Identify key competitors",
      status: "refinement",
      projectId: projectId,
      assignedAgentId: "Triage Agent",
    });

    await ctx.db.insert("tasks", {
      title: "Draft survey questions",
      status: "in_progress",
      projectId: projectId,
      assignedAgentId: "Research Agent",
    });

    await ctx.db.insert("tasks", {
      title: "Review survey questions with client",
      status: "need_help",
      projectId: projectId,
      assignedAgentId: "Research Agent",
    });

    await ctx.db.insert("tasks", {
      title: "Setup tracking infrastructure",
      status: "done",
      projectId: projectId,
    });

    return "Seed data generated!";
  },
});
