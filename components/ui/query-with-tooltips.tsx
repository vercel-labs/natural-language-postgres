import { QueryExplanation } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

export function QueryWithTooltips({
  query,
  queryExplanations,
}: {
  query: string;
  queryExplanations: QueryExplanation[];
}) {
  return (
    <div className="font-mono bg-muted rounded-lg p-4 pr-6 mb-4 overflow-x-auto">
      {queryExplanations.map((explanation, index) => {
        const startIndex = query.indexOf(explanation.section);
        if (startIndex === -1) return null;

        return (
          <span key={index}>
            {/* <span
              className={`hover:bg-primary/10 rounded-sm mr-1 ${index === 0 ? "pr-1" : "px-1"}`}
            >
              {explanation.section}
            </span> */}
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline hover:bg-primary/20 transition-colors duration-200 ease-in-out rounded-sm px-1 cursor-help">
                    {explanation.section}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xl font-sans">
                  <p className="whitespace-normal">{explanation.explanation}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </span>
        );
      })}
    </div>
  );
}
