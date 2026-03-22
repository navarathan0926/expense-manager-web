'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Expense, Category } from '@/types';
import { Plus, Trash2, Download } from 'lucide-react';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('USD');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expRes, catRes] = await Promise.all([
        api.get('/expense'),
        api.get('/category')
      ]);
      setExpenses(expRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/expense/${id}`);
      setExpenses(expenses.filter(e => e.id !== id));
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post('/expense', {
        categoryId,
        amount: parseFloat(amount),
        currency,
        exchangeRate: 1.0,
        description,
        date: new Date(date).toISOString()
      });
      setIsModalOpen(false);
      fetchData(); // refresh list
    } catch (error) {
      console.error('Failed to create expense', error);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div className="text-muted-foreground p-4">Loading expenses...</div>;

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
          <button className="btn btn-primary gap-2" onClick={() => setIsModalOpen(true)}>
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
                <th className="text-center w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length > 0 ? expenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="text-sm font-medium">{new Date(expense.date).toLocaleDateString()}</td>
                  <td className="text-sm">{expense.description}</td>
                  <td className="text-sm text-muted-foreground">{expense.categoryName}</td>
                  <td className="text-sm font-semibold text-right">${expense.amount.toFixed(2)}</td>
                  <td className="text-center">
                    <button 
                      className="btn btn-ghost btn-icon text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(expense.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="text-center text-sm text-muted-foreground h-24">
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
            <h3 className="text-lg font-semibold mb-4">Add New Expense</h3>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
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
                <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                  <option value="" disabled>Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
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
              
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
