roject Vision: The Autonomous Consultant AI (2026)
This document outlines the architecture, tech stack, and core philosophy of the Consultant AI—a task-oriented, agentic platform that abstracts complex workflows into a familiar Kanban-first experience for business users.

1. Core Philosophy
The "Black Box" Approach: The user never sees filesystems, logs, or terminal outputs. They see outcomes (reports, diagrams, data).

Agentic Evolution: Agents are not just chatbots; they are employees that discover, invent, and share skills via a standardized protocol.

Kanban-First Orchestration: All work is managed through a board. Moving a card is the primary trigger for agent action.

2. Technical Stack (2026 "Lean" Model)
Framework: TanStack Start (hosted on Vercel) for type-safe, high-performance UI and server functions.

Database & State: Convex for a reactive, real-time backend. It stores task state, agent skills, and serves as the "source of truth."

Intelligence: OpenAI SDK (o3/GPT-5 class models) for reasoning and tool calling.

Connectivity: MCP (Model Context Protocol) Gateway to connect agents to real-world data (Slack, Stripe, CRM, Google Search).

Execution Sandbox: OpenAI Native Code Interpreter for generating reports (PDF/PPTX) and processing data without hosting extra infrastructure.

3. Data Architecture (Convex Schema)
TypeScript
// schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("todo"), v.literal("triage"), v.literal("in_progress"), v.literal("review"), v.literal("done")),
    assignedAgentId: v.optional(v.string()),
    artifactUrls: v.optional(v.array(v.string())), // Links to PDFs/PowerPoints
    skillsUsed: v.array(v.string()),
  }),

  skills: defineTable({
    name: v.string(), // e.g., "market-researcher"
    description: v.string(),
    instructions: v.string(), // The SKILL.md format
    toolsRequired: v.array(v.string()), // e.g., ["google-search", "code-interpreter"]
  }).index("by_name", ["name"]),

  employees: defineTable({
    name: v.string(),
    specialty: v.string(),
    status: v.string(), // "idle" | "working"
  }),
});
4. The Agentic Workflow
Step A: The Triage
When a card is moved to "Triage," a Convex Action triggers the Triage Agent.

Skill Discovery: It queries the skills table to see if a procedural "skill" exists for the task.

Hiring/Invention: If no skill exists, it spawns an Architect Agent to "Deep Research" the topic and write a new SKILL.md entry in Convex.

Assignment: It assigns the task to a specific worker agent and moves the card to "In Progress."

Step B: Execution & Report Generation
The worker agent executes its instructions using:

Deep Research: Browsing the web for solid facts.

Skill Execution: Following the SKILL.md procedural steps.

Code Interpreter: Writing Python to generate a PowerPoint or PDF report. The resulting file is saved back to the Task's artifactUrls.

Step C: The Human Interview (Refinement)
If the agent lacks context, it moves the card to "Needs Info" and generates a Webform (using a tool call) for the user to fill out. Once submitted, the agent resumes the task.

5. Visual Intelligence (Excalidraw)
Agents have the "Skill" to generate JSON for Excalidraw diagrams.

Input: "Map out our supply chain."

Output: A visual diagram rendered directly on the task card, which the user can manually drag and edit to refine.

6. Key 2026 Protocols
SKILL.md: A markdown-based standard for defining agent procedures, allowed tools, and output formats.

MCP Gateway: A central hub where the LLM requests access to external APIs. The UI manages the security/permissions so the user just sees "Connected."

7. Development Roadmap
Milestone 1: Build the TanStack + Convex Kanban board.

Milestone 2: Implement the OpenAI SDK tool-calling bridge for code_interpreter.

Milestone 3: Create the "Skill Invention" loop (Agent writes to skills table).

Milestone 4: Integrate MCP for real-world research.

Next Step for Implementation: Would you like me to generate the first Convex Mutation to handle the movement of a card from "Todo" to "Triage" and trigger the initial AI reasoning?