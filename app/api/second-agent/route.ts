import { Agent, run, handoff, tool, setDefaultOpenAIKey } from '@openai/agents';
import { z } from 'zod';

import {
  generateQuery,
  runGeneratedSQLQuery,
  explainQuery,
  upsertChat,
  getChatById,
  listRecentChats,
  deleteChatById,
} from '@/app/actions';

// Optional but helpful: configure API key explicitly for Agents SDK
if (process.env.OPENAI_API_KEY) {
  setDefaultOpenAIKey(process.env.OPENAI_API_KEY);
}

/* ───────────────────────── Tools backed by actions.ts ───────────────────────── */

const generateSqlTool = tool({
  name: 'generate_sql',
  description:
    'Generate a SELECT SQL query over the chat_ids table from a natural language request.',
  parameters: z.object({
    userRequest: z
      .string()
      .describe('The user’s natural-language request about chat_ids'),
  }),
  async execute({ userRequest }) {
    const query = await generateQuery(userRequest);
    return { query };
  },
});

const runSqlTool = tool({
  name: 'run_sql',
  description:
    'Safely execute a SELECT-only SQL query against the chat_ids table and return rows.',
  parameters: z.object({
    sql: z
      .string()
      .describe('A SELECT-only SQL query targeting chat_ids'),
  }),
  async execute({ sql }) {
    const rows = await runGeneratedSQLQuery(sql);
    return {
      rowCount: rows.length,
      rows,
    };
  },
});

const explainSqlTool = tool({
  name: 'explain_sql',
  description:
    'Explain, in plain language, what a generated SQL query does for a given user request.',
  parameters: z.object({
    userRequest: z
      .string()
      .describe('The original user request that led to this query'),
    sql: z.string().describe('The generated SQL query to explain'),
  }),
  async execute({ userRequest, sql }) {
    const explanation = await explainQuery(userRequest, sql);
    return { explanation };
  },
});

const saveChatTool = tool({
  name: 'save_chat',
  description:
    'Upsert a chat row in chat_ids (insert if new id, else update content and last_date_accessed).',
  parameters: z.object({
    id: z
      .string()
      .min(1)
      .max(128)
      .describe('The chat id to save or update'),
    content: z
      .string()
      .min(1)
      .describe('The full serialized chat content to store'),
  }),
  async execute({ id, content }) {
    const row = await upsertChat({ id, content });
    return { row };
  },
});

const getChatTool = tool({
  name: 'get_chat',
  description: 'Fetch a single chat row by id from chat_ids.',
  parameters: z.object({
    id: z
      .string()
      .min(1)
      .max(128)
      .describe('The chat id to fetch'),
  }),
  async execute({ id }) {
    const row = await getChatById(id);
    return { row };
  },
});

const listChatsTool = tool({
  name: 'list_chats',
  description:
    'List recent chats from chat_ids ordered by last_date_accessed (or date_created).',
  parameters: z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(200)
      .default(50)
      .describe('Maximum number of chats to return'),
  }),
  async execute({ limit }) {
    const rows = await listRecentChats(limit);
    return { rowCount: rows.length, rows };
  },
});

const deleteChatTool = tool({
  name: 'delete_chat',
  description: 'Delete a chat row by id from chat_ids.',
  parameters: z.object({
    id: z
      .string()
      .min(1)
      .max(128)
      .describe('The chat id to delete'),
  }),
  async execute({ id }) {
    const result = await deleteChatById(id);
    return result;
  },
});

/* ───────────────────────── Specialist agents ───────────────────────── */

const dbAgent = new Agent({
  name: 'Database agent',
  // If you prefer a specific model, set it here; otherwise default model is used.
  // model: 'gpt-4.1-mini',
  instructions: `
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
- Save, retrieve, list, and delete chat rows via tools.

When the user asks about anything involving chat_ids, chat history, stored chats,
or SQL over that table, use the available tools instead of guessing.
Always keep responses concise and explain any SQL behavior in plain language.
  `.trim(),
  tools: [
    generateSqlTool,
    runSqlTool,
    explainSqlTool,
    saveChatTool,
    getChatTool,
    listChatsTool,
    deleteChatTool,
  ],
});

const generalAgent = new Agent({
  name: 'General assistant',
  instructions: `
You are a general-purpose assistant.

Handle questions that are NOT specifically about:
- SQL
- the chat_ids database table
- saving/loading/listing/deleting chats in that table.

If the user clearly asks about the database or stored chats, the request should
be triaged to the database agent instead of handled here.
  `.trim(),
  // model: 'gpt-4.1',
});

/* ───────────────────────── Triage agent with handoffs ───────────────────────── */

const triageAgent = Agent.create({
  name: 'Triage agent',
  instructions: `
You decide whether a request should go to the Database agent or be handled by the General assistant.

Routing rules:
- If the user asks to query, analyze, inspect, save, load, list, or delete data
  in the chat_ids Postgres table, or mentions chat IDs, SQL, or database usage,
  hand off to the Database agent.
- Otherwise, keep the request with the General assistant.

Do not answer user questions yourself; always route to the appropriate specialist.
  `.trim(),
  handoffs: [
    handoff(dbAgent, {
      toolDescriptionOverride:
        'Use this when the user asks to query, explain, or modify data in the chat_ids Postgres table, or mentions SQL or stored chats.',
    }),
    handoff(generalAgent, {
      toolDescriptionOverride:
        'Use this for general questions that are not specifically about the chat_ids database.',
    }),
  ],
});

/* ───────────────────────── Route handler ───────────────────────── */

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const prompt =
      typeof body?.prompt === 'string' && body.prompt.trim().length > 0
        ? body.prompt.trim()
        : null;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing "prompt" in request body.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // You can optionally pass extra context / run config here if needed.
    const result = await run(triageAgent, prompt);

    // result.finalOutput is the final agent text; there are also traces on result if you need them.
    return new Response(
      JSON.stringify({
        output: result.finalOutput,
        // Uncomment if you want some introspection:
        // traceId: result.traceId,
        // agentName: result.agent?.name,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[api/agent] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
