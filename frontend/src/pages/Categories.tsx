import { useEffect, useState } from 'react';
import { categoryApi } from '../api/client';
import type { Category } from '../types';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryApi.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Är du säker? Detta kommer påverka alla transaktioner med denna kategori.')) {
      return;
    }

    try {
      await categoryApi.delete(id);
      loadCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Laddar...</div>;
  }

  const groupedCategories = {
    income: categories.filter(c => c.type === 'income'),
    fixed: categories.filter(c => c.type === 'fixed'),
    variable: categories.filter(c => c.type === 'variable'),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Kategorier</h2>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus size={16} className="mr-2" />
          Ny kategori
        </button>
      </div>

      {showForm && (
        <CategoryForm
          onClose={() => {
            setShowForm(false);
            setEditingId(null);
          }}
          onSave={() => {
            loadCategories();
            setShowForm(false);
            setEditingId(null);
          }}
          editingId={editingId}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Income */}
        <CategoryGroup
          title="Inkomster"
          categories={groupedCategories.income}
          onEdit={(id) => {
            setEditingId(id);
            setShowForm(true);
          }}
          onDelete={handleDelete}
        />

        {/* Fixed */}
        <CategoryGroup
          title="Fasta utgifter"
          categories={groupedCategories.fixed}
          onEdit={(id) => {
            setEditingId(id);
            setShowForm(true);
          }}
          onDelete={handleDelete}
        />

        {/* Variable */}
        <CategoryGroup
          title="Rörliga utgifter"
          categories={groupedCategories.variable}
          onEdit={(id) => {
            setEditingId(id);
            setShowForm(true);
          }}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}

interface CategoryGroupProps {
  title: string;
  categories: Category[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

function CategoryGroup({ title, categories, onEdit, onDelete }: CategoryGroupProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-4 space-y-2">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 group"
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: category.color || '#94a3b8' }}
              />
              <span className="text-sm font-medium">{category.name}</span>
            </div>
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(category.id)}
                className="text-blue-600 hover:text-blue-900"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => onDelete(category.id)}
                className="text-red-600 hover:text-red-900"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Inga kategorier
          </p>
        )}
      </div>
    </div>
  );
}

interface CategoryFormProps {
  onClose: () => void;
  onSave: () => void;
  editingId: number | null;
}

function CategoryForm({ onClose, onSave, editingId }: CategoryFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'fixed' | 'variable'>('variable');
  const [color, setColor] = useState('#3b82f6');
  const [budgetLimit, setBudgetLimit] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        name,
        type,
        color,
        budget_limit: budgetLimit ? parseFloat(budgetLimit) : null,
      };

      if (editingId) {
        await categoryApi.update(editingId, data);
      } else {
        await categoryApi.create(data);
      }

      onSave();
    } catch (err) {
      console.error('Error saving category:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        {editingId ? 'Redigera kategori' : 'Ny kategori'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Namn
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Typ
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="income">Inkomst</option>
            <option value="fixed">Fast utgift</option>
            <option value="variable">Rörlig utgift</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Färg
          </label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="block w-20 h-10 rounded-md border-gray-300 cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Budgetgräns (valfritt)
          </label>
          <input
            type="number"
            value={budgetLimit}
            onChange={(e) => setBudgetLimit(e.target.value)}
            placeholder="0"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Avbryt
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Spara
          </button>
        </div>
      </form>
    </div>
  );
}
