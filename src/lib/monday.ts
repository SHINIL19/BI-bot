// lib/monday.ts

/**
 * Executes a GraphQL query against the Monday.com API.
 * Uses the MONDAY_API_TOKEN environment variable. 
 * Ensure cache is bypassed to get live data.
 */
export async function executeGraphQL(query: string, variables?: Record<string, any>) {
    const token = process.env.MONDAY_API_TOKEN;
    if (!token) {
        throw new Error("Missing MONDAY_API_TOKEN environment variable");
    }

    const endpoint = "https://api.monday.com/v2";

    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
                // Monday specific versioning header is often recommended
                "API-Version": "2024-01",
            },
            body: JSON.stringify({
                query,
                variables: variables || {},
            }),
            // Force fresh request to bypass any Next.js/fetch cache
            cache: "no-store",
        });

        if (!res.ok) {
            const text = await res.text();
            console.error(`Monday API Error: ${res.status} - ${text}`);
            throw new Error(`Monday API responded with status: ${res.status}`);
        }

        const json = await res.json();

        // Check for GraphQL level errors
        if (json.errors) {
            console.error("Monday GraphQL Errors:", JSON.stringify(json.errors, null, 2));
            throw new Error(`GraphQL Error: ${json.errors[0]?.message || 'Unknown error'}`);
        }

        return json.data;
    } catch (error) {
        console.error("Error executing Monday GraphQL query:", error);
        throw error;
    }
}

/**
 * Fetches the schema (column definitions) for a specific board.
 * Crucial for mapping chaotic column structures dynamically.
 */
export async function getBoardSchema(boardId: string | number) {
    const query = `
    query GetBoardSchema($boardId: [ID!]) {
      boards(ids: $boardId) {
        id
        name
        columns {
          id
          title
          type
          description
        }
      }
    }
  `;

    const data = await executeGraphQL(query, { boardId: String(boardId) });
    return data?.boards?.[0];
}

/**
 * Helper to fetch raw items from a board to be analyzed by the LLM.
 * Note: To prevent overwhelming the prompt, we limit the initial fetch.
 */
export async function getBoardItems(boardId: string | number, limit: number = 25) {
    const query = `
    query GetBoardItems($boardId: [ID!], $limit: Int!) {
      boards(ids: $boardId) {
        id
        name
        items_page(limit: $limit) {
          cursor
          items {
            id
            name
            created_at
            updated_at
            column_values {
              id
              text
              type
              value
            }
          }
        }
      }
    }
  `;

    const data = await executeGraphQL(query, {
        boardId: String(boardId),
        limit
    });

    return data?.boards?.[0];
}
