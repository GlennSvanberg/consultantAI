"use node";

import { Agent, run } from "@openai/agents";
import { z } from "zod";
import { api, internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

const refinementSchema = z.object({
  refinedTitle: z.string(),
  refinedDescription: z.string(),
});

const REFINEMENT_INSTRUCTIONS = `You are a task refinement specialist. Given a task title and description, refine it to be clearer, more actionable, and well-scoped.

Output JSON with exactly two fields:
- refinedTitle: A clear, specific title (one line)
- refinedDescription: Improved description including acceptance criteria and 2-3 suggested next steps. Use markdown formatting.`;

const triageSchema = z.object({
  assignedEmployeeName: z
    .string()
    .nullable()
    .describe(
      "Name of best-matching employee, or null if no match or human input needed"
    ),
  reasoning: z.string().describe("Brief explanation of the decision"),
  humanInputNeeded: z
    .string()
    .optional()
    .describe(
      "If no assignment possible, what info the user should provide before the task can proceed"
    ),
});

const TRIAGE_INSTRUCTIONS = `You are a triage specialist. Given a refined task and a list of employees (each with name, specialty, instructions, and skills), pick the best employee to handle the task or explain what human input is needed.

Rules:
- If a clear match exists between the task and an employee's specialty/skills, set assignedEmployeeName to that employee's exact name (case-sensitive).
- If no employee matches well, the task is ambiguous, or the task explicitly needs information from a human, set assignedEmployeeName to null and humanInputNeeded to explain what the user should provide.
- You do NOT move tasks between columns. The task stays in Refinement so the user can verify your assignment and plan before moving it to Todo.
- Always provide reasoning for your decision.`;

export const refineTask = internalAction({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.runQuery(internal.tasks.getById, {
      taskId: args.taskId,
    });

    if (!task) {
      return;
    }

    const prompt = `Refine this task:

**Title:** ${task.title}

**Description:** ${task.description || "(none provided)"}`;

    try {
      const agent = new Agent({
        name: "Refinement Agent",
        instructions: REFINEMENT_INSTRUCTIONS,
        model: "gpt-4o-mini",
        outputType: refinementSchema,
      });

      const result = await run(agent, prompt);
      const output = result.finalOutput;

      if (!output || typeof output !== "object") {
        throw new Error("Agent did not return structured output");
      }

      const { response_reasoning: _reasoning, ...cleanOutput } = output as Record<
        string,
        unknown
      >;
      const { refinedTitle, refinedDescription } = refinementSchema.parse(
        cleanOutput
      );

      await ctx.runMutation(api.tasks.updateDetails, {
        taskId: args.taskId,
        title: refinedTitle,
        description: refinedDescription,
      });

      await ctx.runMutation(api.comments.add, {
        taskId: args.taskId,
        authorId: "refinement-agent",
        authorName: "Refinement Agent",
        isAi: true,
        content: "I've updated the task title and description with the refined version.",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await ctx.runMutation(api.comments.add, {
        taskId: args.taskId,
        authorId: "refinement-agent",
        authorName: "Refinement Agent",
        isAi: true,
        content: `Refinement failed: ${errorMessage}. Please check OPENAI_API_KEY is set in Convex environment variables.`,
      });
    } finally {
      await ctx.scheduler.runAfter(0, internal.agents.triageTask, {
        taskId: args.taskId,
      });
    }
  },
});

export const triageTask = internalAction({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.runQuery(internal.tasks.getById, {
      taskId: args.taskId,
    });

    if (!task || task.status !== "refinement") {
      return;
    }

    const project = await ctx.runQuery(internal.projects.getById, {
      projectId: task.projectId,
    });

    if (!project) {
      return;
    }

    const employees = await ctx.runQuery(internal.employees.listForTriage, {
      userId: project.userId,
    });

    if (employees.length === 0) {
      await ctx.runMutation(api.comments.add, {
        taskId: args.taskId,
        authorId: "triage-agent",
        authorName: "Triage Agent",
        isAi: true,
        content:
          "No agents configured. Add agents in Employees to enable triage. Please verify the refined task and move to Todo when ready.",
      });
      return;
    }

    try {
      const employeesJson = JSON.stringify(
        employees.map((e) => ({
          name: e.name,
          specialty: e.specialty,
          instructions: e.instructions,
          skills: e.skills,
        })),
        null,
        2
      );

      const prompt = `Task to triage:

**Title:** ${task.title}

**Description:** ${task.description || "(none provided)"}

---

Available employees:

${employeesJson}

Pick the best employee to assign, or explain what human input is needed. The task stays in Refinement for the user to verify before moving to Todo.`;

      const agent = new Agent({
        name: "Triage Agent",
        instructions: TRIAGE_INSTRUCTIONS,
        model: "gpt-4o-mini",
        outputType: triageSchema,
      });

      const result = await run(agent, prompt);
      const output = result.finalOutput;

      if (!output || typeof output !== "object") {
        throw new Error("Triage agent did not return structured output");
      }

      const { response_reasoning: _reasoning, ...cleanOutput } = output as Record<
        string,
        unknown
      >;
      const parsed = triageSchema.parse(cleanOutput);

      if (parsed.assignedEmployeeName) {
        await ctx.runMutation(api.tasks.updateDetails, {
          taskId: args.taskId,
          assignedAgentId: parsed.assignedEmployeeName,
        });
      }

      const commentContent =
        parsed.humanInputNeeded
          ? `${parsed.reasoning}\n\n**Human input needed:** ${parsed.humanInputNeeded}`
          : parsed.reasoning;

      await ctx.runMutation(api.comments.add, {
        taskId: args.taskId,
        authorId: "triage-agent",
        authorName: "Triage Agent",
        isAi: true,
        content: commentContent,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await ctx.runMutation(api.comments.add, {
        taskId: args.taskId,
        authorId: "triage-agent",
        authorName: "Triage Agent",
        isAi: true,
        content: `Triage failed: ${errorMessage}. Please check OPENAI_API_KEY is set in Convex environment variables. Verify the refined task and move to Todo when ready.`,
      });
    }
  },
});
