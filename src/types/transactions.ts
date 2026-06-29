export interface Location {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export type TransactionRequestParams = {
  amount: number;
  type: 'income' | 'expense';
  is_recurring: boolean;
  category_id: number;
  description: string;
  frequency?: 'monthly' | 'daily' | 'weekly' | 'yearly';
  created_by_id: number;
  start_date?: string;
  end_date?: string;
  date: string;
  location?: string;
};

export interface Transaction {
  id: number;
  created_by_id?: number;
  is_recurring?: boolean;
  category_id: number;
  frequency?: string;
  amount: number;
  subtype?: string;
  type: 'income' | 'expense';
  description: string;
  date: string;
  start_date?: string;
  end_date?: string;
  location_id?: number;
  location?: Location;
  created_at: string;
  updated_at: string;
}

export type TransactionBaseResponse = {
  count: number;
  transactions: Transaction[];
};

export interface Category {
  id: number;
  name: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export type CategoryComparisonDataPoint = {
  month: string;
  expense: number;
  income: number;
};

export type CategoryComparisonHistory = {
  category_id: number;
  category_name: string;
  color: string;
  data: CategoryComparisonDataPoint[];
};
