import { ReceiptExtraction, ReceiptImportMode, ReceiptLineItem } from '@/types';

export type ReviewRow = {
  selected: boolean;
  description: string;
  amount: string;
  categoryId: string;
};

const MANY_LINE_ITEM_THRESHOLD = 10;
const TOTAL_MISMATCH_TOLERANCE = 0.05;

export function sumLineItemAmounts(lineItems: ReceiptLineItem[]): number {
  return lineItems.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0);
}

export function suggestImportMode(extraction: ReceiptExtraction): ReceiptImportMode {
  const lineItems = extraction.lineItems ?? [];

  if (lineItems.length <= 1) {
    return 'Combined';
  }

  if (lineItems.length > MANY_LINE_ITEM_THRESHOLD) {
    return 'Combined';
  }

  const categories = new Set(
    lineItems.map((item) => item.suggestedCategoryId).filter((id): id is string => Boolean(id))
  );

  if (categories.size > 1) {
    return 'Itemized';
  }

  return 'Itemized';
}

export function buildItemizedRows(lineItems: ReceiptLineItem[]): ReviewRow[] {
  if (lineItems.length === 0) {
    return [];
  }

  return lineItems.map((item) => ({
    selected: true,
    description: item.description ?? '',
    amount: item.totalPrice != null ? String(item.totalPrice) : '',
    categoryId: item.suggestedCategoryId ?? '',
  }));
}

export function buildCombinedRow(extraction: ReceiptExtraction): ReviewRow {
  const lineItems = extraction.lineItems ?? [];
  const lineSum = sumLineItemAmounts(lineItems);
  const amount =
    extraction.totalAmount != null
      ? extraction.totalAmount
      : lineSum > 0
        ? lineSum
        : null;

  return {
    selected: true,
    description: extraction.merchant?.trim() || 'Receipt total',
    amount: amount != null ? String(amount) : '',
    categoryId: extraction.suggestedCategoryId ?? lineItems[0]?.suggestedCategoryId ?? '',
  };
}

export function buildRowsForMode(
  extraction: ReceiptExtraction,
  mode: ReceiptImportMode
): ReviewRow[] {
  const lineItems = extraction.lineItems ?? [];

  if (mode === 'Combined') {
    return [buildCombinedRow(extraction)];
  }

  if (lineItems.length === 0) {
    return [buildCombinedRow(extraction)];
  }

  return buildItemizedRows(lineItems);
}

export function getSelectedRows(rows: ReviewRow[]): ReviewRow[] {
  return rows.filter((row) => row.selected);
}

export function sumSelectedAmounts(rows: ReviewRow[]): number {
  return getSelectedRows(rows).reduce((sum, row) => {
    const value = parseFloat(row.amount);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);
}

export function getTotalMismatchWarning(
  extraction: ReceiptExtraction | null,
  rows: ReviewRow[]
): string | null {
  if (!extraction?.totalAmount) {
    return null;
  }

  const selectedSum = sumSelectedAmounts(rows);
  if (selectedSum <= 0) {
    return null;
  }

  const difference = Math.abs(selectedSum - extraction.totalAmount);
  if (difference <= TOTAL_MISMATCH_TOLERANCE) {
    return null;
  }

  const currency = extraction.currency ?? '';
  return `Selected total (${currency} ${selectedSum.toFixed(2)}) differs from receipt total (${currency} ${extraction.totalAmount.toFixed(2)}). Adjust amounts or continue if tax, tips, or OCR rounding explain the gap.`;
}

export function canSubmitReview(rows: ReviewRow[]): boolean {
  const selected = getSelectedRows(rows);
  if (selected.length === 0) {
    return false;
  }

  return selected.every(
    (row) =>
      row.categoryId &&
      row.amount.trim() !== '' &&
      parseFloat(row.amount) > 0 &&
      Number.isFinite(parseFloat(row.amount))
  );
}

export function importModeLabel(mode: ReceiptImportMode): string {
  switch (mode) {
    case 'Combined':
      return 'One expense';
    case 'Itemized':
      return 'Separate expenses';
    default:
      return mode;
  }
}

export function importModeHelp(mode: ReceiptImportMode): string {
  switch (mode) {
    case 'Combined':
      return 'Save the bill as a single expense. Line items stay on the receipt for reference.';
    case 'Itemized':
      return 'Save selected lines as separate expenses. Uncheck lines you do not want to import.';
    default:
      return '';
  }
}
