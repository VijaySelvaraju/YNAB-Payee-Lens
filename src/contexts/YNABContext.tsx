
import React, { createContext, useContext, useState, ReactNode } from "react";
import ynabService, { YNABBudget, PayeeAnalysis } from "@/services/ynabService";
import { toast } from "sonner";

interface YNABContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  apiToken: string;
  selectedBudgetId: string;
  budgets: YNABBudget[];
  payeeAnalysis: PayeeAnalysis[];
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

  const setApiToken = (token: string) => {
    setApiTokenState(token);
    ynabService.setApiToken(token);
  };

  const setSelectedBudgetId = (budgetId: string) => {
    setSelectedBudgetIdState(budgetId);
  };

  const fetchBudgets = async () => {
    setIsLoading(true);
    try {
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
