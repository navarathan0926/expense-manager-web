export interface User {
  id: string;
  email: string;
  userName: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Expense {
  id: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  description: string;
  date: string;
  categoryName: string;
}

export interface ExpenseCreateDTO {
  categoryId: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  description: string;
  date: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  isPredefined: boolean;
  userId: string | null;
}

export interface ReportSummary {
  year: number;
  month: number;
  totalAmount: number;
  transactionCount: number;
  averageTransactionAmount: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
}
