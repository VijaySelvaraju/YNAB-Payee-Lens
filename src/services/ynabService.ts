
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

// YNAB API Service
class YNABService {
  private apiToken: string = '';
  private baseUrl = 'https://api.youneedabudget.com/v1';

  public setApiToken(token: string): void {
    this.apiToken = token;
  }

  public getApiToken(): string {
    return this.apiToken;
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
    const data = await this.fetchFromAPI(`/budgets/${budgetId}/payees`);
    return data.payees;
  }

  public async getTransactions(budgetId: string): Promise<YNABTransaction[]> {
    const data = await this.fetchFromAPI(`/budgets/${budgetId}/transactions`);
    return data.transactions;
  }

  public async getCategories(budgetId: string): Promise<YNABCategoryGroup[]> {
    const data = await this.fetchFromAPI(`/budgets/${budgetId}/categories`);
    return data.category_groups;
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
      if (transaction.deleted || !transaction.payee_id) return;

      const payeeAnalysis = payeeAnalysisMap.get(transaction.payee_id);
      if (!payeeAnalysis) return;

      // Increment transaction count
      payeeAnalysis.transactionCount += 1;

      // Update first and last transaction dates
      const transactionDate = new Date(transaction.date);
      if (!payeeAnalysis.firstTransaction || transactionDate < new Date(payeeAnalysis.firstTransaction)) {
        payeeAnalysis.firstTransaction = transaction.date;
      }
      if (!payeeAnalysis.lastTransaction || transactionDate > new Date(payeeAnalysis.lastTransaction)) {
        payeeAnalysis.lastTransaction = transaction.date;
      }

      // Update total amount (convert from milliunits)
      const amount = Math.abs(transaction.amount / 1000);
      payeeAnalysis.totalAmount += amount;

      // Update category breakdown
      if (transaction.category_id) {
        const categoryId = transaction.category_id;
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
}

export const ynabService = new YNABService();
export default ynabService;
