---
name: openai-agents-sdk
description: Build AI agents with the OpenAI Agents SDK (@openai/agents). Use when implementing agents, tool calling, Convex actions with OpenAI, or when working with the @openai/agents package.
---

# OpenAI Agents SDK

Build AI agents with text completion, tools, and structured outputs using `@openai/agents`.

## Install

```bash
npm install @openai/agents zod
```

Requires `zod` (v4 for SDK v0.4+). Set `OPENAI_API_KEY` in environment.

## Basic Agent

```typescript
import { Agent, run } from '@openai/agents';

const agent = new Agent({
  name: 'Assistant',
  instructions: 'You are a helpful assistant.',
  model: 'gpt-4o-mini', // cost-efficient default
});

const result = await run(agent, 'Write a haiku about recursion.');
console.log(result.finalOutput);
// Access: result.usage.totalTokens, result.history
```

## Tools with Zod

```typescript
import { Agent, run, tool } from '@openai/agents';
import { z } from 'zod';

const getWeather = tool({
  name: 'get_weather',
  description: 'Get weather for a city',
  parameters: z.object({ city: z.string() }),
  execute: async ({ city }) => `Weather in ${city}: sunny`,
});

const agent = new Agent({
  name: 'Weather bot',
  instructions: 'Use the weather tool when asked about weather.',
  tools: [getWeather],
});

const result = await run(agent, 'What is the weather in Tokyo?');
```

## Convex Integration

Actions that use `@openai/agents` need the Node.js runtime:

```typescript
"use node";

import { Agent, run } from '@openai/agents';
import { api, internal } from './_generated/api';
import { internalAction } from './_generated/server';
import { v } from 'convex/values';

export const refineTask = internalAction({
  args: { taskId: v.id('tasks') },
  handler: async (ctx, args) => {
    const task = await ctx.runQuery(internal.tasks.getById, { taskId: args.taskId });
    if (!task) return;

    const agent = new Agent({
      name: 'Refinement Agent',
      instructions: 'Refine tasks to be clearer and actionable.',
      model: 'gpt-4.1-mini',
    });

    const result = await run(agent, `Refine: ${task.title}\n${task.description}`);
    await ctx.runMutation(api.comments.add, {
      taskId: args.taskId,
      authorId: 'refinement-agent',
      authorName: 'Refinement Agent',
      isAi: true,
      content: result.finalOutput ?? String(result),
    });
  },
});
```

- Put `"use node";` at top of file
- Actions cannot define queries/mutations in the same file
- Use `ctx.runQuery` / `ctx.runMutation` for DB access
- Set `OPENAI_API_KEY` in Convex dashboard

## Error Handling

```typescript
try {
  const result = await run(agent, input);
  return result.finalOutput;
} catch (error) {
  const msg = error instanceof Error ? error.message : 'Unknown error';
  // Log or persist error for user feedback
  throw new Error(`Agent failed: ${msg}`);
}
```

## Model Options

| Model | Use case |
|-------|----------|
| `gpt-4.1-mini` | Fast, cheap (simple tasks) |
| `gpt-4.1` | Balanced quality |
| `gpt-5.2` | Higher reasoning |

## Common Pitfalls

- **Zod version**: SDK v0.4+ requires `zod@^4`. Use `--legacy-peer-deps` if other deps need zod 3.
- **Empty output**: Check `result.finalOutput ?? result`; some runs return objects.
- **Convex cold start**: Node actions have slower cold starts than default runtime.

## References

- npm: https://www.npmjs.com/package/@openai/agents
- Docs: https://openai.github.io/openai-agents-js/
- GitHub: https://github.com/openai/openai-agents-js
