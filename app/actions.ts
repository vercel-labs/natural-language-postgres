"use server";

import { sql } from "@vercel/postgres";
import { Result } from "@/lib/types";
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

import { explanationSchema } from "@/lib/types";
import { z } from 'zod';


export const generateQuery = async (input: string) => {
  'use server';
  try {
    const result = await generateObject({
      model: openai('gpt-4o'),
      system: `You are a SQL (postgres) ...
      
      [full system prompt here.]`,
      prompt: `Generate the query necessary to retrieve the data the user wants: ${input}`,
      schema: z.object({
        query: z.string(),
      }),
    });
    return result.object.query;
  } catch (e) {
    console.error(e);
    throw new Error('Failed to generate query');
  }
};

  export const explainQuery = async (input: string, sqlQuery: string) => {
  'use server';
  try {
    const result = await generateObject({
      model: openai('gpt-4o'),
      system: `You are a SQL (postgres) expert. ...
      
      [full system prompt here.]`,
      prompt: `Explain the SQL query you generated to retrieve the data the user wanted. Assume the user is not an expert in SQL. Break down the query into steps. Be concise.

      User Query:
      ${input}

      Generated SQL Query:
      ${sqlQuery}`,
      schema: explanationSchema,
      output: 'array',
    });
    return result.object;
  } catch (e) {
    console.error(e);
    throw new Error('Failed to generate query');
  }
};

export const runGeneratedSQLQuery = async (query: string) => {
  "use server";
  if (
    !query.trim().toLowerCase().startsWith("select") ||
    query.trim().toLowerCase().includes("drop") ||
    query.trim().toLowerCase().includes("delete") ||
    query.trim().toLowerCase().includes("insert") ||
    query.trim().toLowerCase().includes("update") ||
    query.trim().toLowerCase().includes("alter") ||
    query.trim().toLowerCase().includes("truncate") ||
    query.trim().toLowerCase().includes("create") ||
    query.trim().toLowerCase().includes("grant") ||
    query.trim().toLowerCase().includes("revoke")
  ) {
    throw new Error("Only SELECT queries are allowed");
  }

  let data: any;
  try {
    data = await sql.query(query);
  } catch (e: any) {
    if (e.message.includes('relation "relation" does not exist')) {
      console.log(
        "Table does not exist, creating and seeding it with dummy data now...",
      );
      // throw error
      throw Error("Table does not exist");
    } else {
      throw e;
    }
  }

  return data.rows as Result[];
};