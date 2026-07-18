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

export type ReceiptStatus =
  | 'Pending'
  | 'Uploaded'
  | 'Failed'
  | 'Processing'
  | 'ReadyForReview'
  | 'Confirmed'
  | 'OcrFailed'
  | number;

export interface Receipt {
  id: string;
  fileName: string;
  fileUrl: string;
  contentType: string;
  size: number;
  status: ReceiptStatus;
  createdAt: string;
  lineItemCount: number;
}

export interface ReceiptProcessingStatus {
  receiptId: string;
  status: ReceiptStatus;
  lineItemCount: number;
  ocrErrorMessage?: string | null;
}

export interface ReceiptLineItem {
  description?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  totalPrice?: number | null;
  suggestedCategoryId?: string | null;
}

export interface ReceiptExtraction {
  receiptId: string;
  status: ReceiptStatus;
  merchant?: string | null;
  transactionDate?: string | null;
  totalAmount?: number | null;
  currency?: string | null;
  taxAmount?: number | null;
  suggestedCategoryId?: string | null;
  ocrErrorMessage?: string | null;
  lineItems: ReceiptLineItem[];
}

export interface ConfirmReceiptExpenseItemDto {
  amount: number;
  categoryId: string;
  description?: string | null;
}

export type ReceiptImportMode = 'Combined' | 'Itemized';

export interface ConfirmReceiptExtractionDto {
  currency: string;
  date: string;
  importMode: ReceiptImportMode;
  expenses: ConfirmReceiptExpenseItemDto[];
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
