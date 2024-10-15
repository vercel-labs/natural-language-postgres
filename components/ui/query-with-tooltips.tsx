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
  const segments = segmentQuery(query, queryExplanations);

  return (
    <div className="font-mono bg-muted rounded-lg overflow-x-auto">
      {segments.map((segment, index) => (
        <span key={index}>
          {segment.explanation ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block hover:bg-primary/20 transition-colors duration-200 ease-in-out rounded-sm px-1 cursor-help">
                    {segment.text}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" avoidCollisions={true}  className="max-w-xl font-sans">
                  <p className="whitespace-normal">{segment.explanation}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            segment.text
          )}
        </span>
      ))}
    </div>
  );
}

function segmentQuery(query: string, explanations: QueryExplanation[]): Array<{ text: string; explanation?: string }> {
  const segments: Array<{ text: string; explanation?: string }> = [];
  let lastIndex = 0;

  // Sort explanations by their position in the query
  const sortedExplanations = explanations
    .map(exp => ({ ...exp, index: query.indexOf(exp.section) }))
    .filter(exp => exp.index !== -1)
    .sort((a, b) => a.index - b.index);

  sortedExplanations.forEach(exp => {
    if (exp.index > lastIndex) {
      // Add any text before the current explanation as a segment without explanation
      segments.push({ text: query.slice(lastIndex, exp.index) });
    }
    segments.push({ text: exp.section, explanation: exp.explanation });
    lastIndex = exp.index + exp.section.length;
  });

  // Add any remaining text after the last explanation
  if (lastIndex < query.length) {
    segments.push({ text: query.slice(lastIndex) });
  }

  return segments;
}
