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

export const explanationSchema = z.object({
  section: z.string(),
  explanation: z.string(),
});
export const explanationsSchema = z.array(explanationSchema);

export type QueryExplanation = z.infer<typeof explanationSchema>;

export const chartGenerationSchema = z.object({
  description: z.string().describe("Describe the chart. What is it showing? What is interesting about the way the data is displayed?"),
  takeaway: z.string().describe("What is the main takeaway from the chart?"),
  chartType: z.enum(["bar", "line", "pie"]),
  columns: z.array(z.string()),
  labels: z.object({
    xAxis: z.string(),
    yAxis: z.string(),
    title: z.string(),
  }),
  data: z.string().describe("csv data for the chart. include the header row! Refactor the data to fit the chart type."),
});

export type ChartGeneration = z.infer<typeof chartGenerationSchema>;
