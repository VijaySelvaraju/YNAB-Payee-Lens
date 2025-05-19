
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

  // Use localStorage for persisting authentication
  React.useEffect(() => {
    const storedToken = localStorage.getItem("ynab-api-token");
    const storedBudgetId = localStorage.getItem("ynab-selected-budget-id");
    
    if (storedToken) {
      setApiTokenState(storedToken);
      ynabService.setApiToken(storedToken);
      
      // Auto-fetch budgets if we have a token
      fetchBudgets().then(() => {
        if (storedBudgetId) {
          setSelectedBudgetIdState(storedBudgetId);
        }
      }).catch(error => {
        console.error("Error auto-fetching budgets:", error);
        // If auto-fetch fails, reset authentication
        localStorage.removeItem("ynab-api-token");
        localStorage.removeItem("ynab-selected-budget-id");
      });
    }
  }, []);

  const setApiToken = (token: string) => {
    // Clean the token by removing any whitespace and quotes
    const cleanToken = token.trim().replace(/^["']|["']$/g, "");
    
    // Store in state and service
    setApiTokenState(cleanToken);
    ynabService.setApiToken(cleanToken);
    
    // Save to localStorage for persistence
    if (cleanToken) {
      localStorage.setItem("ynab-api-token", cleanToken);
    } else {
      localStorage.removeItem("ynab-api-token");
    }
  };

  const setSelectedBudgetId = (budgetId: string) => {
    setSelectedBudgetIdState(budgetId);
    
    // Save to localStorage for persistence
    if (budgetId) {
      localStorage.setItem("ynab-selected-budget-id", budgetId);
    } else {
      localStorage.removeItem("ynab-selected-budget-id");
    }
  };

  const fetchBudgets = async () => {
    setIsLoading(true);
    try {
      // Validate token first
      if (!apiToken) {
        toast.error("Please enter an API token");
        setIsAuthenticated(false);
        return [];
      }
      
      console.log("Fetching budgets with token (first 4 chars):", apiToken.substring(0, 4) + "****");
      const budgetsList = await ynabService.getBudgets();
      setBudgets(budgetsList);
      setIsAuthenticated(true);
      toast.success("Successfully connected to YNAB");
      return budgetsList;
    } catch (error: any) {
      console.error("Error fetching budgets:", error);
      
      // More informative error messages
      let errorMessage = "Failed to connect to YNAB.";
      
      if (error.message?.includes("401")) {
        errorMessage += " Invalid API token, please check and try again.";
      } else if (error.message?.includes("403")) {
        errorMessage += " Access forbidden, please check your permissions.";
      } else if (error.message?.includes("429")) {
        errorMessage += " Too many requests, please try again later.";
      } else if (error.message?.includes("500")) {
        errorMessage += " YNAB server error, please try again later.";
      } else if (error.message?.includes("Network")) {
        errorMessage += " Network error, please check your internet connection.";
      }
      
      toast.error(errorMessage);
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
    } catch (error: any) {
      console.error("Error analyzing payees:", error);
      
      let errorMessage = "Failed to analyze payees.";
      
      if (error.message?.includes("401")) {
        errorMessage += " Your session may have expired, please reconnect.";
        // Auto-reset on authentication failure
        reset();
      } else {
        errorMessage += " Please try again.";
      }
      
      toast.error(errorMessage);
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
    
    // Clear localStorage
    localStorage.removeItem("ynab-api-token");
    localStorage.removeItem("ynab-selected-budget-id");
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
