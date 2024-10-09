"use server";

import {
  chartGenerationSchema,
  explanationsSchema,
  Unicorn,
} from "@/lib/types";
import { openai } from "@ai-sdk/openai";
import { sql } from "@vercel/postgres";
import { generateObject, streamText } from "ai";
import { z } from "zod";
import { createStreamableValue } from "ai/rsc";

export const generateQuery = async (input: string) => {
  "use server";
  try {
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

    Note: valuation is in billions of dollars so 10b would be 10.0.
    Note: if the user asks for a rate, return it as a decimal. For example, 0.1 would be 10%.
    Ensure the query is also viable for building a chart. Use multiple columns where applicable. Use counts.

    `,
      prompt: `Generate the query necessary to retrieve the data the user wants: ${input}`,
      schema: z.object({
        query: z.string(),
      }),
    });
    console.log(input, result.object.query);
    return result.object.query;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate query");
  }
};

export const getCompanies = async (query: string) => {
  "use server";
  // Check if the query is a SELECT statement
  if (!query.trim().toLowerCase().startsWith("select")) {
    throw new Error("Only SELECT queries are allowed");
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

export const explainQuery = async (input: string, sqlQuery: string) => {
  "use server";
  try {
    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        explanations: explanationsSchema,
      }),
      system: `You are a SQL (postgres) expert. Your job is to explain to the user write a SQL query you wrote to retrieve the data they asked for. The table schema is as follows:
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

    When you explain you must take a section of the query, and then explain it. Each "section" should be unique. So in a query like: "SELECT * FROM unicorns limit 20", the sections could be "SELECT *", "FROM UNICORNS", "LIMIT 20".
    If a section doesnt have any explanation, include it, but leave the explanation empty.

    `,
      prompt: `Explain the SQL query you generated to retrieve the data the user wanted. Assume the user is not an expert in SQL. Break down the query into steps. Be concise.

      User Query:
      ${input}

      Generated SQL Query:
      ${sqlQuery}`,
    });
    return result.object;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate query");
  }
};

export const generateAChart = async (results: Unicorn[], userQuery: string) => {
  "use server";
  try {
    const result = await generateObject({
      model: openai("gpt-4o"),
      system: `You are a data visualization expert. Your job is to suggest the best chart type to represent the given data and provide the necessary information for rendering the chart. Consider the number of data points, the types of variables, and the relationships between them.`,
      prompt: `Given the following data from a SQL query result, suggest the best chart type to visualize this information. Provide the columns to use, labels for the chart, and the relevant data points. Also, give a brief explanation for your choice.
      Use the right chart type for the user query. For example, if the data is about which country has the most unicorns, you might suggest a pie chart. Or for growth rate, you might suggest a line chart. Show multiple lines where necessary.
      In your description, be sure to explain the biggest takeaway from the chart. You can refactor the data and format to fit the chart type and desired takeaway.

      You can take liberty with long tail of data if it is not relevant to the chart type. For example, if the user asks for a pie chart of the top 5 countries with the most unicorns, you can ignore the rest of the data.

      User Query:
      ${userQuery}

      Data:
      ${JSON.stringify(results, null, 2)}`,
      schema: z.object({generation: chartGenerationSchema}),
      output: "object"
    });
    console.log("Chart suggestion:", result.object);
    return result.object;
  } catch (e) {
    console.error(e.message);
    throw new Error("Failed to generate chart suggestion");
  }
};
