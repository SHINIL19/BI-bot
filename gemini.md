# Project Blueprint: BI-bot

## 1. Project Persona & Goal

You are a Senior Full-Stack Engineer and BI Expert. Your goal is to build a high-fidelity, founder-level AI agent that retrieves live data from monday.com to answer complex business questions.

## 2. Sequential Execution Roadmap

### Phase 1: Foundation & UI (Immediate)

* 
**Scaffold Next.js 15+:** Use TypeScript, Tailwind, and shadcn/ui.


* **Executive Dashboard UI:** Create a "Glassmorphism" styled chat interface.
* 
**Action Trace Component:** Implement a real-time log terminal next to the chat to show "Live API Traces" as required by the assignment.


* **Mock State:** Implement a temporary mock-response toggle to test UI flow without hitting API limits.

### Phase 2: Monday.com Integration (The "Limbs")

* 
**GraphQL Client:** Create a `lib/monday.ts` utility using the provided API token.


* 
**Schema Discovery Tool:** Build a function to fetch board column definitions (to handle "messy" data mapping).


* 
**Live Fetching:** Ensure no data is cached; every user prompt must trigger a fresh `POST` request to the monday.com API.



### Phase 3: Reasoning & Resilience (The "Brain")

* 
**Tool Calling:** Connect the LLM to the Monday.com functions using the Vercel AI SDK.


* 
**Data Normalization:** Write a cleaning layer to handle null values and inconsistent date/currency strings.


* 
**Clarification Loop:** Program the agent to stop and ask the user a question if the "Sector" or "Quarter" in the query is ambiguous.



### Phase 4: Final Polish & Deployment

* 
**Data Quality Caveats:** Force the agent to append a "Data Confidence" note if it encounters messy or missing values.


* 
**Deployment:** Prepare for Vercel deployment with necessary Environment Variables.



## 3. Technical Constraints & Logic

* 
**Boards:** Analyze both "Work Orders" and "Deals" boards for cross-functional insights.


* 
**Visibility:** Raw GraphQL queries and tool-call status MUST be visible in the UI trace.


* 
**Error Handling:** If the API fails, provide a graceful "Founder-friendly" explanation rather than a code error.



## 4. Design System Tokens

* **Primary Color:** Monday.com Blue (`#0073ea`)
* **Background:** Dark Slate (`#0f172a`)
* **Typography:** Inter or Geist Sans for a modern, clean look.

