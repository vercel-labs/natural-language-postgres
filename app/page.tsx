"use client";

import { useState } from "react";
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
import { generateQuery, getCompanies } from "./actions";
import { Unicorn } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, X, Search, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";

export default function Component() {
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Unicorn[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [activeQuery, setActiveQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);

  const suggestionQueries = [
    "Which cities have with most AI unicorns",
    "Show the countries with highest unicorn density",
    "Show the number of unicorns (grouped by year) over the past decade",
    "Compare the average valuation of AI companies vs. biotech companies",
    "Get the investors who have invested in both fintech and healthcare unicorns",
    "Investors with the most unicorns",
    "Countries with highest unicorn density",
    "Fastest growing industries by valuation",
    "Top 5 industries by total valuation",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSubmitted(true);
    }
    setLoading(true);
    setLoadingStep(1);
    setActiveQuery("");
    const query = await generateQuery(inputValue);
    setActiveQuery(query);
    setLoadingStep(2);
    const companies = await getCompanies(query);
    const columns = companies.length > 0 ? Object.keys(companies[0]) : [];
    setResults(companies);
    setColumns(columns);
    setLoading(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleClear = () => {
    setSubmitted(false);
    setInputValue("");
    setResults([]);
    setColumns([]);
    setActiveQuery("");
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl">
        <motion.div
          className="bg-card rounded-xl border border-border overflow-hidden"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 flex items-center">
              <Sparkles className="mr-2" />
              Unicorn Query
            </h1>
            <form onSubmit={handleSubmit} className="mb-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="relative flex-grow">
                  <Input
                    type="text"
                    placeholder="Ask about unicorn companies..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                </div>
                <div className="flex sm:flex-row items-center justify-center gap-2">
                  <Button type="submit" className="w-full sm:w-auto">
                    Search
                  </Button>
                  {submitted && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClear}
                      className="w-full sm:w-auto"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </form>
            <div className="h-[500px] flex flex-col">
              <div className="flex-grow overflow-hidden relative">
                <AnimatePresence>
                  {!submitted && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full overflow-y-auto"
                    >
                      <h2 className="text-xl font-semibold text-foreground mb-4">
                        Try these queries:
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {suggestionQueries.map((suggestion, index) => (
                          <Button
                            key={index}
                            type="button"
                            variant="outline"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {submitted && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col"
                    >
                      {activeQuery.length > 0 && (
                        <p className="text-center font-mono text-sm mb-4 bg-muted text-muted-foreground rounded-md p-4">
                          {activeQuery}
                        </p>
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
                        <div className="flex-grow overflow-y-auto">
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
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <div className="bg-muted p-4">
            <Alert className="bg-muted text-muted-foreground border-0">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription>
                This application uses the AI SDK to allow you to query a
                PostgreSQL database with natural language. The dataset is CB
                Insights&apos; list of all unicorn companies. Learn more at{" "}
                <Link
                  href="https://www.cbinsights.com/research-unicorn-companies"
                  target="_blank"
                  className="text-primary hover:text-primary/90 underline"
                >
                  CB Insights
                </Link>
                .
              </AlertDescription>
            </Alert>
          </div>
        </motion.div>
      </div>
    </div>
  );
}