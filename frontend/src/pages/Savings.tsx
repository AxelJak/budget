import { useEffect, useState } from 'react';
import { savingsApi } from '../api/client';
import type { Savings } from '../types';
import { Plus, Edit2, Trash2, PiggyBank, TrendingUp, TrendingDown } from 'lucide-react';

export default function SavingsPage() {
  const [savings, setSavings] = useState<Savings[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSavingsForm, setShowSavingsForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingSavings, setEditingSavings] = useState<Savings | null>(null);
  const [selectedSavingsId, setSelectedSavingsId] = useState<number | null>(null);

  useEffect(() => {
    loadSavings();
  }, []);

  const loadSavings = async () => {
    try {
      setLoading(true);
      const data = await savingsApi.getAll();
      setSavings(data);
    } catch (err) {
      console.error('Error loading savings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Är du säker på att du vill ta bort detta sparkonto?')) {
      return;
    }

    try {
      await savingsApi.delete(id);
      loadSavings();
    } catch (err) {
      console.error('Error deleting savings:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Laddar...</div>;
  }

  const totalSavings = savings.reduce((sum, s) => sum + s.current_balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Sparande</h2>
        <button
          onClick={() => {
            setEditingSavings(null);
            setShowSavingsForm(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus size={16} className="mr-2" />
          Nytt sparkonto
        </button>
      </div>

      {showSavingsForm && (
        <SavingsForm
          savings={editingSavings}
          onClose={() => {
            setShowSavingsForm(false);
            setEditingSavings(null);
          }}
          onSave={() => {
            loadSavings();
            setShowSavingsForm(false);
            setEditingSavings(null);
          }}
        />
      )}

      {showTransactionForm && selectedSavingsId && (
        <TransactionForm
          savingsId={selectedSavingsId}
          onClose={() => {
            setShowTransactionForm(false);
            setSelectedSavingsId(null);
          }}
          onSave={() => {
            loadSavings();
            setShowTransactionForm(false);
            setSelectedSavingsId(null);
          }}
        />
      )}

      {/* Summary Card */}
      <div className="bg-green-50 border border-green-200 rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Totalt sparat</h3>
        <p className="text-3xl font-bold text-green-600">{formatCurrency(totalSavings)}</p>
      </div>

      {/* Savings List */}
      <div className="bg-white rounded-lg shadow">
        {savings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Inga sparkonton registrerade. Klicka på "Nytt sparkonto" för att lägga till ett.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {savings.map(account => (
              <div key={account.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <PiggyBank className="text-green-600" size={24} />
                      <h3 className="text-xl font-semibold text-gray-900">{account.name}</h3>
                    </div>
                    {account.account_type && (
                      <p className="text-sm text-gray-600 mb-1">Typ: {account.account_type}</p>
                    )}
                    {account.description && (
                      <p className="text-sm text-gray-600">{account.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedSavingsId(account.id);
                        setShowTransactionForm(true);
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                      title="Lägg till transaktion"
                    >
                      <Plus size={20} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingSavings(account);
                        setShowSavingsForm(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="Redigera"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Ta bort"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="bg-green-100 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Nuvarande saldo</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(account.current_balance)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface SavingsFormProps {
  savings: Savings | null;
  onClose: () => void;
  onSave: () => void;
}

function SavingsForm({ savings, onClose, onSave }: SavingsFormProps) {
  const [formData, setFormData] = useState({
    name: savings?.name || '',
    current_balance: savings?.current_balance || 0,
    account_type: savings?.account_type || '',
    description: savings?.description || '',
    is_active: savings?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (savings) {
        await savingsApi.update(savings.id, formData);
      } else {
        await savingsApi.create(formData);
      }
      onSave();
    } catch (err) {
      console.error('Error saving savings:', err);
      alert('Kunde inte spara sparkonto');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">
          {savings ? 'Redigera sparkonto' : 'Nytt sparkonto'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Namn *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="t.ex. Gemensamt sparkonto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nuvarande saldo *
            </label>
            <input
              type="number"
              value={formData.current_balance}
              onChange={(e) => setFormData({ ...formData, current_balance: parseFloat(e.target.value) })}
              required
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Typ av konto
            </label>
            <input
              type="text"
              value={formData.account_type}
              onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="t.ex. Sparkonto, Fond, ISK"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Beskrivning
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Aktivt konto
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
    </div>
  );
}

interface TransactionFormProps {
  savingsId: number;
  onClose: () => void;
  onSave: () => void;
}

function TransactionForm({ savingsId, onClose, onSave }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    transaction_type: 'deposit' as 'deposit' | 'withdrawal' | 'interest',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Convert withdrawal to negative amount
      const amount = formData.transaction_type === 'withdrawal'
        ? -Math.abs(formData.amount)
        : Math.abs(formData.amount);

      await savingsApi.addTransaction({
        savings_id: savingsId,
        date: new Date(formData.date).toISOString(),
        amount,
        transaction_type: formData.transaction_type,
        description: formData.description || null,
      });
      onSave();
    } catch (err) {
      console.error('Error saving transaction:', err);
      alert('Kunde inte spara transaktion');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Ny transaktion</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Datum *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Typ *
            </label>
            <select
              value={formData.transaction_type}
              onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value as any })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="deposit">Insättning</option>
              <option value="withdrawal">Uttag</option>
              <option value="interest">Ränta</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Belopp *
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                required
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {formData.transaction_type === 'withdrawal' ? (
                  <TrendingDown className="text-red-500" size={20} />
                ) : (
                  <TrendingUp className="text-green-500" size={20} />
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Ange alltid positivt belopp
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anteckning
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
