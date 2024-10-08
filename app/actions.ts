"use server";

import { Unicorn } from "@/lib/types";
import { openai } from "@ai-sdk/openai";
import { sql } from "@vercel/postgres";
import { generateObject } from "ai";
import { z } from "zod";

export const generateQuery = async (input: string) => {
  const result = await generateObject({
    model: openai("gpt-4o"),
    system: `You are a SQL (postgres) expert. Your job is to help the user write a SQL query to retrieve the data they need. The table schema is as follows:
    unicorns (
      id SERIAL PRIMARY KEY,
      company VARCHAR(255) NOT NULL UNIQUE,
      valuation DECIMAL(10, 2) NOT NULL,
      date_joined DATE,
      country VARCHAR(255) NOT NULL,
      city VARCHAR(255) NOT NULL,
      industry VARCHAR(255) NOT NULL,
      select_investors TEXT NOT NULL
    );

    Only retrieval queries are allowed.

    For things like industry, company names and other string fields, use the ILIKE operator and convert both the search term and the field to lowercase using LOWER() function. For example: LOWER(industry) ILIKE LOWER('%search_term%').

    Note: select_investors is a comma-separated list of investors. Trim whitespace to ensure you're grouping properly. Note, some fields may be null or have onnly one value.
    When answering questions about a specific field, ensure you are selecting the identifying column (ie. what is Vercel's valuation would select company and valuation').
    Note: valuation is in billions of dollars so 10b would be 10.0.

    The industries tagged are:
    - healthcare & life sciences
    - consumer & retail
    - financial services
    - enterprise tech
    - insurance
    - media & entertainment
    - industrials
    - health

    If the user asks for a category that is not in the list, infer based on the list above.

    `,
    prompt: `Generate the query necessary to retrieve the data the user wants: ${input}`,
    schema: z.object({
      query: z.string(),
    }),
  });
  return result.object.query;
};

export const getCompanies = async (query: string) => {
  // Check if the query is a SELECT statement
  if (!query.trim().toLowerCase().startsWith('select')) {
    throw new Error('Only SELECT queries are allowed');
  }

  let data: any;
  try {
    data = await sql.query(query);
  } catch (e: any) {
    if (e.message.includes('relation "unicorns" does not exist')) {
      console.log(
        "Table does not exist, creating and seeding it with dummy data now...",
      );
      // throw error
      throw Error("Table does not exist");
    } else {
      throw e;
    }
  }

  return data.rows as Unicorn[];
};
