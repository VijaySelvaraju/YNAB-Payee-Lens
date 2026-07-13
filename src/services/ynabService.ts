// Types for YNAB API responses
export interface YNABBudget {
  id: string;
  name: string;
  last_modified_on: string;
  first_month: string;
  last_month: string;
  currency_format: {
    iso_code: string;
    example_format: string;
    decimal_digits: number;
    decimal_separator: string;
    symbol_first: boolean;
    group_separator: string;
    currency_symbol: string;
    display_symbol: boolean;
  };
}

export interface YNABPayee {
  id: string;
  name: string;
  transfer_account_id?: string;
  deleted: boolean;
}

export interface YNABSubTransaction {
  id: string;
  transaction_id: string;
  amount: number;
  memo?: string;
  payee_id?: string;
  payee_name?: string;
  category_id?: string;
  category_name?: string;
  transfer_account_id?: string;
  transfer_transaction_id?: string;
  deleted: boolean;
}

export interface YNABTransaction {
  id: string;
  date: string;
  amount: number;
  memo?: string;
  cleared: string;
  approved: boolean;
  flag_color?: string;
  account_id: string;
  payee_id?: string;
  category_id?: string;
  transfer_account_id?: string;
  transfer_transaction_id?: string;
  matched_transaction_id?: string;
  import_id?: string;
  import_payee_name?: string;
  import_payee_name_original?: string;
  debt_transaction_type?: string;
  deleted: boolean;
  account_name: string;
  payee_name?: string;
  category_name?: string;
  subtransactions?: YNABSubTransaction[];
}

export interface YNABCategory {
  id: string;
  category_group_id: string;
  name: string;
  hidden: boolean;
  original_category_group_id?: string;
  note?: string;
  budgeted: number;
  activity: number;
  balance: number;
  goal_type?: string;
  goal_day?: number;
  goal_month?: string;
  goal_creation_month?: string;
  goal_target?: number;
  goal_target_month?: string;
  goal_percentage_complete?: number;
  goal_months_to_budget?: number;
  goal_under_funded?: number;
  goal_overall_funded?: number;
  goal_overall_left?: number;
  deleted: boolean;
}

export interface YNABCategoryGroup {
  id: string;
  name: string;
  hidden: boolean;
  deleted: boolean;
  categories: YNABCategory[];
}

export interface PayeeAnalysis {
  id: string;
  name: string;
  transactionCount: number;
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    count: number;
    total: number;
    percentage: number;
  }[];
  firstTransaction?: string;
  lastTransaction?: string;
  totalAmount: number;
  averageAmount: number;
}

export interface UnusedPayeeAnalysis {
  id: string;
  name: string;
  lastUsed?: string;
  daysSinceLastUsed?: number;
  isUnused: boolean;
  transactionCount?: number;
}

// YNAB API Service
class YNABService {
  private apiToken: string = '';
  private baseUrl = 'https://api.youneedabudget.com/v1';
  private _payeesCache = new Map<string, YNABPayee[]>();
  private _transactionsCache = new Map<string, YNABTransaction[]>();

  public setApiToken(token: string): void {
    this.apiToken = token;
  }

  public getApiToken(): string {
    return this.apiToken;
  }

  public clearCache(budgetId?: string): void {
    if (budgetId) {
      this._payeesCache.delete(budgetId);
      this._transactionsCache.delete(budgetId);
    } else {
      this._payeesCache.clear();
      this._transactionsCache.clear();
    }
  }

  private async fetchFromAPI(endpoint: string): Promise<any> {
    if (!this.apiToken) {
      throw new Error('API token not set');
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.detail || `API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('YNAB API Error:', error);
      throw error;
    }
  }

  public async getBudgets(): Promise<YNABBudget[]> {
    const data = await this.fetchFromAPI('/budgets');
    return data.budgets;
  }

  public async getPayees(budgetId: string): Promise<YNABPayee[]> {
    if (this._payeesCache.has(budgetId)) return this._payeesCache.get(budgetId)!;
    const data = await this.fetchFromAPI(`/budgets/${budgetId}/payees`);
    this._payeesCache.set(budgetId, data.payees);
    return data.payees;
  }

  public async getTransactions(budgetId: string): Promise<YNABTransaction[]> {
    if (this._transactionsCache.has(budgetId)) return this._transactionsCache.get(budgetId)!;
    const data = await this.fetchFromAPI(`/budgets/${budgetId}/transactions?since_date=1970-01-01`);
    this._transactionsCache.set(budgetId, data.transactions);
    return data.transactions;
  }

  public async getCategories(budgetId: string): Promise<YNABCategoryGroup[]> {
    const data = await this.fetchFromAPI(`/budgets/${budgetId}/categories`);
    return data.category_groups;
  }

  // Find unused payees (no transactions in the last X days)
  public async findUnusedPayees(budgetId: string, dayThreshold: number = 90): Promise<UnusedPayeeAnalysis[]> {
    const [payees, transactions] = await Promise.all([
      this.getPayees(budgetId),
      this.getTransactions(budgetId),
    ]);

    // Map to store last transaction date and count for each payee
    const payeeLastUsed = new Map<string, string>();
    const payeeTransactionCount = new Map<string, number>();

    // Process transactions to find the last time each payee was used and count transactions
    transactions.forEach(transaction => {
      if (transaction.deleted) return;

      const transactionDate = transaction.date;
      const uniquePayees = new Set<string>();

      if (transaction.payee_id) {
        uniquePayees.add(transaction.payee_id);
      }

      if (transaction.subtransactions && transaction.subtransactions.length > 0) {
        transaction.subtransactions.forEach(sub => {
          if (!sub.deleted && sub.payee_id) {
            uniquePayees.add(sub.payee_id);
          }
        });
      }

      uniquePayees.forEach(payeeId => {
        // Update last used date
        if (!payeeLastUsed.has(payeeId) || transactionDate > payeeLastUsed.get(payeeId)!) {
          payeeLastUsed.set(payeeId, transactionDate);
        }

        // Increment transaction count
        payeeTransactionCount.set(payeeId, (payeeTransactionCount.get(payeeId) || 0) + 1);
      });
    });

    // Current date for calculating "days since last used"
    const currentDate = new Date();

    // Build the analysis for each payee
    const unusedPayeeAnalysis = payees
      .filter(payee => !payee.deleted) // Include all payees, not just unused ones
      .map(payee => {
        const lastUsed = payeeLastUsed.get(payee.id);
        const transactionCount = payeeTransactionCount.get(payee.id) || 0;
        let daysSinceLastUsed: number | undefined = undefined;
        
        if (lastUsed) {
          const lastUsedDate = new Date(lastUsed);
          const differenceInTime = currentDate.getTime() - lastUsedDate.getTime();
          daysSinceLastUsed = Math.floor(differenceInTime / (1000 * 3600 * 24)); // Convert to days
        }
        
        // Special handling for "All time" filter (dayThreshold = -1)
        let isUnused = false;
        if (dayThreshold === -1) {
          // For "All time", a payee is unused only if it has never been used
          isUnused = !lastUsed;
        } else {
          // Otherwise, a payee is unused if it hasn't been used for more than the threshold
          isUnused = !lastUsed || (daysSinceLastUsed !== undefined && daysSinceLastUsed > dayThreshold);
        }
        
        return {
          id: payee.id,
          name: payee.name,
          lastUsed,
          daysSinceLastUsed,
          isUnused,
          transactionCount
        };
      });

    // Sort based on the filter type
    if (dayThreshold === -1) {
      // For "All time" filter, put never-used payees first, then sort by name
      return unusedPayeeAnalysis
        .filter(p => !p.lastUsed) // Only include never-used payees
        .sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // For regular filters, sort by days since last used
      return unusedPayeeAnalysis.sort((a, b) => {
        // Never used payees come first
        if (!a.lastUsed && !b.lastUsed) return a.name.localeCompare(b.name);
        if (!a.lastUsed) return -1;
        if (!b.lastUsed) return 1;
        
        // Then sort by days since last used
        return (b.daysSinceLastUsed || 0) - (a.daysSinceLastUsed || 0);
      });
    }
  }

  public async analyzePayees(budgetId: string): Promise<PayeeAnalysis[]> {
    // Fetch all required data
    const [payees, transactions, categoryGroups] = await Promise.all([
      this.getPayees(budgetId),
      this.getTransactions(budgetId),
      this.getCategories(budgetId)
    ]);

    // Create a flat map of all categories for easy lookup
    const categoryMap = new Map<string, string>();
    categoryGroups.forEach(group => {
      group.categories.forEach(category => {
        categoryMap.set(category.id, category.name);
      });
    });

    // Create a map to store payee analysis data
    const payeeAnalysisMap = new Map<string, PayeeAnalysis>();

    // Initialize payee analysis objects
    payees.forEach(payee => {
      if (!payee.deleted) {
        payeeAnalysisMap.set(payee.id, {
          id: payee.id,
          name: payee.name,
          transactionCount: 0,
          categoryBreakdown: [],
          totalAmount: 0,
          averageAmount: 0
        });
      }
    });

    // Process transactions to build analysis
    transactions.forEach(transaction => {
      if (transaction.deleted) return;

      const transactionDate = new Date(transaction.date);
      const incrementedPayees = new Set<string>();

      // Decompose transaction (including split subtransactions) into parts to analyze
      const parts: { payeeId: string; categoryId?: string; amount: number }[] = [];

      if (transaction.subtransactions && transaction.subtransactions.length > 0) {
        transaction.subtransactions.forEach(sub => {
          if (sub.deleted) return;
          const payeeId = sub.payee_id || transaction.payee_id;
          if (payeeId) {
            parts.push({
              payeeId,
              categoryId: sub.category_id,
              amount: sub.amount
            });
          }
        });
      } else {
        if (transaction.payee_id) {
          parts.push({
            payeeId: transaction.payee_id,
            categoryId: transaction.category_id,
            amount: transaction.amount
          });
        }
      }

      parts.forEach(part => {
        const payeeAnalysis = payeeAnalysisMap.get(part.payeeId);
        if (!payeeAnalysis) return;

        // Increment transaction count once per unique payee per parent transaction
        if (!incrementedPayees.has(part.payeeId)) {
          payeeAnalysis.transactionCount += 1;
          incrementedPayees.add(part.payeeId);

          // Update first and last transaction dates
          if (!payeeAnalysis.firstTransaction || transactionDate < new Date(payeeAnalysis.firstTransaction)) {
            payeeAnalysis.firstTransaction = transaction.date;
          }
          if (!payeeAnalysis.lastTransaction || transactionDate > new Date(payeeAnalysis.lastTransaction)) {
            payeeAnalysis.lastTransaction = transaction.date;
          }
        }

        // Update total amount (convert from milliunits)
        const amount = Math.abs(part.amount / 1000);
        payeeAnalysis.totalAmount += amount;

        // Update category breakdown
        if (part.categoryId) {
          const categoryId = part.categoryId;
          const categoryName = categoryMap.get(categoryId) || 'Unknown Category';

          let categoryBreakdown = payeeAnalysis.categoryBreakdown.find(cb => cb.categoryId === categoryId);
          if (!categoryBreakdown) {
            categoryBreakdown = {
              categoryId,
              categoryName,
              count: 0,
              total: 0,
              percentage: 0
            };
            payeeAnalysis.categoryBreakdown.push(categoryBreakdown);
          }

          categoryBreakdown.count += 1;
          categoryBreakdown.total += amount;
        }
      });
    });

    // Calculate averages and percentages
    for (const payeeAnalysis of payeeAnalysisMap.values()) {
      if (payeeAnalysis.transactionCount > 0) {
        payeeAnalysis.averageAmount = payeeAnalysis.totalAmount / payeeAnalysis.transactionCount;
      }

      // Calculate category percentages
      payeeAnalysis.categoryBreakdown.forEach(category => {
        category.percentage = (category.count / payeeAnalysis.transactionCount) * 100;
      });

      // Sort category breakdown by count
      payeeAnalysis.categoryBreakdown.sort((a, b) => b.count - a.count);
    }

    // Convert to array and sort by transaction count (most frequent first)
    const result = Array.from(payeeAnalysisMap.values())
      .filter(payee => payee.transactionCount > 0)
      .sort((a, b) => b.transactionCount - a.transactionCount);

    return result;
  }

  public async detectRecurringPayees(budgetId: string): Promise<RecurringPayee[]> {
    const [payees, transactions, categoryGroups] = await Promise.all([
      this.getPayees(budgetId),
      this.getTransactions(budgetId),
      this.getCategories(budgetId),
    ]);

    // Group transaction dates+amounts+accounts+categories by payee
    const payeeTxns = new Map<string, { date: string; amount: number; accountName: string; categoryName?: string }[]>();
    
    // Create a flat map of all categories for easy lookup
    const categoryMap = new Map<string, string>();
    categoryGroups.forEach(group => {
      group.categories.forEach(category => {
        categoryMap.set(category.id, category.name);
      });
    });

    transactions.forEach((t) => {
      if (t.deleted) return;

      // Group parts of this transaction by payeeId to avoid 0-day intervals on split transactions
      const payeeAmounts = new Map<string, number>();
      const payeeCategories = new Map<string, string>();

      if (t.subtransactions && t.subtransactions.length > 0) {
        t.subtransactions.forEach(sub => {
          if (sub.deleted) return;
          const payeeId = sub.payee_id || t.payee_id;
          if (payeeId) {
            const amount = Math.abs(sub.amount / 1000);
            payeeAmounts.set(payeeId, (payeeAmounts.get(payeeId) || 0) + amount);
            if (sub.category_id) {
              const catName = categoryMap.get(sub.category_id);
              if (catName) {
                payeeCategories.set(payeeId, catName);
              }
            }
          }
        });
      } else {
        if (t.payee_id) {
          const amount = Math.abs(t.amount / 1000);
          payeeAmounts.set(t.payee_id, amount);
          if (t.category_name) {
            payeeCategories.set(t.payee_id, t.category_name);
          }
        }
      }

      // Add combined entries per payee to payeeTxns
      payeeAmounts.forEach((amount, payeeId) => {
        const entry = payeeTxns.get(payeeId) ?? [];
        entry.push({
          date: t.date,
          amount,
          accountName: t.account_name,
          categoryName: payeeCategories.get(payeeId)
        });
        payeeTxns.set(payeeId, entry);
      });
    });

    const PERIODS: { name: RecurringFrequency; days: number }[] = [
      { name: "weekly", days: 7 },
      { name: "fortnightly", days: 14 },
      { name: "monthly", days: 30 },
      { name: "quarterly", days: 91 },
      { name: "annual", days: 365 },
    ];

    const results: RecurringPayee[] = [];

    for (const payee of payees) {
      if (payee.deleted) continue;
      const txns = payeeTxns.get(payee.id);
      if (!txns || txns.length < 3) continue;

      txns.sort((a, b) => a.date.localeCompare(b.date));

      // Calculate day intervals between consecutive transactions
      const intervals: number[] = [];
      for (let i = 1; i < txns.length; i++) {
        const diff =
          (new Date(txns[i].date).getTime() - new Date(txns[i - 1].date).getTime()) /
          86_400_000;
        intervals.push(diff);
      }

      const sorted = [...intervals].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];

      let bestPeriod: (typeof PERIODS)[0] | null = null;
      let bestConfidence = 0;

      for (const period of PERIODS) {
        const tolerance = period.days * 0.3;
        if (Math.abs(median - period.days) > tolerance) continue;
        const within = intervals.filter(
          (d) => Math.abs(d - period.days) <= tolerance
        ).length;
        const confidence = Math.round((within / intervals.length) * 100);
        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestPeriod = period;
        }
      }

      if (!bestPeriod || bestConfidence < 60) continue;

      const avgAmount = txns.reduce((s, t) => s + t.amount, 0) / txns.length;
      const lastTxn = txns[txns.length - 1];
      const nextDate = new Date(
        new Date(lastTxn.date).getTime() + bestPeriod.days * 86_400_000
      );
      const accounts = [...new Set(txns.map((t) => t.accountName).filter(Boolean))];

      // Most common category across transactions
      const catCounts = new Map<string, number>();
      for (const t of txns) {
        if (t.categoryName) catCounts.set(t.categoryName, (catCounts.get(t.categoryName) ?? 0) + 1);
      }
      const topCategory = catCounts.size > 0
        ? [...catCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
        : undefined;

      results.push({
        id: payee.id,
        name: payee.name,
        frequency: bestPeriod.name,
        confidence: bestConfidence,
        avgAmount,
        lastCharged: lastTxn.date,
        nextExpected: nextDate.toISOString().split("T")[0],
        transactionCount: txns.length,
        accounts,
        topCategory,
      });
    }

    return results.sort((a, b) => b.avgAmount - a.avgAmount);
  }
}

export type RecurringFrequency = "weekly" | "fortnightly" | "monthly" | "quarterly" | "annual";

export interface RecurringPayee {
  id: string;
  name: string;
  frequency: RecurringFrequency;
  confidence: number;
  avgAmount: number;
  lastCharged?: string;
  nextExpected?: string;
  transactionCount: number;
  accounts: string[];
  topCategory?: string;
}

export const ynabService = new YNABService();
export default ynabService;
