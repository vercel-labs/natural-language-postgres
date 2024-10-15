"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  explainQuery,
  generateChartConfig,
  generateQuery,
  getCompanies,
} from "./actions";
import { Config, QueryExplanation, Unicorn } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Info,
  X,
  Search,
  Sparkles,
  Loader2,
  BarChart2,
  Moon,
  Sun,
  MessageCircleQuestion,
  CircleHelp,
} from "lucide-react";
import Link from "next/link";
import { useOutsideClick } from "@/lib/use-outside-click";
import { QueryWithTooltips } from "@/components/ui/query-with-tooltips";
import { DynamicChart } from "@/components/dynamic-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkeletonCard } from "@/components/skeleton-card";
import { useTheme } from "next-themes";
import { DeployButton } from "@/components/deploy-button";

export default function Component() {
  const activeQueryCutoff = 100;
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Record<string, string | number>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [activeQuery, setActiveQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [queryExplanations, setQueryExplanations] = useState<
    QueryExplanation[] | null
  >();
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [chartConfig, setChartConfig] = useState<Config | null>(null);
  const [queryExpanded, setQueryExpanded] = useState(false);

  const { theme, setTheme } = useTheme();

  const suggestionQueries = [
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
    {
      desktop: "Fastest growing industries by valuation",
      mobile: "Fast sectors",
    },
    {
      desktop: "Compare count of unicorns in SF and NY over time",
      mobile: "SF vs NY",
    },
    {
      desktop: "Top 5 industries by total valuation",
      mobile: "Top 5 sectors",
    },
  ];

  const handleSubmit = async (suggestion?: string) => {
    const question = suggestion ?? inputValue;
    if (inputValue.length === 0 && !suggestion) return;
    clearExistingData();
    if (question.trim()) {
      setSubmitted(true);
    }
    setLoading(true);
    setLoadingStep(1);
    setActiveQuery("");
    const query = await generateQuery(question);
    setActiveQuery(query);
    setLoadingStep(2);
    if (query.length < activeQueryCutoff) setQueryExpanded(true);
    const companies = await getCompanies(query);
    const columns = companies.length > 0 ? Object.keys(companies[0]) : [];
    setResults(companies);
    setColumns(columns);
    setLoading(false);
    const generation = await generateChartConfig(companies, question);
    setChartConfig(generation.config);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setInputValue(suggestion);
    await handleSubmit(suggestion);
  };

  const clearExistingData = () => {
    setActiveQuery("");
    setResults([]);
    setColumns([]);
    setChartConfig(null);
    setQueryExplanations(null);
    setQueryExpanded(false);
  };

  const handleClear = () => {
    setSubmitted(false);
    setInputValue("");
    clearExistingData();
  };

  const handleExplainQuery = async () => {
    setQueryExpanded(true);
    setLoadingExplanation(true);
    const { explanations } = await explainQuery(inputValue, activeQuery);
    setQueryExplanations(explanations);
    setLoadingExplanation(false);
  };

  const formatColumnTitle = (title: string) => {
    return title
      .split("_")
      .map((word, index) =>
        index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word,
      )
      .join(" ");
  };

  const formatCellValue = (column: string, value: any) => {
    if (column.toLowerCase().includes("valuation")) {
      const formattedValue = parseFloat(value).toFixed(2);
      const trimmedValue = formattedValue.replace(/\.?0+$/, "");
      return `$${trimmedValue}B`;
    }
    if (column.toLowerCase().includes("rate")) {
      const parsedValue = parseFloat(value);
      if (isNaN(parsedValue)) {
        return "";
      }
      const percentage = (parsedValue * 100).toFixed(2);
      return `${percentage}%`;
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    return String(value);
  };

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 flex items-start justify-center p-0 sm:p-8">
      <div className="w-full max-w-4xl min-h-dvh sm:min-h-0 flex flex-col ">
        <motion.div
          className="bg-card rounded-xl sm:border sm:border-border flex-grow flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="p-6 sm:p-8 flex flex-col flex-grow">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center">
                Natural Language PostgreSQL
              </h1>
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                >
                  {theme === "dark" ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </Button>
                <div className="hidden sm:block">
                  <DeployButton />
                </div>
              </div>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                await handleSubmit();
              }}
              className="mb-6"
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="relative flex-grow">
                  <Input
                    type="text"
                    placeholder="Ask about startup unicorns..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="pr-10 text-base"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                </div>
                <div className="flex sm:flex-row items-center justify-center gap-2">
                  {submitted ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClear}
                      className="w-full sm:w-auto"
                    >
                      Clear
                    </Button>
                  ) : (
                    <Button type="submit" className="w-full sm:w-auto">
                      Send
                    </Button>
                  )}
                </div>
              </div>
            </form>
            <div
              id="main-container"
              className="flex-grow flex flex-col min-h-[300px] sm:min-h-[470px]"
            >
              <div className="flex-grow h-full">
                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      layout
                      className="sm:h-full min-h-[400px] flex flex-col"
                    >
                      {activeQuery.length > 0 && (
                        <div className="mb-4 relative group">
                          <div
                            className={`bg-muted rounded-md p-4 ${queryExpanded ? "" : "text-muted-foreground"}`}
                          >
                            <p className="font-mono text-sm">
                              {queryExpanded ? (
                                queryExplanations &&
                                queryExplanations.length > 0 ? (
                                  <>
                                    <QueryWithTooltips
                                      query={activeQuery}
                                      queryExplanations={queryExplanations}
                                    />
                                    <p className="font-sans mt-4 text-base">
                                      Generated explanation! Hover over
                                      different parts of the SQL query to see
                                      explanations.
                                    </p>
                                  </>
                                ) : (
                                  <div className="flex justify-between items-center">
                                    <span className="">{activeQuery}</span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={handleExplainQuery}
                                      className="h-fit hover:text-muted-foreground hidden sm:inline-block"
                                      aria-label="Explain query"
                                      disabled={loadingExplanation}
                                    >
                                      {loadingExplanation ? (
                                        <Loader2 className="h-10 w-10 p-2 animate-spin " />
                                      ) : (
                                        <CircleHelp className="h-10 w-10 p-2 " />
                                      )}
                                    </Button>
                                  </div>
                                )
                              ) : (
                                <span>
                                  {activeQuery.slice(0, activeQueryCutoff)}
                                  {activeQuery.length > activeQueryCutoff
                                    ? "..."
                                    : ""}
                                </span>
                              )}
                            </p>
                          </div>
                          {!queryExpanded && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setQueryExpanded(true)}
                              className="absolute inset-0 h-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out"
                            >
                              Show full query
                            </Button>
                          )}
                        </div>
                      )}
                      {loading ? (
                        <div className="h-full absolute bg-background/50 w-full flex flex-col items-center justify-center space-y-4">
                          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                          <p className="text-foreground">
                            {loadingStep === 1
                              ? "Generating SQL query..."
                              : "Running SQL query..."}
                          </p>
                        </div>
                      ) : results.length === 0 ? (
                        <div className="flex-grow flex items-center justify-center">
                          <p className="text-center text-muted-foreground">
                            No results found.
                          </p>
                        </div>
                      ) : (
                        <div className="flex-grow flex flex-col">
                          <Tabs
                            defaultValue="table"
                            className="w-full flex-grow flex flex-col"
                          >
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="table">Table</TabsTrigger>
                              <TabsTrigger
                                value="charts"
                                disabled={
                                  Object.keys(results[0] || {}).length <= 1
                                }
                              >
                                Chart
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent
                              value="table"
                              className="flex-grow overflow-y-scroll"
                            >
                              <div className="sm:min-h-[10px] relative">
                                <Table className="min-w-full divide-y divide-border">
                                  <TableHeader className="bg-secondary sticky top-0 shadow-sm">
                                    <TableRow>
                                      {columns.map((column, index) => (
                                        <TableHead
                                          key={index}
                                          className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                                        >
                                          {formatColumnTitle(column)}
                                        </TableHead>
                                      ))}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody className="bg-card divide-y divide-border">
                                    {results.map((company, index) => (
                                      <TableRow
                                        key={index}
                                        className="hover:bg-muted"
                                      >
                                        {columns.map((column, cellIndex) => (
                                          <TableCell
                                            key={cellIndex}
                                            className="px-6 py-4 whitespace-nowrap text-sm text-foreground"
                                          >
                                            {formatCellValue(
                                              column,
                                              company[column as keyof Unicorn],
                                            )}
                                          </TableCell>
                                        ))}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </TabsContent>
                            <TabsContent
                              value="charts"
                              className="flex-grow overflow-auto"
                            >
                              <div className="mt-4">
                                {chartConfig && results.length > 0 ? (
                                  <DynamicChart
                                    chartData={results}
                                    chartConfig={chartConfig}
                                  />
                                ) : (
                                  <SkeletonCard />
                                )}
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      )}
                    </motion.div>
                  ) : (
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
                            type="button"
                            variant="outline"
                            onClick={() =>
                              handleSuggestionClick(suggestion.desktop)
                            }
                          >
                            <span className="sm:hidden">
                              {suggestion.mobile}
                            </span>
                            <span className="hidden sm:inline">
                              {suggestion.desktop}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <div className="bg-muted p-4 mt-auto">
            <Alert className="bg-muted text-muted-foreground border-0">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription>
                This application uses the{" "}
                <Link
                  target="_blank"
                  className="text-primary hover:text-primary/90 underline"
                  href="https://sdk.vercel.ai"
                >
                  AI SDK
                </Link>{" "}
                to allow you to query a PostgreSQL database with natural
                language. The dataset is CB Insights&apos; list of all unicorn
                companies. Learn more at{" "}
                <Link
                  href="https://www.cbinsights.com/research-unicorn-companies"
                  target="_blank"
                  className="text-primary hover:text-primary/90 underline"
                >
                  CB Insights
                </Link>
                .
                <div className="mt-4 sm:hidden">
                  <DeployButton />
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
