'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { normalizeReceiptStatus } from '@/lib/receiptStatus';
import { Expense, Category, Receipt } from '@/types';
import { Plus, Trash2, Download, Pencil, Paperclip, Eye } from 'lucide-react';

type ModalMode = 'create' | 'edit';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('USD');
  const [receiptId, setReceiptId] = useState('');
  const [linkedReceipt, setLinkedReceipt] = useState<Receipt | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expRes, catRes, receiptRes] = await Promise.all([
        api.get('/expense'),
        api.get('/category'),
        api.get('/receipt'),
      ]);
      setExpenses(expRes.data);
      setCategories(catRes.data);
      setReceipts(receiptRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setCategoryId('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setCurrency('USD');
    setReceiptId('');
    setLinkedReceipt(null);
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setIsModalOpen(true);
  };

  const openEditModal = async (expense: Expense) => {
    setModalMode('edit');
    setEditingId(expense.id);
    setAmount(String(expense.amount));
    setCategoryId(expense.categoryId);
    setDescription(expense.description ?? '');
    setDate(new Date(expense.date).toISOString().split('T')[0]);
    setCurrency(expense.currency || 'USD');
    setReceiptId(expense.receiptId ?? '');
    setLinkedReceipt(null);

    if (expense.receiptId) {
      try {
        const res = await api.get<Receipt>(`/receipt/${expense.receiptId}`);
        setLinkedReceipt(res.data);
      } catch {
        setLinkedReceipt(null);
      }
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/expense/${id}`);
      setExpenses(expenses.filter((e) => e.id !== id));
    } catch (error) {
      console.error('Failed to delete expense', error);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) {
      console.error('Failed to export expenses', error);
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

  const clearReceipt = () => {
    setReceiptId('');
    setLinkedReceipt(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = {
        categoryId,
        amount: parseFloat(amount),
        currency,
        exchangeRate: 1.0,
        description,
        date: new Date(date).toISOString(),
        receiptId: receiptId || null,
      };

      if (modalMode === 'edit' && editingId) {
        await api.put(`/expense/${editingId}`, payload);
      } else {
        await api.post('/expense', payload);
      }

      closeModal();
      await fetchData();
    } catch (error) {
      console.error('Failed to save expense', error);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div className="text-muted-foreground p-4">Loading expenses...</div>;

  const linkableReceipts = receipts.filter((r) => {
    const status = normalizeReceiptStatus(r.status);
    return status === 'Confirmed' || status === 'ReadyForReview' || status === 'Uploaded';
  });
  const activeReceiptId = receiptId || linkedReceipt?.id;
  const activeReceipt =
    linkedReceipt || receipts.find((r) => r.id === receiptId) || null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
          <p className="text-muted-foreground text-sm">Manage and track your transactions.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="btn btn-outline gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button className="btn btn-primary gap-2" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Expense</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th className="w-[120px]">Date</th>
                <th>Description</th>
                <th className="w-[150px]">Category</th>
                <th className="text-right w-[100px]">Amount</th>
                <th className="text-center w-[60px]">Receipt</th>
                <th className="text-center w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length > 0 ? (
                expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="text-sm font-medium">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="text-sm">{expense.description}</td>
                    <td className="text-sm text-muted-foreground">{expense.categoryName}</td>
                    <td className="text-sm font-semibold text-right">
                      ${expense.amount.toFixed(2)}
                    </td>
                    <td className="text-center">
                      {expense.receiptId ? (
                        <button
                          className="btn btn-ghost btn-icon"
                          title="Preview receipt"
                          onClick={() => previewReceipt(expense.receiptId!)}
                        >
                          <Paperclip className="w-4 h-4 text-primary" />
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className="btn btn-ghost btn-icon"
                          onClick={() => openEditModal(expense)}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center text-sm text-muted-foreground h-24">
                    No expenses found. Add one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-lg font-semibold mb-4">
              {modalMode === 'edit' ? 'Edit Expense' : 'Add New Expense'}
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select Category
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Description</label>
                <input
                  type="text"
                  className="input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={100}
                />
              </div>

              {linkableReceipts.length > 0 && (
                <div>
                  <label className="label">Link receipt (optional)</label>
                  <select
                    className="input"
                    value={receiptId}
                    onChange={(e) => {
                      setReceiptId(e.target.value);
                      const match = linkableReceipts.find((r) => r.id === e.target.value);
                      setLinkedReceipt(match ?? null);
                    }}
                  >
                    <option value="">None</option>
                    {linkableReceipts.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.fileName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload and process receipts on the Receipts page first.
                  </p>
                </div>
              )}

              {activeReceipt && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Linked: {activeReceipt.fileName}</span>
                  {activeReceiptId && (
                    <button
                      type="button"
                      className="btn btn-outline gap-1"
                      onClick={() => previewReceipt(activeReceiptId)}
                    >
                      <Eye className="w-3 h-3" />
                      Preview
                    </button>
                  )}
                  <button type="button" className="btn btn-ghost" onClick={clearReceipt}>
                    Clear
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading
                    ? 'Saving...'
                    : modalMode === 'edit'
                      ? 'Update Expense'
                      : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
