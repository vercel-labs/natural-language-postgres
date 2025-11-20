
import { generateText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";


import {
  generateQuery,
  runGeneratedSQLQuery,
  explainQuery,
  upsertChat,
  getChatById,
  listRecentChats,
  deleteChatById,
} from "@/app/actions";

// Define tools once; they'll be passed into generateText
const tools = {
  generate_sql: tool({
    description:
      "Generate a SELECT SQL query over the chat_ids table from a natural language request.",
    parameters: z.object({
      userRequest: z
        .string()
        .describe("The user’s natural-language request about chat_ids"),
    }),
    // args type is inferred from parameters; we can keep it implicit
    execute: async ({ userRequest }) => {
      const query = await generateQuery(userRequest);
      return { query };
    },
  }),

  run_sql: tool({
    description:
      "Safely execute a SELECT-only SQL query against the chat_ids table and return rows.",
    parameters: z.object({
      sql: z
        .string()
        .describe("A SELECT-only SQL query targeting chat_ids"),
    }),
    execute: async ({ sql }) => {
      const rows = await runGeneratedSQLQuery(sql);
      return {
        rowCount: rows.length,
        rows,
      };
    },
  }),

  explain_sql: tool({
    description:
      "Explain, in plain language, what a generated SQL query does for a given user request.",
    parameters: z.object({
      userRequest: z
        .string()
        .describe("The original user request that led to this query"),
      sql: z.string().describe("The generated SQL query to explain"),
    }),
    execute: async ({ userRequest, sql }) => {
      const explanation = await explainQuery(userRequest, sql);
      return { explanation };
    },
  }),

  save_chat: tool({
    description:
      "Upsert a chat row in chat_ids (insert if new id, else update content and last_date_accessed).",
    parameters: z.object({
      id: z
        .string()
        .min(1)
        .max(128)
        .describe("The chat id to save or update"),
      content: z
        .string()
        .min(1)
        .describe("The full serialized chat content to store"),
    }),
    execute: async ({ id, content }) => {
      const row = await upsertChat({ id, content });
      return { row };
    },
  }),

  get_chat: tool({
    description: "Fetch a single chat row by id from chat_ids.",
    parameters: z.object({
      id: z
        .string()
        .min(1)
        .max(128)
        .describe("The chat id to fetch"),
    }),
    execute: async ({ id }) => {
      const row = await getChatById(id);
      return { row };
    },
  }),

  list_chats: tool({
    description:
      "List recent chats from chat_ids ordered by last_date_accessed (or date_created).",
    parameters: z.object({
      limit: z
        .number()
        .int()
        .min(1)
        .max(200)
        .default(50)
        .describe("Maximum number of chats to return"),
    }),
    execute: async ({ limit }) => {
      const rows = await listRecentChats(limit);
      return { rowCount: rows.length, rows };
    },
  }),

  delete_chat: tool({
    description: "Delete a chat row by id from chat_ids.",
    parameters: z.object({
      id: z
        .string()
        .min(1)
        .max(128)
        .describe("The chat id to delete"),
    }),
    execute: async ({ id }) => {
      const result = await deleteChatById(id);
      return result;
    },
  }),
};

const SYSTEM_PROMPT = `
You are a PostgreSQL / chat history agent for a single table called chat_ids.

Database schema:
- Table: chat_ids
  - id TEXT PRIMARY KEY
  - date_created TIMESTAMPTZ
  - last_date_accessed TIMESTAMPTZ
  - content TEXT

You can:
- Generate safe SELECT queries against chat_ids from natural language.
- Execute those SELECT queries.
- Explain the SQL you used in plain language.
- Save, retrieve, list, and delete chat rows via dedicated tools.

Guidelines:
- When the user asks a natural-language question about what's in the database,
  first generate SQL with the generate_sql tool, then run it with run_sql,
  and then summarize the results in concise natural language.
- When the user asks you to save or update a chat, use save_chat.
- When they ask to load a specific chat, use get_chat or list_chats as needed.
- When they ask what SQL you used, you may show the exact query string.
- Respond to the user in natural, concise language.
`.trim();

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const prompt =
      typeof body?.prompt === "string" ? body.prompt : undefined;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing "prompt" in request body.' }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await generateText({
      model: openai("gpt-4o"),
      system: SYSTEM_PROMPT,
      prompt,
      tools,
      // You can tweak tool behavior via maxToolRoundtrips etc. if your version supports it
    });

    return new Response(
      JSON.stringify({
        text: result.text,
        toolCalls: result.toolCalls,
        toolResults: result.toolResults,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in /api/agent:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
