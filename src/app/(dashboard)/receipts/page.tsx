'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/axios';
import {
  buildRowsForMode,
  canSubmitReview,
  getSelectedRows,
  getTotalMismatchWarning,
  importModeHelp,
  importModeLabel,
  ReviewRow,
  suggestImportMode,
  sumSelectedAmounts,
} from '@/lib/receiptImport';
import {
  isOcrFailed,
  isOcrInProgress,
  isReadyForReview,
  receiptStatusClass,
  receiptStatusLabel,
} from '@/lib/receiptStatus';
import {
  Category,
  ConfirmReceiptExtractionDto,
  Receipt,
  ReceiptExtraction,
  ReceiptImportMode,
  ReceiptProcessingStatus,
  ReceiptStatus,
} from '@/types';
import {
  Upload,
  Eye,
  Trash2,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { isAxiosError } from 'axios';

const IMPORT_MODES: ReceiptImportMode[] = ['Combined', 'Itemized'];

function getConfirmErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined;
    if (data?.errors) {
      const messages = Object.values(data.errors).flat();
      if (messages.length > 0) {
        return messages.join(' ');
      }
    }
    if (data?.message) {
      return data.message;
    }
  }

  return 'Failed to save expenses. Check your entries and try again.';
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewReceiptId, setReviewReceiptId] = useState<string | null>(null);
  const [reviewExtraction, setReviewExtraction] = useState<ReceiptExtraction | null>(null);
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>([]);
  const [importMode, setImportMode] = useState<ReceiptImportMode>('Itemized');
  const [reviewCurrency, setReviewCurrency] = useState('USD');
  const [reviewDate, setReviewDate] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmDespiteMismatch, setConfirmDespiteMismatch] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchData();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [receiptRes, catRes] = await Promise.all([
        api.get<Receipt[]>('/receipt'),
        api.get<Category[]>('/category'),
      ]);
      setReceipts(receiptRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error('Failed to fetch receipts', error);
    } finally {
      setLoading(false);
    }
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const fetchExtraction = async (id: string) => {
    const res = await api.get<ReceiptExtraction>(`/receipt/${id}/extraction`);
    return res.data;
  };

  const fetchProcessingStatus = async (id: string) => {
    const res = await api.get<ReceiptProcessingStatus>(`/receipt/${id}/status`);
    return res.data;
  };

  const startPolling = (id: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const status = await fetchProcessingStatus(id);
        setReceipts((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, status: status.status, lineItemCount: status.lineItemCount }
              : r
          )
        );
        if (isReadyForReview(status.status)) {
          stopPolling();
          openReview(id);
        } else if (isOcrFailed(status.status)) {
          stopPolling();
        }
      } catch (error) {
        console.error('Failed to poll OCR status', error);
      }
    }, 3000);
  };

  const applyImportMode = (extraction: ReceiptExtraction, mode: ReceiptImportMode) => {
    setImportMode(mode);
    setReviewRows(buildRowsForMode(extraction, mode));
    setConfirmDespiteMismatch(false);
  };

  const openReview = async (id: string, extraction?: ReceiptExtraction) => {
    setReviewReceiptId(id);
    setIsReviewOpen(true);
    setReviewLoading(true);
    setConfirmError(null);
    setConfirmDespiteMismatch(false);
    try {
      const data = extraction ?? (await fetchExtraction(id));
      setReviewExtraction(data);
      setReviewCurrency(data.currency ?? 'USD');
      setReviewDate(
        data.transactionDate
          ? new Date(data.transactionDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      const suggestedMode = suggestImportMode(data);
      applyImportMode(data, suggestedMode);
    } catch (error) {
      console.error('Failed to load extraction', error);
    } finally {
      setReviewLoading(false);
    }
  };

  const closeReview = () => {
    setIsReviewOpen(false);
    setReviewReceiptId(null);
    setReviewExtraction(null);
    setReviewRows([]);
    setConfirmError(null);
    setConfirmDespiteMismatch(false);
  };

  const handleImportModeChange = (mode: ReceiptImportMode) => {
    if (!reviewExtraction) return;
    applyImportMode(reviewExtraction, mode);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<Receipt>('/receipt', formData);
      setReceipts((prev) => [res.data, ...prev]);
      startPolling(res.data.id);
    } catch (error) {
      console.error('Failed to upload receipt', error);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/receipt/${id}`);
      setReceipts((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Failed to delete receipt', error);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await api.post(`/receipt/${id}/retry-ocr`);
      setReceipts((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'Uploaded' as ReceiptStatus } : r))
      );
      startPolling(id);
    } catch (error) {
      console.error('Failed to retry OCR', error);
    }
  };

  const previewReceipt = async (id: string) => {
    try {
      const res = await api.get(`/receipt/${id}/file`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to preview receipt', error);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewReceiptId || !reviewExtraction) return;

    const selected = getSelectedRows(reviewRows);
    if (selected.length === 0) return;

    const mismatchWarning = getTotalMismatchWarning(reviewExtraction, reviewRows);
    if (mismatchWarning && !confirmDespiteMismatch) {
      setConfirmError(mismatchWarning);
      return;
    }

    setReviewSubmitting(true);
    setConfirmError(null);
    try {
      const payload: ConfirmReceiptExtractionDto = {
        currency: reviewCurrency.toUpperCase(),
        date: new Date(reviewDate).toISOString(),
        importMode,
        expenses: selected.map((row) => ({
          amount: parseFloat(row.amount),
          categoryId: row.categoryId,
          description: row.description,
        })),
      };

      await api.post(`/receipt/${reviewReceiptId}/confirm`, payload);
      closeReview();
      await fetchData();
    } catch (error) {
      console.error('Failed to confirm extraction', error);
      setConfirmError(getConfirmErrorMessage(error));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const updateRow = (index: number, patch: Partial<ReviewRow>) => {
    setReviewRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
    setConfirmDespiteMismatch(false);
  };

  const totalMismatchWarning = getTotalMismatchWarning(reviewExtraction, reviewRows);
  const selectedCount = getSelectedRows(reviewRows).length;
  const selectedTotal = sumSelectedAmounts(reviewRows);
  const showRowSelection = importMode === 'Itemized';
  const submitDisabled =
    reviewSubmitting ||
    !reviewExtraction ||
    !isReadyForReview(reviewExtraction.status) ||
    !canSubmitReview(reviewRows) ||
    (Boolean(totalMismatchWarning) && !confirmDespiteMismatch);

  if (loading) {
    return <div className="text-muted-foreground p-4">Loading receipts...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Receipts</h2>
          <p className="text-muted-foreground text-sm">
            Upload a bill, review OCR draft items, then approve to save as expenses.
          </p>
        </div>
        <label className="btn btn-primary gap-2 cursor-pointer">
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload Receipt'}
          <input
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th className="w-[120px]">Uploaded</th>
                <th className="w-[120px]">Status</th>
                <th className="w-[100px]">Draft items</th>
                <th className="text-center w-[200px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts.length > 0 ? (
                receipts.map((receipt) => (
                    <tr key={receipt.id}>
                      <td className="text-sm font-medium">{receipt.fileName}</td>
                      <td className="text-sm text-muted-foreground">
                        {new Date(receipt.createdAt).toLocaleDateString()}
                      </td>
                      <td className={`text-sm font-medium ${receiptStatusClass(receipt.status)}`}>
                        {receiptStatusLabel(receipt.status)}
                      </td>
                      <td className="text-sm text-muted-foreground">
                        {isReadyForReview(receipt.status)
                          ? `${receipt.lineItemCount} item${receipt.lineItemCount === 1 ? '' : 's'}`
                          : isOcrInProgress(receipt.status)
                            ? 'Extracting…'
                            : '—'}
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {isReadyForReview(receipt.status) && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm gap-1"
                              onClick={() => openReview(receipt.id)}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Approve drafts
                            </button>
                          )}
                          <button
                            className="btn btn-ghost btn-icon"
                            title="Preview"
                            onClick={() => previewReceipt(receipt.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isOcrFailed(receipt.status) && (
                            <button
                              className="btn btn-ghost btn-icon"
                              title="Retry OCR"
                              onClick={() => handleRetry(receipt.id)}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            className="btn btn-ghost btn-icon text-destructive hover:bg-destructive/10"
                            title="Delete"
                            onClick={() => handleDelete(receipt.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center text-sm text-muted-foreground h-24">
                    <div className="flex flex-col items-center gap-2 py-4">
                      <FileText className="w-8 h-8 opacity-40" />
                      No receipts yet. Upload one to get started.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isReviewOpen && (
        <div className="modal-overlay">
          <div className="modal-content max-w-3xl w-full">
            <h3 className="text-lg font-semibold mb-1">Approve draft expenses</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose how to import this bill, edit the draft rows, then save them as expenses.
            </p>
            {reviewLoading ? (
              <p className="text-muted-foreground text-sm">Loading draft items...</p>
            ) : (
              <form onSubmit={handleConfirm} className="flex flex-col gap-4">
                {reviewExtraction && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <p>
                      <span className="text-muted-foreground">Merchant: </span>
                      {reviewExtraction.merchant ?? '—'}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Receipt total: </span>
                      {reviewExtraction.totalAmount != null
                        ? `${reviewExtraction.currency ?? reviewCurrency} ${reviewExtraction.totalAmount.toFixed(2)}`
                        : '—'}
                    </p>
                    {reviewExtraction.taxAmount != null && (
                      <p>
                        <span className="text-muted-foreground">Tax: </span>
                        {reviewExtraction.taxAmount.toFixed(2)}
                      </p>
                    )}
                    <p>
                      <span className="text-muted-foreground">Selected total: </span>
                      {`${reviewCurrency} ${selectedTotal.toFixed(2)} (${selectedCount} expense${selectedCount === 1 ? '' : 's'})`}
                    </p>
                  </div>
                )}

                <fieldset className="flex flex-col gap-2">
                  <legend className="label mb-1">Import as</legend>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {IMPORT_MODES.map((mode) => (
                      <label
                        key={mode}
                        className={`flex items-start gap-2 rounded-md border px-3 py-2 cursor-pointer ${
                          importMode === mode ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <input
                          type="radio"
                          name="importMode"
                          value={mode}
                          checked={importMode === mode}
                          onChange={() => handleImportModeChange(mode)}
                          className="mt-1"
                        />
                        <span>
                          <span className="block text-sm font-medium">{importModeLabel(mode)}</span>
                          <span className="block text-xs text-muted-foreground">
                            {importModeHelp(mode)}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Currency</label>
                    <input
                      type="text"
                      className="input"
                      value={reviewCurrency}
                      onChange={(e) => setReviewCurrency(e.target.value.toUpperCase())}
                      maxLength={3}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Expense date</label>
                    <input
                      type="date"
                      className="input"
                      value={reviewDate}
                      onChange={(e) => setReviewDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {reviewRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No draft rows available. Switch to one expense mode or retry OCR.
                  </p>
                ) : (
                  <div className="border border-border rounded-md overflow-hidden">
                    <table>
                      <thead>
                        <tr>
                          {showRowSelection && <th className="w-10 text-center">Import</th>}
                          <th>Description</th>
                          <th className="w-[120px]">Amount</th>
                          <th className="w-[180px]">Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewRows.map((row, index) => (
                          <tr key={index}>
                            {showRowSelection && (
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  checked={row.selected}
                                  onChange={(e) =>
                                    updateRow(index, { selected: e.target.checked })
                                  }
                                />
                              </td>
                            )}
                            <td>
                              <input
                                type="text"
                                className="input"
                                value={row.description}
                                onChange={(e) =>
                                  updateRow(index, { description: e.target.value })
                                }
                                disabled={importMode === 'Itemized' && !row.selected}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                className="input"
                                value={row.amount}
                                onChange={(e) => updateRow(index, { amount: e.target.value })}
                                required={row.selected || importMode === 'Combined'}
                                disabled={importMode === 'Itemized' && !row.selected}
                              />
                            </td>
                            <td>
                              <select
                                className="input"
                                value={row.categoryId}
                                onChange={(e) => updateRow(index, { categoryId: e.target.value })}
                                required={row.selected || importMode === 'Combined'}
                                disabled={importMode === 'Itemized' && !row.selected}
                              >
                                <option value="" disabled>
                                  Category
                                </option>
                                {categories.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {totalMismatchWarning && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                    <div className="flex flex-col gap-2">
                      <p>{totalMismatchWarning}</p>
                      {!confirmDespiteMismatch && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm self-start"
                          onClick={() => {
                            setConfirmDespiteMismatch(true);
                            setConfirmError(null);
                          }}
                        >
                          Continue anyway
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {confirmError && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {confirmError}
                  </div>
                )}

                {reviewReceiptId && (
                  <button
                    type="button"
                    className="btn btn-outline gap-1 self-start"
                    onClick={() => previewReceipt(reviewReceiptId)}
                  >
                    <Eye className="w-3 h-3" />
                    Preview receipt
                  </button>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <button type="button" className="btn btn-ghost" onClick={closeReview}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitDisabled}>
                    {reviewSubmitting ? 'Saving expenses...' : 'Approve & save as expenses'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
