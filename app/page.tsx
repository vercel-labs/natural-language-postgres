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

export default function Component() {
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Unicorn[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [activeQuery, setActiveQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestionQueries = [
    "Get the most valuable company Sequoia invested in",
    "Get the most valuable company in the world",
    "List all unicorns in the fintech industry",
    "Show companies founded after 2010 with valuation over $10B",
    "List companies in the healthcare industry with valuations over $5B",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSubmitted(true);
    }
    setLoading(true);
    setActiveQuery("");
    const query = await generateQuery(inputValue);
    console.log(query);
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

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <motion.div
        className="w-full max-w-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <LayoutGroup>
          <motion.div
            className="bg-white rounded-lg shadow-lg overflow-hidden"
            layout
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <Input
                  type="text"
                  placeholder="Enter your query..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-grow"
                />
                <Button type="submit">Submit</Button>
              </div>
              <AnimatePresence>
                {!submitted && (
                  <motion.div
                    className="flex flex-wrap gap-2 mt-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
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
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="px-6 pb-6">
                    {activeQuery.length > 0 && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="text-center font-mono text-sm my-2 bg-neutral-50 p-4"
                      >
                        {activeQuery}
                      </motion.p>
                    )}
                    {loading ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="text-center text-gray-500"
                      >
                        Loading...
                      </motion.p>
                    ) : results.length === 0 ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="text-center text-gray-500"
                      >
                        No results found.
                      </motion.p>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {columns.map((column, index) => (
                                <TableHead key={index}>{column}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {results.map((company, index) => (
                              <TableRow key={index}>
                                {columns.map((column, cellIndex) => (
                                  <TableCell key={cellIndex}>
                                    {company[column as keyof Unicorn] instanceof
                                    Date
                                      ? (
                                          company[
                                            column as keyof Unicorn
                                          ] as Date
                                        ).toLocaleDateString()
                                      : String(
                                          company[column as keyof Unicorn]
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