import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getBoardSchema, getBoardItems } from '@/lib/monday';

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

CRITICAL RULES:
1. ALWAYS use your tools to fetch live data. Do not guess.
2. If the user asks an ambiguous question (e.g. they ask for "Q3 revenue" but don't specify which year, or they ask for "the latest deals" but there is no clear date filter), STOP and ask for clarification.
3. Monday.com data is often messy. You must handle nulls, inconsistent date formats, or weird currency strings gracefully in your responses.
4. "Data Confidence" Note: At the end of every data-driven response, you MUST append a distinct, bolded note labeled "Data Confidence:" explaining any caveats, missing fields, or assumptions you had to make due to messy data.

If you cannot find the requested data, explain why in a graceful, executive-friendly manner without throwing visible code errors.`,
            tools: {
                getBoardSchema: tool({
                    description: 'Fetch the column definitions and structure of a specific monday.com board. Always run this first if you are unsure of the column names or IDs.',
                    parameters: z.object({
                        boardId: z.string().describe('The ID of the monday.com board (e.g. 12345678)'),
                    }),
                    execute: async ({ boardId }) => {
                        console.log(`[ACTION TRACE] Fetching Schema for Board ${boardId}`);
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
                        console.log(`[ACTION TRACE] Fetching Items for Board ${boardId} (Limit: ${limit || 25})`);
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
