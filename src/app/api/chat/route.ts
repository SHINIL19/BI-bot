import { google, createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getBoards, getBoardSchema, getBoardItems, getItemsByColumnValue, getItemsByNames } from '@/lib/monday';

// Explicitly configure Google provider to support GEMINI_API_KEY
const googleProvider = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Define a more specific schema for Monday items to satisfy Gemini's tool validation
const MondayItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    column_values: z.array(z.object({
        id: z.string(),
        text: z.string().optional().nullable(),
        value: z.string().optional().nullable(),
        title: z.string().optional()
    })).optional()
});

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
            model: googleProvider('gemini-1.5-flash'), // Using consistent model name after SDK upgrade
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
                    execute: async ({ boardId }: { boardId: string }) => {
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
                    execute: async ({ boardId, limit }: { boardId: string, limit?: number }) => {
                        console.log(`[ACTION TRACE] Fetching Items for Board ${boardId}(Limit: ${limit || 25})`);
                        try {
                            const items = await getBoardItems(boardId, limit || 25);
                            return { success: true, items };
                        } catch (error: any) {
                            return { success: false, error: error.message };
                        }
                    }
                }),
                filterBoardItems: tool({
                    description: 'Filter a list of items based on a specific column value. Use this to find specific orders, clients, or priorities from the raw items data.',
                    parameters: z.object({
                        items: z.array(MondayItemSchema).describe('The array of items to filter (usually from getBoardItems).'),
                        columnName: z.string().describe('The name (title) of the column to filter by. Must exactly match the schema title.'),
                        operator: z.enum(['equals', 'contains', 'greaterThan', 'lessThan']).describe('The comparison operator.'),
                        value: z.string().describe('The value to compare against.')
                    }),
                    execute: async ({ items, columnName, operator, value }: { items: any[], columnName: string, operator: string, value: string }) => {
                        console.log(`[ACTION TRACE] Filtering Items by ${columnName} ${operator} ${value}`);
                        try {
                            const filtered = items.filter((item: any) => {
                                const col = item.column_values?.find((c: any) =>
                                    c.title?.toLowerCase() === columnName.toLowerCase() ||
                                    c.id?.toLowerCase() === columnName.toLowerCase()
                                );
                                if (!col) return false;

                                const colValue = col.text || col.value || '';

                                switch (operator) {
                                    case 'equals': return colValue.toLowerCase() === value.toLowerCase();
                                    case 'contains': return colValue.toLowerCase().includes(value.toLowerCase());
                                    case 'greaterThan': return parseFloat(colValue) > parseFloat(value);
                                    case 'lessThan': return parseFloat(colValue) < parseFloat(value);
                                    default: return false;
                                }
                            });
                            return { success: true, count: filtered.length, filteredItems: filtered };
                        } catch (error: any) {
                            return { success: false, error: error.message };
                        }
                    }
                }),
                sortBoardItems: tool({
                    description: 'Sort a list of items. Use this to find top revenue items, oldest tickets, etc.',
                    parameters: z.object({
                        items: z.array(MondayItemSchema).describe('The array of items to sort.'),
                        columnName: z.string().describe('The column name (title) or ID to sort by.'),
                        order: z.enum(['asc', 'desc']).describe('Sort in ascending or descending order.')
                    }),
                    execute: async ({ items, columnName, order }: { items: any[], columnName: string, order: 'asc' | 'desc' }) => {
                        console.log(`[ACTION TRACE] Sorting Items by ${columnName} (${order})`);
                        try {
                            const sorted = [...items].sort((a: any, b: any) => {
                                const colA = a.column_values?.find((c: any) => c.title?.toLowerCase() === columnName.toLowerCase() || c.id === columnName)?.text || '';
                                const colB = b.column_values?.find((c: any) => c.title?.toLowerCase() === columnName.toLowerCase() || c.id === columnName)?.text || '';

                                const numA = parseFloat(colA);
                                const numB = parseFloat(colB);

                                if (!isNaN(numA) && !isNaN(numB)) {
                                    return order === 'asc' ? numA - numB : numB - numA;
                                }

                                return order === 'asc' ? colA.localeCompare(colB) : colB.localeCompare(colA);
                            });
                            return { success: true, sortedItems: sorted };
                        } catch (error: any) {
                            return { success: false, error: error.message };
                        }
                    }
                }),
                searchItemsByColumn: tool({
                    description: 'Search for items on a board that have a specific value in a column. This is the most efficient way to find specific data like "Emergency" priority orders.',
                    parameters: z.object({
                        boardId: z.string().describe('The ID of the monday.com board'),
                        columnId: z.string().describe('The ID of the column (e.g. "status", "priority"). Use getBoardSchema to find IDs.'),
                        value: z.string().describe('The value to search for (e.g. "Emergency")'),
                    }),
                    execute: async ({ boardId, columnId, value }: { boardId: string, columnId: string, value: string }) => {
                        console.log(`[ACTION TRACE] Searching Items on Board ${boardId} where ${columnId} is ${value}`);
                        try {
                            const items = await getItemsByColumnValue(boardId, columnId, value);
                            return { success: true, count: items.length, items };
                        } catch (error: any) {
                            return { success: false, error: error.message };
                        }
                    }
                }),
                searchItemsByName: tool({
                    description: 'Search for items on a board by their name (title).',
                    parameters: z.object({
                        boardId: z.string().describe('The ID of the monday.com board'),
                        names: z.array(z.string()).describe('List of item names to search for.'),
                    }),
                    execute: async ({ boardId, names }: { boardId: string, names: string[] }) => {
                        console.log(`[ACTION TRACE] Searching Items on Board ${boardId} by names: ${names.join(', ')}`);
                        try {
                            const items = await getItemsByNames(boardId, names);
                            return { success: true, count: items.length, items };
                        } catch (error: any) {
                            return { success: false, error: error.message };
                        }
                    }
                }),
                calculateMetrics: tool({
                    description: 'Calculate metrics (sum, average, count) from a list of items based on a numeric column.',
                    parameters: z.object({
                        items: z.array(MondayItemSchema).describe('The array of items to analyze.'),
                        columnName: z.string().describe('The column name (title) or ID containing numeric data.'),
                        operation: z.enum(['sum', 'average', 'count', 'min', 'max']).describe('The mathematical operation to perform.')
                    }),
                    execute: async ({ items, columnName, operation }: { items: any[], columnName: string, operation: string }) => {
                        console.log(`[ACTION TRACE] Calculating ${operation} for ${columnName}`);
                        try {
                            const values = items.map((item: any) => {
                                const col = item.column_values?.find((c: any) =>
                                    c.title?.toLowerCase() === columnName.toLowerCase() ||
                                    c.id === columnName
                                );
                                if (!col) return null;
                                // Clean the value (remove currency symbols, commas, etc)
                                const cleanValue = (col.text || col.value || '').replace(/[^\d.-]/g, '');
                                const num = parseFloat(cleanValue);
                                return isNaN(num) ? null : num;
                            }).filter((v: any) => v !== null) as number[];

                            if (values.length === 0 && operation !== 'count') {
                                return { success: true, result: 0, note: "No numeric values found for this column." };
                            }

                            let result = 0;
                            switch (operation) {
                                case 'sum':
                                    result = values.reduce((a, b) => a + b, 0);
                                    break;
                                case 'average':
                                    result = values.reduce((a, b) => a + b, 0) / values.length;
                                    break;
                                case 'count':
                                    result = items.length;
                                    break;
                                case 'min':
                                    result = Math.min(...values);
                                    break;
                                case 'max':
                                    result = Math.max(...values);
                                    break;
                            }

                            return { success: true, operation, columnName, result, count: values.length };
                        } catch (error: any) {
                            return { success: false, error: error.message };
                        }
                    }
                })
            },
            maxSteps: 5,
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
