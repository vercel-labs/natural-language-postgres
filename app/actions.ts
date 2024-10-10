"use server";

import {
  chartGenerationSchema,
  chartSchema,
  Config,
  configSchema,
  dataSchema,
  explanationsSchema,
  Result,
  Unicorn,
} from "@/lib/types";
import { openai } from "@ai-sdk/openai";
import { sql } from "@vercel/postgres";
import { generateObject, generateText, streamObject, streamText } from "ai";
import { z } from "zod";
import { createStreamableValue } from "ai/rsc";

export const generateQuery = async (input: string) => {
  "use server";
  try {
    const result = await generateObject({
      model: openai("gpt-4o"),
      system: `You are a SQL (postgres) and data visualization expert. Your job is to help the user write a SQL query to retrieve the data they need. The table schema is as follows:

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

    The industries available are:
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

    If the user asks for 'over time' data, return by year.

    When searching for UK or USA, write out United Kingdom or United States respectively.

    EVERY QUERY SHOULD RETURN QUANTITATIVE DATA THAT CAN BE PLOTTED ON A CHART! There should always be at least two columns. If the user asks for a single column, return the column and the count of the column. If the user asks for a rate, return the rate as a decimal. For example, 0.1 would be 10%.
    `,
      prompt: `Generate the query necessary to retrieve the data the user wants: ${input}`,
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

  return data.rows as Result[];
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

export const generateAChart = async (results: Result[], userQuery: string) => {
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
      schema: z.object({ generation: chartGenerationSchema }),
      output: "object",
    });
    return result.object;
  } catch (e) {
    // @ts-expect-error e
    console.error(e.message);
    throw new Error("Failed to generate chart suggestion");
  }
};

export const generateChart = async (results: Result[], userQuery: string) => {
  "use server";
  const system = `You are a data visualization expert. `;

  try {
    const { object: config } = await generateObject({
      model: openai("gpt-4o"),
      system,
      prompt: `Given the following data from a SQL query result, generate the chart config that best visualises the data and answers the users query.
      For multiple groups use multi-lines.

      Here is an example complete config:
      export const chartConfig = {
        type: "pie",
        xKey: "month",
        yKeys: ["sales", "profit", "expenses"],
        colors: {
          sales: "#4CAF50",    // Green for sales
          profit: "#2196F3",   // Blue for profit
          expenses: "#F44336"  // Red for expenses
        },
        legend: true
      }

      User Query:
      ${userQuery}

      Data:
      ${JSON.stringify(results, null, 2)}`,
      schema: configSchema,
    });

    const colors: Record<string, string> = {};
    config.yKeys.forEach((key, index) => {
      colors[key] = `hsl(var(--chart-${index+1}))`;
    });

    const updatedConfig: Config = { ...config, colors };
    return { config: updatedConfig };
  } catch (e) {
    // @ts-expect-errore
    console.error(e.message);
    throw new Error("Failed to generate chart suggestion");
  }
};

export const streamChartData = async (
  config: Config,
  results: Unicorn[],
  userQuery: string,
) => {
  const stream = createStreamableValue<string[]>([]);
  try {
    (async () => {
      const { object: dataObj, elementStream } = await streamObject({
        model: openai("gpt-4o"),
        system: `You are a data visualization expert.`,
        prompt: `Given the following available data from a SQL query result, generate the datapoints (in csv format) that best visualises the data and answers the users query.

    Here is an example complete data:
    month,sales,profit,expenses
    January,1000,200,800
    February,1200,250,950
    March,1500,300,1200
    April,1800,350,1450
    May,2000,400,1600
    June,2200,450,1750

    User Query:
    ${userQuery}

    Available Data:
    ${JSON.stringify(results, null, 2)}

    Chart Config to Use to Guide Data Generation:
    ${JSON.stringify(config)}

    Return only the data.
    `,
        schema: z
          .string()
          .describe("CSV formatted data points for a chart with a header row"),
        output: "array",
      });
      let items = [];
      for await (const el of elementStream) {
        items.push(el);
        stream.update(items);
      }
      stream.done(items);
    })();
    return stream.value;
  } catch (e) {
    console.error(e);
    throw Error();
  }
};

export const generateChartData = async (
  config: Config,
  results: Unicorn[],
  userQuery: string,
) => {
  try {
    const { object: dataObj } = await generateObject({
      model: openai("gpt-4o-mini"),
      system: `You are a data visualization expert.`,
      prompt: `Given the following available data from a SQL query result, generate the datapoints (in csv format) that best visualises the data and answers the users query.

    Here is an example complete data:
    month,sales,profit,expenses
    January,1000,200,800
    February,1200,250,950
    March,1500,300,1200
    April,1800,350,1450
    May,2000,400,1600
    June,2200,450,1750

    User Query:
    ${userQuery}

    Available Data:
    ${JSON.stringify(results, null, 2)}

    Chart Config to Use to Guide Data Generation:
    ${JSON.stringify(config)}

    Return only the data.
    `,
      schema: z
        .object({ data: z.string() })
        .describe("CSV formatted data points for a chart with a header row"),
    });
    return dataObj;
  } catch (e) {
    console.error(e);
    throw Error();
  }
};

export const generateChartConfig = async (results: Result[], userQuery: string) => {
  "use server";
  const system = `You are a SQL and data visualization expert.`;

  try {
    const { object: config } = await generateObject({
      model: openai("gpt-4o"),
      system,
      prompt: `Given the following data from a SQL query result, generate the chart config that could visualises the data and answers the users query without any data modification.
      For multiple groups use multi-lines.

      Here is an example complete config:
      export const chartConfig = {
        type: "pie",
        xKey: "month",
        yKeys: ["sales", "profit", "expenses"],
        colors: {
          sales: "#4CAF50",    // Green for sales
          profit: "#2196F3",   // Blue for profit
          expenses: "#F44336"  // Red for expenses
        },
        legend: true
      }

      User Query:
      ${userQuery}

      Data:
      ${JSON.stringify(results, null, 2)}`,
      schema: configSchema,
    });

    const colors: Record<string, string> = {};
    config.yKeys.forEach((key, index) => {
      colors[key] = `hsl(var(--chart-${index+1}))`;
    });

    const updatedConfig: Config = { ...config, colors };
    return { config: updatedConfig };
  } catch (e) {
    // @ts-expect-errore
    console.error(e.message);
    throw new Error("Failed to generate chart suggestion");
  }
};
