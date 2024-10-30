import { motion } from "framer-motion";
import { Button } from "./ui/button";

export const SuggestedQueries = ({
  handleSuggestionClick,
}: {
  handleSuggestionClick: (suggestion: string) => void;
}) => {
  const suggestionQueries = [
    {
      desktop: "Compare count of unicorns in SF and NY over time",
      mobile: "SF vs NY",
    },
    {
      desktop: "Compare unicorn valuations in the US vs China over time",
      mobile: "US vs China",
    },
    {
      desktop: "Countries with highest unicorn density",
      mobile: "Top countries",
    },
    {
      desktop:
        "Show the number of unicorns founded each year over the past two decades",
      mobile: "Yearly count",
    },
    {
      desktop: "Display the cumulative total valuation of unicorns over time",
      mobile: "Total value",
    },
    {
      desktop:
        "Compare the yearly funding amounts for fintech vs healthtech unicorns",
      mobile: "Fintech vs health",
    },
    {
      desktop: "Which cities have with most SaaS unicorns",
      mobile: "SaaS cities",
    },
    {
      desktop: "Show the countries with highest unicorn density",
      mobile: "Dense nations",
    },
    {
      desktop:
        "Show the number of unicorns (grouped by year) over the past decade",
      mobile: "Decade trend",
    },
    {
      desktop:
        "Compare the average valuation of AI companies vs. biotech companies",
      mobile: "AI vs biotech",
    },
    {
      desktop: "Investors with the most unicorns",
      mobile: "Top investors",
    },
  ];

  return (
    <motion.div
      key="suggestions"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      layout
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto"
    >
      <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
        Try these queries:
      </h2>
      <div className="flex flex-wrap gap-2">
        {suggestionQueries.map((suggestion, index) => (
          <Button
            key={index}
            className={index > 5 ? "hidden sm:inline-block" : ""}
            type="button"
            variant="outline"
            onClick={() => handleSuggestionClick(suggestion.desktop)}
          >
            <span className="sm:hidden">{suggestion.mobile}</span>
            <span className="hidden sm:inline">{suggestion.desktop}</span>
          </Button>
        ))}
      </div>
    </motion.div>
  );
};
