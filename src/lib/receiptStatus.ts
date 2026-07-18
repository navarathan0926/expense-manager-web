import { ReceiptStatus } from '@/types';

const STATUS_BY_NUMBER: Record<number, ReceiptStatus> = {
  0: 'Pending',
  1: 'Uploaded',
  2: 'Failed',
  3: 'Processing',
  4: 'ReadyForReview',
  5: 'Confirmed',
  6: 'OcrFailed',
};

export function normalizeReceiptStatus(status: ReceiptStatus | number): ReceiptStatus {
  if (typeof status === 'number') {
    return STATUS_BY_NUMBER[status] ?? 'Pending';
  }
  return status;
}

export function receiptStatusLabel(status: ReceiptStatus | number): string {
  switch (normalizeReceiptStatus(status)) {
    case 'Processing':
      return 'Processing';
    case 'ReadyForReview':
      return 'Drafts ready';
    case 'Confirmed':
      return 'Approved';
    case 'OcrFailed':
      return 'OCR failed';
    case 'Uploaded':
      return 'Queued';
    case 'Failed':
      return 'Upload failed';
    case 'Pending':
      return 'Pending';
    default:
      return String(status);
  }
}

export function receiptStatusClass(status: ReceiptStatus | number): string {
  switch (normalizeReceiptStatus(status)) {
    case 'Processing':
    case 'Uploaded':
      return 'text-amber-600';
    case 'ReadyForReview':
      return 'text-primary';
    case 'Confirmed':
      return 'text-green-600';
    case 'OcrFailed':
    case 'Failed':
      return 'text-destructive';
    default:
      return 'text-muted-foreground';
  }
}

export function isReadyForReview(status: ReceiptStatus | number): boolean {
  return normalizeReceiptStatus(status) === 'ReadyForReview';
}

export function isOcrInProgress(status: ReceiptStatus | number): boolean {
  const normalized = normalizeReceiptStatus(status);
  return normalized === 'Uploaded' || normalized === 'Processing';
}

export function isOcrFailed(status: ReceiptStatus | number): boolean {
  return normalizeReceiptStatus(status) === 'OcrFailed';
}
