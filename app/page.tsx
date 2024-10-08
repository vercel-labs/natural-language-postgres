"use client";

import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
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
import { Info, X } from "lucide-react";

export default function Component() {
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Unicorn[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [activeQuery, setActiveQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestionQueries = [
    "Get the 10 most prolific investors in the last 3 years",
    "Compare the average valuation of AI companies vs. biotech companies",
    "Find the top 5 countries with the most unicorns founded in the last 5 years",
    "Get the investors who have invested in both fintech and healthcare unicorns",
    "Show the growth rate (grouped by year) of valuations in the AI sector over the past decade",
    "Investors with the most unicorns",
    "Countries with highest unicorn density",
    "Fastest growing industries by valuation",
    "Top 5 industries by total valuation",
    // "Get the most valuable company Sequoia invested in",
    // "Get the most valuable company in the world",
    // "List all unicorns in the fintech industry",
    // "Show companies founded after 2010 with valuation over $10B",
    // "List companies in the healthcare industry with valuations over $5B",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSubmitted(true);
    }
    setLoading(true);
    setActiveQuery("");
    const query = await generateQuery(inputValue);
    setActiveQuery(query);
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
    <div className="min-h-screen bg-gray-100 flex items-start sm:items-center justify-center p-4 sm:p-8">
      <motion.div
        className="w-full max-w-3xl h-full sm:h-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <LayoutGroup>
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          >
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                This application uses the AI SDK to allow you to query a
                PostgreSQL database with natural language. The dataset is CB
                Insights&apos; list of all unicorn companies. Learn more at{" "}
                <a
                  href="https://www.cbinsights.com/research-unicorn-companies"
                  className="text-blue-600 hover:underline"
                >
                  CB Insights
                </a>
                .
              </AlertDescription>
            </Alert>
          </motion.div>
          <motion.div
            className="bg-white rounded-lg border border-border overflow-hidden h-full sm:h-auto"
            layout
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          >
            <form onSubmit={handleSubmit} className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
                <Input
                  type="text"
                  placeholder="Enter your query..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-grow text-base"
                />
                <div className="flex space-x-2">
                  <Button type="submit" className="w-full sm:w-auto">
                    Submit
                  </Button>
                  {submitted && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClear}
                      className="flex items-center justify-center w-full sm:w-auto"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              <AnimatePresence>
                {!submitted && (
                  <motion.div
                    className="flex flex-wrap gap-2 mt-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    {suggestionQueries.map((suggestion, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`w-full sm:w-auto text-xs sm:text-base ${index < 5 ? "hidden sm:block" : "block sm:hidden"}`}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
            <AnimatePresence>
              {submitted && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    duration: 0.4,
                    ease: "easeInOut",
                    when: "beforeChildren",
                  }}
                >
                  <div className="px-4 sm:px-6 pb-6 overflow-x-auto">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {activeQuery.length > 0 && (
                        <p className="text-center font-mono text-xs sm:text-sm mb-4 bg-neutral-50 border border-neutral-100 rounded-md p-4">
                          {activeQuery}
                        </p>
                      )}
                    </motion.div>
                    {loading ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-center text-gray-500"
                      >
                        Loading...
                      </motion.p>
                    ) : results.length === 0 ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-center text-gray-500"
                      >
                        No results found.
                      </motion.p>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {columns.map((column, index) => (
                                <TableHead key={index}>
                                  {formatColumnTitle(column)}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {results.map((company, index) => (
                              <TableRow key={index}>
                                {columns.map((column, cellIndex) => (
                                  <TableCell key={cellIndex}>
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
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      </motion.div>
    </div>
  );
}
