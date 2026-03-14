
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import ynabService, { YNABBudget, PayeeAnalysis } from "@/services/ynabService";
import { CurrencyFormat } from "@/lib/utils";
import { toast } from "sonner";
import {
  cacheSet,
  cacheGet,
  cacheClear,
  saveApiToken,
  loadApiToken,
  clearApiToken,
  getRememberToken,
  saveSelectedBudget,
  loadSelectedBudget,
  clearSelectedBudget,
  clearAll,
} from "@/lib/storage";

const BUDGETS_TTL = 30 * 60 * 1000; // 30 minutes
const ANALYSIS_TTL = 10 * 60 * 1000; // 10 minutes

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
  refreshData: () => Promise<void>;
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

  // On mount: restore state from localStorage if "remember" is enabled
  useEffect(() => {
    if (!getRememberToken()) return;

    const savedToken = loadApiToken();
    if (!savedToken) return;

    ynabService.setApiToken(savedToken);
    setApiTokenState(savedToken);

    const restoreAnalysis = (budgetId: string) => {
      const cachedAnalysis = cacheGet<PayeeAnalysis[]>(`analysis_${budgetId}`);
      if (cachedAnalysis) setPayeeAnalysis(cachedAnalysis);
    };

    const cachedBudgets = cacheGet<YNABBudget[]>("budgets");

    if (cachedBudgets) {
      setBudgets(cachedBudgets);
      setIsAuthenticated(true);
      const savedBudgetId = loadSelectedBudget();
      if (savedBudgetId) {
        setSelectedBudgetIdState(savedBudgetId);
        restoreAnalysis(savedBudgetId);
      }
    } else {
      // Budgets cache expired — auto-fetch in the background
      setIsLoading(true);
      ynabService
        .getBudgets()
        .then((budgetsList) => {
          setBudgets(budgetsList);
          setIsAuthenticated(true);
          cacheSet("budgets", budgetsList, BUDGETS_TTL);
          const savedBudgetId = loadSelectedBudget();
          if (savedBudgetId) {
            setSelectedBudgetIdState(savedBudgetId);
            restoreAnalysis(savedBudgetId);
          }
        })
        .catch(() => {
          // Token is stale or revoked — show login form
          clearApiToken();
          clearSelectedBudget();
          setApiTokenState("");
          ynabService.setApiToken("");
        })
        .finally(() => setIsLoading(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

    if (getRememberToken()) {
      saveApiToken(cleanToken);
    }
  };

  const setSelectedBudgetId = (budgetId: string) => {
    setSelectedBudgetIdState(budgetId);
    saveSelectedBudget(budgetId);
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
      cacheSet("budgets", budgetsList, BUDGETS_TTL);
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
      cacheSet(`analysis_${selectedBudgetId}`, analysis, ANALYSIS_TTL);
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

  const refreshData = async () => {
    if (!selectedBudgetId) return;
    cacheClear(`analysis_${selectedBudgetId}`);
    ynabService.clearCache(selectedBudgetId);
    await analyzePayees();
  };

  const reset = () => {
    setIsAuthenticated(false);
    setApiTokenState("");
    setSelectedBudgetIdState("");
    setBudgets([]);
    setPayeeAnalysis([]);
    ynabService.setApiToken("");
    ynabService.clearCache();
    clearAll();
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
        refreshData,
        reset,
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
