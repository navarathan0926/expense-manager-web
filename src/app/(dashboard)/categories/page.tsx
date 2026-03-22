'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Category } from '@/types';
import { Plus, Trash2, ShieldCheck, Tag } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/category');
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/category/${id}`);
      setCategories(categories.filter(c => c.id !== id));
    } catch (error) {
      console.error('Failed to delete category', error);
      alert('Cannot delete this category because it might be in use.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post('/category', { name, description });
      setIsModalOpen(false);
      setName('');
      setDescription('');
      fetchCategories();
    } catch (error) {
      console.error('Failed to create category', error);
      alert('Failed to create category.');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div className="text-muted-foreground p-4">Loading categories...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground text-sm">Organize your expenses efficiently.</p>
        </div>
        <button className="btn btn-primary gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="card relative transition-all hover:border-[hsl(var(--primary)/0.5)]">
            <div className="card-header pb-2 flex-row justify-between items-start">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                <h3 className="card-title text-base">{category.name}</h3>
              </div>
              {category.isPredefined ? (
                <div title="System Category">
                  <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                </div>
              ) : (
                <button 
                  onClick={() => handleDelete(category.id)} 
                  className="text-destructive opacity-50 hover:opacity-100 transition-opacity"
                  title="Delete Category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="card-content">
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {category.description || 'No description provided.'}
              </p>
            </div>
            {category.isPredefined && (
              <div className="absolute inset-0 bg-background/5 rounded-[calc(var(--radius)+0.25rem)] pointer-events-none" />
            )}
          </div>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full text-center text-sm text-muted-foreground p-8 card bg-transparent border-dashed">
            No categories available. Please configure your system.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-lg font-semibold mb-4">Create Custom Category</h3>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="label">Category Name</label>
                <input 
                  type="text" 
                  className="input" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g., Hobbies"
                  required 
                  maxLength={50}
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea 
                  className="input min-h-[100px] resize-none py-2" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details..."
                  maxLength={200}
                />
              </div>
              
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
