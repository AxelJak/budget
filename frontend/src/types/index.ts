export interface Category {
  id: number;
  name: string;
  type: 'income' | 'fixed' | 'variable';
  budget_limit: number | null;
  color: string | null;
  created_at: string;
}

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  balance: number | null;
  category_id: number | null;
  account_name: string;
  import_hash: string;
  is_manually_categorized: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface PeriodSummary {
  start_date: string;
  end_date: string;
  period_name: string;
  total_income: number;
  total_expenses: number;
  total_fixed: number;
  total_variable: number;
  net: number;
  transaction_count: number;
  categories: CategorySummary[];
}

export interface CategorySummary {
  category_id: number;
  category_name: string;
  category_type: string;
  total: number;
  budget_limit: number | null;
  color: string;
}

export interface ImportResponse {
  imported: number;
  duplicates: number;
  errors: number;
  message: string;
}
