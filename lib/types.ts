import { z } from "zod";

export type Unicorn = {
  id: number;
  company: string;
  valuation: number;
  date_joined: Date | null;
  country: string;
  city: string;
  industry: string;
  select_investors: string;
};

export type Result = Record<string, string | number>;

export const explanationSchema = z.object({
  section: z.string(),
  explanation: z.string(),
});
export const explanationsSchema = z.array(explanationSchema);

export type QueryExplanation = z.infer<typeof explanationSchema>;

export const chartGenerationSchema = z.object({
  description: z
    .string()
    .describe(
      "Describe the chart. What is it showing? What is interesting about the way the data is displayed?",
    ),
  takeaway: z.string().describe("What is the main takeaway from the chart?"),
  chartType: z.enum(["bar", "line", "pie"]),
  columns: z.array(z.string()),
  labels: z.object({
    xAxis: z.string(),
    yAxis: z.string(),
    title: z.string(),
  }),
  data: z
    .string()
    .describe(
      "csv data for the chart. include the header row! Refactor the data to fit the chart type.",
    ),
});

export type ChartGeneration = z.infer<typeof chartGenerationSchema>;

// Define the schema for chart data
export const dataSchema = z
  .array(
    z
      .record(
        z.string().describe("Column name"),
        z.union([z.string(), z.number()]).describe("Data point value"),
      )
      .describe("Row of chart data"),
  )
  .describe("Array of chart data rows");

// Define the schema for chart configuration
export const configSchema = z
  .object({
    description: z
      .string()
      .describe(
        "Describe the chart. What is it showing? What is interesting about the way the data is displayed?",
      ),
    takeaway: z.string().describe("What is the main takeaway from the chart?"),
    type: z.enum(["bar", "line", "area", "pie"]).describe("Type of chart"),
    title: z.string(),
    xKey: z.string().describe("Key for x-axis or category"),
    yKeys: z.array(z.string()).describe("Key(s) for y-axis values this is typically the quantitative column"),
    multipleLines: z.boolean().describe("For line charts only: whether the chart is comparing groups of data.").optional(),
    measurementColumn: z.string().describe("For line charts only: key for quantitative y-axis column to measure against (eg. values, counts etc.)").optional(),
    colors: z
      .record(
        z.string().describe("Any of the yKeys"),
        z.string().describe("Color value in CSS format (e.g., hex, rgb, hsl)"),
      )
      .describe("Mapping of data keys to color values for chart elements")
      .optional(),
    legend: z.boolean().describe("Whether to show legend"),
  })
  .describe("Chart configuration object");

// Combine data and config schemas into a single chart schema
export const chartSchema = z
  .object({
    data: dataSchema,
    config: configSchema,
  })
  .describe("Complete chart data and configuration");

export type Chart = z.infer<typeof chartSchema>;
export type Data = z.infer<typeof dataSchema>;
export type Config = z.infer<typeof configSchema>;
