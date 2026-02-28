# Consultant AI — Current App State

This document describes what is implemented and what is missing as of the current build, relative to the vision in `notes.md`.

---

## Implemented

### Tech Stack
- **Framework:** TanStack Start (React Router, Vite)
- **Backend:** Convex (real-time queries/mutations/actions)
- **UI:** shadcn/ui, Tailwind CSS v4, next-themes (light/dark mode)
- **Drag-and-drop:** @dnd-kit (core, sortable, utilities)

### Authentication
- **Simulated login:** Dev-only user switcher (Alice, Bob, Charlie) via localStorage
- **No real auth:** No OAuth, no session management

### Routes & Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, "Get Started" CTA |
| `/projects` | Projects list for the simulated user; "Generate Seed Data" and "Add Project" buttons |
| `/projects/:projectId` | Kanban board with drag-and-drop tasks |
| `/employees` | Agents management + Skills library |

### Kanban Board
- **Columns:** Backlog → Refinement → Todo → In Progress → Need Help → Review → Done
- **Tasks:** Draggable cards; click to open edit dialog
- **Task dialog:** Edit title, description, assigned user, assigned agent; add/view comments (human + AI)
- **Optimistic updates** for status changes

### Agents & Skills UI
- **Agents:** List, create, edit (name, specialty, system instructions, assigned skills)
- **Skills:** List, create, edit (name, description, instructions in SKILL.md format, tools required)
- **Task assignment:** Assigned agent selected from dropdown of employees

### Convex Schema

| Table | Purpose |
|-------|---------|
| `projects` | name, userId, createdAt |
| `tasks` | title, description, status, projectId, assignedAgentId, assignedUserId, artifactUrls, skillsUsed |
| `comments` | taskId, authorId, authorName, isAi, content |
| `skills` | name, description, instructions, toolsRequired |
| `employees` | name, specialty, userId, instructions, skillIds |
| `users` | name (minimal) |

### Convex Functions
- **projects.list** — Projects for a user
- **tasks.list** — Tasks for a project
- **tasks.updateStatus** — Change task status; triggers Refinement Agent when status = `refinement`
- **tasks.updateDetails** — Update title, description, assignments
- **tasks.getById** — Internal query for agents
- **comments.list** — Comments for a task
- **comments.add** — Add comment (human or AI)
- **employees.list** — Employees for a user
- **employees.create** / **update** — CRUD for agents
- **skills.list** / **create** / **update** — CRUD for skills
- **seed.generate** — Clears and regenerates demo data (projects, tasks, skills, employees)

### AI Integration (Partial)
- **Refinement Agent:** When a task is moved to **Refinement**, an internal action runs:
  - Uses OpenAI (`gpt-4o-mini`) via `@openai/agents`
  - Refines task title and description
  - Updates the task and adds an AI comment
- **Triage Agent:** Not implemented yet (see Missing)

---

## Missing

### Triage Agent
- **Planned:** When a task moves to Refinement, a Triage Agent should:
  - Analyze the task
  - Choose the right agent from `employees` (using instructions and skills)
  - Assign the task and move it to Todo (or Need Help if user input is needed)
- **Current:** Only the Refinement Agent runs; it improves the task text but does not assign an agent.

### Skill Invention Loop
- **Planned:** If no skill matches a task, an Architect Agent creates a new skill and writes it to the `skills` table.
- **Current:** Skills are created manually in the UI only.

### Worker Agent Execution
- **Planned:** Assigned agents run their skills (Deep Research, Code Interpreter, etc.).
- **Current:** No agent execution after assignment; agents do not run tasks.

### Code Interpreter & Artifacts
- **Planned:** Agents generate PDFs/PPTX via OpenAI Code Interpreter; stored in `artifactUrls`.
- **Current:** `artifactUrls` exists in schema but is unused; no artifact generation.

### MCP Gateway
- **Planned:** Connect agents to external APIs (Slack, Stripe, CRM, Google Search).
- **Current:** No MCP integration.

### Human Input / Webforms
- **Planned:** When an agent needs context, it moves to Need Help and creates a webform for the user.
- **Current:** Need Help is a manual column; no webform generation.

### Visual Intelligence (Excalidraw)
- **Planned:** Agents generate Excalidraw diagrams for tasks.
- **Current:** Not implemented.

### Real Authentication
- **Planned:** OAuth or similar for production.
- **Current:** Simulated users only.

### Project Creation
- **Planned:** "Add Project" functionality.
- **Current:** Button exists but does not create projects.

### Comment Timestamps
- **Planned:** Comments should show when they were posted.
- **Current:** `comments` table has no `createdAt`; UI does not show timestamps.

---

## Summary

| Area | Status |
|------|--------|
| Kanban UI | Done |
| Task editing | Done |
| Comments | Done |
| Agents & Skills management | Done |
| Refinement Agent | Done |
| Triage Agent | Not started |
| Worker Agent execution | Not started |
| Skill Invention | Not started |
| Artifacts (PDF/PPTX) | Not started |
| MCP | Not started |
| Real auth | Not started |

---

## Next Steps (Suggested)

1. **Triage Agent** — Implement the agent that picks the right employee when a task enters Refinement.
2. **Project creation** — Wire up the "Add Project" button.
3. **Comment timestamps** — Add `createdAt` to comments and display in UI.
