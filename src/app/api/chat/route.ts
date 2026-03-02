import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getBoards, getBoardSchema, getBoardItems } from '@/lib/monday';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages, mockMode } = await req.json();

    if (mockMode) {
        // Return a mocked stream for UI verification without using real AI/API tokens
        const mockResponse = "This is a **mock response**. The agent is in Mock State. I can see your Monday.com boards conceptually, but I am not fetching live data right now to save API limits.\n\n*Toggle off Mock Data to run a live query.*";

        // Create a simple ReadableStream to simulate streaming
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                // Enqueue text chunks split by space to simulate typing
                const chunks = mockResponse.split(' ');
                for (const chunk of chunks) {
                    controller.enqueue(encoder.encode(`0:"${chunk} "\n`));
                    await new Promise(r => setTimeout(r, 50)); // Artificial delay
                }
                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'x-vercel-ai-data-stream': 'v1'
            }
        });
    }

    // Live Mode: Use Vercel AI SDK
    try {
        const result = await streamText({
            model: google('gemini-2.5-flash'), // Make sure GEMINI_API_KEY is in .env.local
            messages,
            system: `You are a Senior BI Expert and Data Analyst for a high-growth company. 
You act as a founder-level AI agent communicating directly with executives.
Your goal is to answer their questions about company operations, work orders, and deals by querying live monday.com boards.

---
1. Agent Operational Instructions

The agent must follow these core principles to ensure "Founder-level" accuracy and resilience:

Data Retrieval & Integrity:
- Live Querying Only: Every user request must trigger a fresh GraphQL POST request to the monday.com API. Do NOT cache or preload board data.
- Inconsistency Normalization: The agent must programmatically handle "messy" data. This includes converting varied date formats (e.g., "Jan 1" vs. "01/01/2026") into ISO standards and stripping non-numeric characters from currency fields.
- Null Handling: If critical data (like a Deal Value) is missing, the agent should default to 0 for calculations but must flag this to the user.

Conversational Intelligence:
- Clarification Loop: If a query is ambiguous (e.g., "How is the energy sector?" without a timeframe), the agent must ask a clarifying question rather than making an assumption.
- Context Retention: The agent must support follow-up questions within the same session (e.g., "What about the previous quarter?").
- Transparency: All API calls and "agent thoughts" must be rendered in a visible trace panel for the user to see the reasoning process.

---
2. Board Definitions & Context

Based on your provided files, the agent will operate across these two distinct data environments:

Board A: Data Funnel (Sales CRM)
- Board ID: 5026937827
- Context: This board acts as a Sales Pipeline/CRM. It tracks potential revenue from the initial "Discovery" phase through to "Closed Won" or "Closed Lost".
- Key Metrics for Agent:
  - Pipeline Health: Total value of deals currently in active stages.
  - Conversion Rates: The percentage of deals moving from one stage to the next.
  - Sector Performance: Revenue grouped by industry (e.g., Energy, Tech, Finance).

Board B: Work Order Tracking (Post-Sales Operations)
- Board ID: 5026937816
- Context: This board manages Operational Fulfillment. Once a deal is won, it moves here to be executed. It tracks task types, priority levels (Emergency, Routine, etc.), and completion statuses.
- Key Metrics for Agent:
  - Throughput: Number of work orders completed per week/month.
  - Priority Distribution: Identifying bottlenecks in "Urgent" vs. "Routine" tasks.
  - Efficiency: Time taken from "Request" to "Resolution."

---
3. Data Context Summary

| Data Point | Board A: Data Funnel (...827) | Board B: Work Orders (...816) |
| --- | --- | --- |
| Primary Goal | Revenue Generation & Forecasting | Service Delivery, Invoicing & Maintenance |
| Important Columns | Deal Status, Masked Deal value, Deal Stage, Sector/service, Closure Probability | Execution Status, Amount Receivable (Masked), WO Status (billed), Sector, Invoice Status, Amount in Rupees (Incl of GST) (Masked) |
| Messy Elements | Inconsistent Date Formats (Close Date (A)), Null 'Closure Probability', Masked Deal value | Null 'Amount Receivable', Date formatting (Probable Start Date, Actual Billing Month) |
| Executive Value | "How much money is coming in from what sectors?" | "What is the billing & collection state of active/closed work?" |

CRITICAL RULES:
1. ALWAYS use your tools to fetch live data. Do not guess.
2. "Data Confidence" Note: At the end of every data-driven response, you MUST append a distinct, bolded note labeled "Data Confidence:" explaining any caveats, missing fields, or assumptions you had to make due to messy data.
3. Board Identification: Use the explicit Board IDs provided above whenever relevant.

If you cannot find the requested data, explain why in a graceful, executive-friendly manner without throwing visible code errors.`,
            tools: {
                getBoards: tool({
                    description: 'Fetch the list of all accessible monday.com boards (with their IDs and names). Run this if you need to know the board ID to answer the user query.',
                    parameters: z.object({}),
                    execute: async () => {
                        console.log(`[ACTION TRACE]Fetching Available Boards`);
                        try {
                            const boards = await getBoards();
                            return { success: true, boards };
                        } catch (error: any) {
                            return { success: false, error: error.message };
                        }
                    },
                }),
                getBoardSchema: tool({
                    description: 'Fetch the column definitions and structure of a specific monday.com board. Always run this first if you are unsure of the column names or IDs.',
                    parameters: z.object({
                        boardId: z.string().describe('The ID of the monday.com board (e.g. 12345678)'),
                    }),
                    execute: async ({ boardId }) => {
                        console.log(`[ACTION TRACE]Fetching Schema for Board ${boardId}`);
                        try {
                            const schema = await getBoardSchema(boardId);
                            return { success: true, schema };
                        } catch (error: any) {
                            return { success: false, error: error.message };
                        }
                    },
                }),
                getBoardItems: tool({
                    description: 'Fetch the latest raw items from a monday.com board. You MUST use getBoardSchema first to understand what the columns mean.',
                    parameters: z.object({
                        boardId: z.string().describe('The ID of the monday.com board'),
                        limit: z.number().optional().describe('Number of items to fetch. Default is 25. Do not request more than 50 at a time.'),
                    }),
                    execute: async ({ boardId, limit }) => {
                        console.log(`[ACTION TRACE] Fetching Items for Board ${boardId}(Limit: ${limit || 25})`);
                        try {
                            const items = await getBoardItems(boardId, limit || 25);
                            return { success: true, items };
                        } catch (error: any) {
                            return { success: false, error: error.message };
                        }
                    }
                })
            },
        });

        return result.toDataStreamResponse();
    } catch (error: any) {
        console.error("Agent Execution Error:", error);
        return new Response(JSON.stringify({ error: error?.message || String(error) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
