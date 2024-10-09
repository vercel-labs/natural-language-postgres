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
  chartType: z.enum(["bar", "line", "pie"]),
  columns: z.array(z.string()),
  labels: z.object({
    xAxis: z.string(),
    yAxis: z.string(),
    title: z.string(),
  }),
  data: z.string().describe("csv data for the chart. include the header row!"),
  explanation: z.string(),
});

export type ChartGeneration = z.infer<typeof chartGenerationSchema>;
