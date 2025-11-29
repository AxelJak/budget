import { useEffect, useState } from 'react';
import { transactionApi, categoryApi, periodApi } from '../api/client';
import type { Transaction, Category, PeriodSummary } from '../types';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Edit2, Trash2, ChevronLeft, ChevronRight, Filter, Zap } from 'lucide-react';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [periods, setPeriods] = useState<PeriodSummary[]>([]);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showUncategorizedOnly, setShowUncategorizedOnly] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState<number | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (periods.length > 0 && selectedPeriodIndex < periods.length) {
      loadTransactionsForPeriod(selectedPeriodIndex);
    }
  }, [selectedPeriodIndex, periods, showUncategorizedOnly]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [catData, periodsData] = await Promise.all([
        categoryApi.getAll(),
        periodApi.list(12),
      ]);
      setCategories(catData);
      setPeriods(periodsData);

      if (periodsData.length > 0) {
        await loadTransactionsForPeriod(0);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactionsForPeriod = async (periodIndex: number) => {
    if (periodIndex >= periods.length) return;

    const period = periods[periodIndex];
    try {
      // Use the transaction API with date filters from the selected period
      const transData = await transactionApi.getAll({
        start_date: period.start_date,
        end_date: period.end_date,
        uncategorized: showUncategorizedOnly ? true : undefined,
        limit: 1000, // Load all transactions for the period
      });
      setTransactions(transData);
      setSelectedTransactions(new Set()); // Clear selection when loading new data
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  };

  const loadData = async () => {
    await loadInitialData();
  };

  const handlePreviousPeriod = () => {
    if (selectedPeriodIndex < periods.length - 1) {
      setSelectedPeriodIndex(selectedPeriodIndex + 1);
    }
  };

  const handleNextPeriod = () => {
    if (selectedPeriodIndex > 0) {
      setSelectedPeriodIndex(selectedPeriodIndex - 1);
    }
  };

  const handleUpdateCategory = async (transactionId: number, categoryId: number | null) => {
    try {
      await transactionApi.update(transactionId, { category_id: categoryId ?? undefined }, true);
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

  const handleToggleSelection = (transactionId: number) => {
    const newSelection = new Set(selectedTransactions);
    if (newSelection.has(transactionId)) {
      newSelection.delete(transactionId);
    } else {
      newSelection.add(transactionId);
    }
    setSelectedTransactions(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.id)));
    }
  };

  const handleBulkCategorize = async () => {
    if (selectedTransactions.size === 0) {
      alert('Välj minst en transaktion');
      return;
    }

    if (bulkCategoryId === null) {
      alert('Välj en kategori');
      return;
    }

    try {
      await transactionApi.bulkCategorize(Array.from(selectedTransactions), bulkCategoryId, true);
      setSelectedTransactions(new Set());
      setBulkCategoryId(null);
      loadData();
    } catch (err) {
      console.error('Error bulk categorizing:', err);
      alert('Fel vid kategorisering av transaktioner');
    }
  };

  const handleAutoCategorize = async () => {
    console.log('Auto-categorize button clicked');

    const choice = confirm(
      'Vill du kategorisera ALLA okategoriserade transaktioner i databasen?\n\n' +
      'OK = Alla transaktioner (alla perioder)\n' +
      'Avbryt = Endast vald period'
    );

    console.log('User choice:', choice);

    // User clicked Cancel, ask if they want to do current period only
    if (!choice) {
      if (!currentPeriod) return;

      const periodConfirmed = confirm(
        `Kategorisera okategoriserade transaktioner för ${currentPeriod.period_name}?`
      );

      if (!periodConfirmed) return;

      try {
        const result = await transactionApi.autoCategorize({
          start_date: currentPeriod.start_date,
          end_date: currentPeriod.end_date,
        });
        alert(result.message);
        loadData();
      } catch (err) {
        console.error('Error auto-categorizing:', err);
        alert('Fel vid automatisk kategorisering');
      }
      return;
    }

    // User chose to categorize all transactions
    try {
      const result = await transactionApi.autoCategorize();
      alert(result.message);
      loadData();
    } catch (err) {
      console.error('Error auto-categorizing:', err);
      alert('Fel vid automatisk kategorisering');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Laddar...</div>;
  }

  const currentPeriod = periods[selectedPeriodIndex];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Transaktioner
          </h2>

          {/* Period Navigation */}
          {periods.length > 0 && (
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePreviousPeriod}
                disabled={selectedPeriodIndex >= periods.length - 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Föregående period"
              >
                <ChevronLeft size={20} />
              </button>

              <select
                value={selectedPeriodIndex}
                onChange={(e) => setSelectedPeriodIndex(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {periods.map((p, index) => (
                  <option key={index} value={index}>
                    {p.period_name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleNextPeriod}
                disabled={selectedPeriodIndex <= 0}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Nästa period"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {currentPeriod ? currentPeriod.period_name : ''} - {transactions.length} transaktioner
          </p>

          <div className="flex items-center space-x-3">
            {/* Filter for uncategorized */}
            <button
              onClick={() => setShowUncategorizedOnly(!showUncategorizedOnly)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                showUncategorizedOnly
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter size={16} />
              <span>{showUncategorizedOnly ? 'Visar okategoriserade' : 'Visa okategoriserade'}</span>
            </button>

            {/* Auto-categorize button */}
            <button
              onClick={handleAutoCategorize}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md"
              title="Kategorisera automatiskt baserat på regler"
            >
              <Zap size={16} />
              <span>Auto-kategorisera</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedTransactions.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedTransactions.size} transaktion(er) valda
              </span>
              <select
                value={bulkCategoryId || ''}
                onChange={(e) => setBulkCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-1.5 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Välj kategori...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleBulkCategorize}
                disabled={bulkCategoryId === null}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Kategorisera valda
              </button>
            </div>
            <button
              onClick={() => setSelectedTransactions(new Set())}
              className="text-sm text-blue-700 hover:text-blue-900"
            >
              Rensa urval
            </button>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedTransactions.size === transactions.length && transactions.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
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
              <tr
                key={transaction.id}
                className={`hover:bg-gray-50 ${selectedTransactions.has(transaction.id) ? 'bg-blue-50' : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.has(transaction.id)}
                    onChange={() => handleToggleSelection(transaction.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
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
