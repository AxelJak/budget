import { useEffect, useState } from 'react';
import { loanApi } from '../api/client';
import type { Loan } from '../types';
import { Plus, Edit2, Trash2, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

export default function Loans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      setLoading(true);
      const data = await loanApi.getAll();
      setLoans(data);
    } catch (err) {
      console.error('Error loading loans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Är du säker på att du vill ta bort detta lån?')) {
      return;
    }

    try {
      await loanApi.delete(id);
      loadLoans();
    } catch (err) {
      console.error('Error deleting loan:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Laddar...</div>;
  }

  const totalDebt = loans.reduce((sum, loan) => sum + loan.current_balance, 0);
  const totalPaid = loans.reduce((sum, loan) => sum + (loan.initial_amount - loan.current_balance), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Lån</h2>
        <button
          onClick={() => {
            setEditingLoan(null);
            setShowLoanForm(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus size={16} className="mr-2" />
          Nytt lån
        </button>
      </div>

      {showLoanForm && (
        <LoanForm
          loan={editingLoan}
          onClose={() => {
            setShowLoanForm(false);
            setEditingLoan(null);
          }}
          onSave={() => {
            loadLoans();
            setShowLoanForm(false);
            setEditingLoan(null);
          }}
        />
      )}

      {showPaymentForm && selectedLoanId && (
        <PaymentForm
          loanId={selectedLoanId}
          onClose={() => {
            setShowPaymentForm(false);
            setSelectedLoanId(null);
          }}
          onSave={() => {
            loadLoans();
            setShowPaymentForm(false);
            setSelectedLoanId(null);
          }}
        />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-red-50 border border-red-200 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total skuld</h3>
          <p className="text-3xl font-bold text-red-600">{formatCurrency(totalDebt)}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Totalt betalt</h3>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
        </div>
      </div>

      {/* Loans List */}
      <div className="bg-white rounded-lg shadow">
        {loans.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Inga lån registrerade. Klicka på "Nytt lån" för att lägga till ett.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {loans.map(loan => {
              const paidAmount = loan.initial_amount - loan.current_balance;
              const paidPercentage = (paidAmount / loan.initial_amount) * 100;

              return (
                <div key={loan.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="text-red-600" size={24} />
                        <h3 className="text-xl font-semibold text-gray-900">{loan.name}</h3>
                      </div>
                      {loan.description && (
                        <p className="text-sm text-gray-600 mb-2">{loan.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          Start: {format(new Date(loan.start_date), 'PP', { locale: sv })}
                        </span>
                        {loan.interest_rate && (
                          <span>Ränta: {loan.interest_rate}%</span>
                        )}
                        {loan.monthly_payment && (
                          <span>Månadskostnad: {formatCurrency(loan.monthly_payment)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedLoanId(loan.id);
                          setShowPaymentForm(true);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Registrera betalning"
                      >
                        <Plus size={20} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingLoan(loan);
                          setShowLoanForm(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Redigera"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(loan.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Ta bort"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Ursprungligt belopp</p>
                      <p className="text-lg font-semibold">{formatCurrency(loan.initial_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Kvarstående</p>
                      <p className="text-lg font-semibold text-red-600">{formatCurrency(loan.current_balance)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Betalt</p>
                      <p className="text-lg font-semibold text-green-600">{formatCurrency(paidAmount)}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all flex items-center justify-end pr-2"
                      style={{ width: `${paidPercentage}%` }}
                    >
                      <span className="text-xs text-white font-semibold">
                        {paidPercentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface LoanFormProps {
  loan: Loan | null;
  onClose: () => void;
  onSave: () => void;
}

function LoanForm({ loan, onClose, onSave }: LoanFormProps) {
  const [formData, setFormData] = useState({
    name: loan?.name || '',
    initial_amount: loan?.initial_amount || 0,
    current_balance: loan?.current_balance || 0,
    interest_rate: loan?.interest_rate || null,
    monthly_payment: loan?.monthly_payment || null,
    start_date: loan?.start_date ? loan.start_date.split('T')[0] : new Date().toISOString().split('T')[0],
    description: loan?.description || '',
    is_active: loan?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
      };

      if (loan) {
        await loanApi.update(loan.id, data);
      } else {
        await loanApi.create(data);
      }
      onSave();
    } catch (err) {
      console.error('Error saving loan:', err);
      alert('Kunde inte spara lån');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">{loan ? 'Redigera lån' : 'Nytt lån'}</h3>

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
              placeholder="t.ex. Huslån, Billån"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ursprungligt belopp *
              </label>
              <input
                type="number"
                value={formData.initial_amount}
                onChange={(e) => setFormData({ ...formData, initial_amount: parseFloat(e.target.value) })}
                required
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kvarstående belopp *
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ränta (%)
              </label>
              <input
                type="number"
                value={formData.interest_rate || ''}
                onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value ? parseFloat(e.target.value) : null })}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="t.ex. 2.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Månadskostnad
              </label>
              <input
                type="number"
                value={formData.monthly_payment || ''}
                onChange={(e) => setFormData({ ...formData, monthly_payment: e.target.value ? parseFloat(e.target.value) : null })}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Startdatum *
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
              Aktivt lån
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

interface PaymentFormProps {
  loanId: number;
  onClose: () => void;
  onSave: () => void;
}

function PaymentForm({ loanId, onClose, onSave }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    principal_amount: null as number | null,
    interest_amount: null as number | null,
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await loanApi.addPayment({
        loan_id: loanId,
        date: new Date(formData.date).toISOString(),
        amount: formData.amount,
        principal_amount: formData.principal_amount,
        interest_amount: formData.interest_amount,
        description: formData.description || null,
      });
      onSave();
    } catch (err) {
      console.error('Error saving payment:', err);
      alert('Kunde inte spara betalning');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Registrera betalning</h3>

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
              Totalt belopp *
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              required
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amortering
              </label>
              <input
                type="number"
                value={formData.principal_amount || ''}
                onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value ? parseFloat(e.target.value) : null })}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ränta
              </label>
              <input
                type="number"
                value={formData.interest_amount || ''}
                onChange={(e) => setFormData({ ...formData, interest_amount: e.target.value ? parseFloat(e.target.value) : null })}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
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
