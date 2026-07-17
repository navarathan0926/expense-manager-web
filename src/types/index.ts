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

export type ReceiptStatus = 'Pending' | 'Uploaded' | 'Failed';

export interface Receipt {
  id: string;
  fileName: string;
  fileUrl: string;
  contentType: string;
  size: number;
  status: ReceiptStatus;
  createdAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  description: string;
  date: string;
  categoryId: string;
  categoryName: string;
  receiptId?: string | null;
}

export interface ExpenseCreateDTO {
  categoryId: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  description: string;
  date: string;
  receiptId?: string | null;
}

export interface ExpenseUpdateDTO {
  categoryId: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  description: string;
  date: string;
  receiptId?: string | null;
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
