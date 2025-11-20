"use server";

import { sql } from "@vercel/postgres";
import { Result } from "@/lib/types";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

import { explanationSchema } from "@/lib/types";
import { z } from "zod";

/* ───────────────── Types for chat_ids ───────────────── */

// NOTE: these are now *internal* (no `export`), so the file
// only exports async functions, satisfying the "use server" rule.
const chatIdSchema = z.string().min(1).max(128);
const chatContentSchema = z.string().min(1);

const chatUpsertInputSchema = z.object({
  id: chatIdSchema,
  content: chatContentSchema,
});

export type ChatRow = {
  id: string;
  date_created: Date | null;
  last_date_accessed: Date | null;
  content: string;
};

/* ───────────────── NL → SQL generation ───────────────── */

export const generateQuery = async (input: string) => {
  try {
    const result = await generateObject({
      model: openai("gpt-4o"),
      system: `
You are a PostgreSQL expert.

Database schema (single table):
- Table: chat_ids
  - id TEXT PRIMARY KEY
  - date_created TIMESTAMPTZ
  - last_date_accessed TIMESTAMPTZ
  - content TEXT

Rules:
- Only generate a single SQL statement.
- Only reference the chat_ids table and its columns.
- Prefer simple, readable queries.
- Do NOT generate INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE,
  GRANT, or REVOKE statements — only SELECTs for this endpoint.
- Do NOT include comments or explanation in the SQL, only the SQL itself.
      `.trim(),
      prompt: `Generate the SQL SELECT query needed to retrieve the data the user wants:\n\nUser request:\n${input}`,
      schema: z.object({
        query: z.string(),
      }),
    });

    return result.object.query;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate query");
  }
};

export const explainQuery = async (input: string, sqlQuery: string) => {
  try {
    const result = await generateObject({
      model: openai("gpt-4o"),
      system: `
You are a PostgreSQL expert.

Explain SQL queries in clear, concise language for a non-expert user.
Focus on:
- What the query is doing.
- What each main clause does (SELECT, FROM, WHERE, ORDER BY, LIMIT, etc.).
- How the results are organized or filtered.

Do NOT restate the entire query in English; break it into steps.
      `.trim(),
      prompt: `
Explain the SQL query you generated to retrieve the data the user wanted.
Assume the user is not an expert in SQL. Break down the query into steps.
Be concise.

User query:
${input}

Generated SQL query:
${sqlQuery}
      `.trim(),
      schema: explanationSchema,
      output: "array",
    });

    return result.object;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate query explanation");
  }
};

/* ───────────────── Read-only runner (for UI) ───────────────── */

export const runGeneratedSQLQuery = async (query: string) => {
  const trimmed = query.trim().toLowerCase();

  // Hard guard: only allow SELECT; block everything else.
  if (
    !trimmed.startsWith("select") ||
    trimmed.includes("drop") ||
    trimmed.includes("delete") ||
    trimmed.includes("insert") ||
    trimmed.includes("update") ||
    trimmed.includes("alter") ||
    trimmed.includes("truncate") ||
    trimmed.includes("create") ||
    trimmed.includes("grant") ||
    trimmed.includes("revoke")
  ) {
    throw new Error("Only SELECT queries are allowed");
  }

  let data: any;
  try {
    data = await sql.query(query);
  } catch (e: any) {
    if (typeof e?.message === "string" && e.message.includes("does not exist")) {
      console.error("Table does not exist:", e);
      throw new Error("Table does not exist");
    }
    console.error("SQL execution error:", e);
    throw e;
  }

  return data.rows as Result[];
};

/* ───────────────── chat_ids helpers (safe read & upsert) ───────────────── */

export const upsertChat = async (input: { id: string; content: string }) => {
  const parsed = chatUpsertInputSchema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid chat upsert payload: ${message}`);
  }

  const { id, content } = parsed.data;

  try {
    const result =
      await sql<ChatRow>`
      INSERT INTO chat_ids (id, content, date_created, last_date_accessed)
      VALUES (${id}, ${content}, NOW(), NOW())
      ON CONFLICT (id)
      DO UPDATE
      SET content = EXCLUDED.content,
          last_date_accessed = NOW()
      RETURNING id, date_created, last_date_accessed, content;
    `;

    return result.rows[0] ?? null;
  } catch (e) {
    console.error("Failed to upsert chat:", e);
    throw new Error("Failed to upsert chat");
  }
};

export const getChatById = async (id: string) => {
  const parsed = chatIdSchema.safeParse(id);
  if (!parsed.success) {
    throw new Error("Invalid chat id");
  }

  try {
    const result =
      await sql<ChatRow>`
      SELECT id, date_created, last_date_accessed, content
      FROM chat_ids
      WHERE id = ${parsed.data}
      LIMIT 1;
    `;

    const row = result.rows[0] ?? null;

    if (row) {
      await sql`
        UPDATE chat_ids
        SET last_date_accessed = NOW()
        WHERE id = ${parsed.data};
      `;
    }

    return row;
  } catch (e) {
    console.error("Failed to fetch chat:", e);
    throw new Error("Failed to fetch chat");
  }
};

export const listRecentChats = async (limit = 50) => {
  const safeLimit = Math.min(Math.max(limit, 1), 200);

  try {
    const result =
      await sql<ChatRow>`
      SELECT id, date_created, last_date_accessed, content
      FROM chat_ids
      ORDER BY
        COALESCE(last_date_accessed, date_created) DESC
      LIMIT ${safeLimit};
    `;

    return result.rows;
  } catch (e) {
    console.error("Failed to list chats:", e);
    throw new Error("Failed to list chats");
  }
};

export const deleteChatById = async (id: string) => {
  const parsed = chatIdSchema.safeParse(id);
  if (!parsed.success) {
    throw new Error("Invalid chat id");
  }

  try {
    await sql`
      DELETE FROM chat_ids
      WHERE id = ${parsed.data};
    `;
    return { success: true };
  } catch (e) {
    console.error("Failed to delete chat:", e);
    throw new Error("Failed to delete chat");
  }
};
