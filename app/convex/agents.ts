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
    }
  },
});
