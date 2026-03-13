
import React, { createContext, useContext, useState, ReactNode } from "react";
import ynabService, { YNABBudget, PayeeAnalysis } from "@/services/ynabService";
import { CurrencyFormat } from "@/lib/utils";
import { toast } from "sonner";

interface YNABContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  apiToken: string;
  selectedBudgetId: string;
  budgets: YNABBudget[];
  payeeAnalysis: PayeeAnalysis[];
  currencyFormat: CurrencyFormat | null;
  setApiToken: (token: string) => void;
  setSelectedBudgetId: (budgetId: string) => void;
  fetchBudgets: () => Promise<YNABBudget[]>;
  analyzePayees: () => Promise<PayeeAnalysis[]>;
  reset: () => void;
}

const YNABContext = createContext<YNABContextType | undefined>(undefined);

export const YNABProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiToken, setApiTokenState] = useState("");
  const [selectedBudgetId, setSelectedBudgetIdState] = useState("");
  const [budgets, setBudgets] = useState<YNABBudget[]>([]);
  const [payeeAnalysis, setPayeeAnalysis] = useState<PayeeAnalysis[]>([]);

  const currencyFormat: CurrencyFormat | null =
    budgets.find((b) => b.id === selectedBudgetId)?.currency_format ?? null;

  const setApiToken = (token: string) => {
    // Clean the token by removing any whitespace and quotes
    const cleanToken = token.trim().replace(/^["']|["']$/g, "");
    
    // Check if token looks like a URL or other non-token format
    if (cleanToken.includes("http") || cleanToken.length < 10) {
      toast.error("The API token format appears invalid. Please check your YNAB token.");
      return;
    }

    setApiTokenState(cleanToken);
    ynabService.setApiToken(cleanToken);
  };

  const setSelectedBudgetId = (budgetId: string) => {
    setSelectedBudgetIdState(budgetId);
  };

  const fetchBudgets = async () => {
    setIsLoading(true);
    try {
      // Read from ynabService (synchronously updated) rather than apiToken state,
      // which may not have flushed yet when called immediately after setApiToken().
      const effectiveToken = ynabService.getApiToken();
      if (!effectiveToken || effectiveToken.trim().length < 10) {
        toast.error("Invalid API token. Please provide a valid YNAB API token.");
        setIsAuthenticated(false);
        return [];
      }

      console.log("Fetching budgets with token (first 4 chars):", effectiveToken.substring(0, 4) + "****");
      const budgetsList = await ynabService.getBudgets();
      setBudgets(budgetsList);
      setIsAuthenticated(true);
      toast.success("Successfully connected to YNAB");
      return budgetsList;
    } catch (error) {
      console.error("Error fetching budgets:", error);
      toast.error("Failed to connect to YNAB. Please check your API token.");
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const analyzePayees = async () => {
    if (!selectedBudgetId) {
      toast.error("Please select a budget first");
      return [];
    }

    setIsLoading(true);
    try {
      const analysis = await ynabService.analyzePayees(selectedBudgetId);
      setPayeeAnalysis(analysis);
      toast.success(`Analysis complete: Found ${analysis.length} payees`);
      return analysis;
    } catch (error) {
      console.error("Error analyzing payees:", error);
      toast.error("Failed to analyze payees. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setIsAuthenticated(false);
    setApiTokenState("");
    setSelectedBudgetIdState("");
    setBudgets([]);
    setPayeeAnalysis([]);
    ynabService.setApiToken("");
  };

  return (
    <YNABContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        apiToken,
        selectedBudgetId,
        budgets,
        payeeAnalysis,
        currencyFormat,
        setApiToken,
        setSelectedBudgetId,
        fetchBudgets,
        analyzePayees,
        reset
      }}
    >
      {children}
    </YNABContext.Provider>
  );
};

export const useYNAB = () => {
  const context = useContext(YNABContext);
  if (context === undefined) {
    throw new Error("useYNAB must be used within a YNABProvider");
  }
  return context;
};
