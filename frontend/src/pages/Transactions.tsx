import { useEffect, useState } from 'react';
import { transactionApi, categoryApi } from '../api/client';
import type { Transaction, Category } from '../types';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Edit2, Trash2 } from 'lucide-react';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transData, catData] = await Promise.all([
        transactionApi.getCurrentPeriod(),
        categoryApi.getAll(),
      ]);
      setTransactions(transData);
      setCategories(catData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (transactionId: number, categoryId: number | null) => {
    try {
      await transactionApi.update(transactionId, { category_id: categoryId }, true);
      setEditingId(null);
      loadData(); // Reload to get updated data
    } catch (err) {
      console.error('Error updating transaction:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Är du säker på att du vill ta bort denna transaktion?')) {
      return;
    }

    try {
      await transactionApi.delete(id);
      loadData();
    } catch (err) {
      console.error('Error deleting transaction:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Laddar...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Transaktioner
        </h2>
        <p className="text-sm text-gray-600">
          {transactions.length} transaktioner denna period
        </p>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Datum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Beskrivning
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategori
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Belopp
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Åtgärder
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(transaction.date), 'dd MMM yyyy', { locale: sv })}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {transaction.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {editingId === transaction.id ? (
                    <select
                      value={selectedCategory || transaction.category_id || ''}
                      onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
                      onBlur={() => {
                        if (selectedCategory !== null) {
                          handleUpdateCategory(transaction.id, selectedCategory);
                        } else {
                          setEditingId(null);
                        }
                      }}
                      autoFocus
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Okategoriserad</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(transaction.id);
                        setSelectedCategory(transaction.category_id);
                      }}
                      className="flex items-center space-x-2 hover:text-blue-600"
                    >
                      {transaction.category ? (
                        <>
                          <span
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: transaction.category.color || '#94a3b8' }}
                          />
                          <span>{transaction.category.name}</span>
                        </>
                      ) : (
                        <span className="text-gray-400">Okategoriserad</span>
                      )}
                      <Edit2 size={14} className="opacity-0 group-hover:opacity-100" />
                    </button>
                  )}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                  transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {transactions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>Inga transaktioner hittades</p>
            <p className="text-sm mt-2">Importera en CSV-fil för att komma igång</p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
