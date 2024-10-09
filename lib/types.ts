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


export const explanationSchema = z.object({ section: z.string(), explanation: z.string() })
export const explanationsSchema = z.array(explanationSchema
);

export type QueryExplanation = z.infer<typeof explanationSchema>;
