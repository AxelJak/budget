import { useEffect, useState } from 'react';
import { periodApi, loanApi, savingsApi } from '../api/client';
import type { PeriodSummary, Loan, Savings } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight, DollarSign, PiggyBank } from 'lucide-react';

export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodSummary | null>(null);
  const [periods, setPeriods] = useState<PeriodSummary[]>([]);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [savings, setSavings] = useState<Savings[]>([]);

  useEffect(() => {
    loadPeriods();
    loadLoans();
    loadSavings();
  }, []);

  useEffect(() => {
    if (periods.length > 0 && selectedPeriodIndex < periods.length) {
      setPeriod(periods[selectedPeriodIndex]);
    }
  }, [selectedPeriodIndex, periods]);

  const loadPeriods = async () => {
    try {
      setLoading(true);
      const data = await periodApi.list(12);
      setPeriods(data);
      if (data.length > 0) {
        setPeriod(data[0]);
      }
    } catch (err) {
      setError('Kunde inte ladda period-data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLoans = async () => {
    try {
      const data = await loanApi.getAll();
      setLoans(data);
    } catch (err) {
      console.error('Kunde inte ladda lån:', err);
    }
  };

  const loadSavings = async () => {
    try {
      const data = await savingsApi.getAll();
      setSavings(data);
    } catch (err) {
      console.error('Kunde inte ladda sparande:', err);
    }
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

  if (loading) {
    return <div className="text-center py-12">Laddar...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>;
  }

  if (!period) {
    return <div className="text-center py-12">Ingen data tillgänglig</div>;
  }

  const chartData = period.categories
    .filter(cat => cat.total > 0)
    .map(cat => ({
      name: cat.category_name,
      value: cat.total,
      color: cat.color,
    }));

  return (
    <div className="space-y-6">
      {/* Period Header with Navigation */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {period.period_name}
          </h2>

          {/* Period Navigation */}
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
        </div>

        <p className="text-sm text-gray-500">
          {period.transaction_count} transaktioner
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Inkomster"
          amount={period.total_income}
          icon={<TrendingUp className="text-green-600" />}
          color="green"
        />
        <SummaryCard
          title="Utgifter"
          amount={period.total_expenses}
          icon={<TrendingDown className="text-red-600" />}
          color="red"
        />
        <SummaryCard
          title="Netto"
          amount={period.net}
          icon={<Wallet className="text-blue-600" />}
          color={period.net >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Fixed vs Variable */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Fasta utgifter</h3>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(period.total_fixed)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Rörliga utgifter</h3>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(period.total_variable)}
          </p>
        </div>
      </div>

      {/* Loans and Savings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Loans */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="text-red-600" size={20} />
              Lån
            </h3>
          </div>
          {loans.length === 0 ? (
            <p className="text-gray-500 text-sm">Inga lån registrerade</p>
          ) : (
            <div className="space-y-3">
              {loans.map(loan => {
                const paidAmount = loan.initial_amount - loan.current_balance;
                const paidPercentage = (paidAmount / loan.initial_amount) * 100;

                return (
                  <div key={loan.id} className="border-l-4 border-red-400 pl-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">{loan.name}</span>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(loan.current_balance)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Betalt: {formatCurrency(paidAmount)}</span>
                      <span>{paidPercentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${paidPercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Totalt kvar:</span>
                  <span className="text-xl font-bold text-red-600">
                    {formatCurrency(loans.reduce((sum, loan) => sum + loan.current_balance, 0))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Savings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <PiggyBank className="text-green-600" size={20} />
              Sparande
            </h3>
          </div>
          {savings.length === 0 ? (
            <p className="text-gray-500 text-sm">Inga sparkonton registrerade</p>
          ) : (
            <div className="space-y-3">
              {savings.map(account => (
                <div key={account.id} className="border-l-4 border-green-400 pl-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-sm block">{account.name}</span>
                      {account.account_type && (
                        <span className="text-xs text-gray-500">{account.account_type}</span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(account.current_balance)}
                    </span>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Totalt sparat:</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(savings.reduce((sum, s) => sum + s.current_balance, 0))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Utgifter per kategori</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Kategorier</h3>
          <div className="space-y-3">
            {period.categories.map(cat => (
              <div key={cat.category_id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-medium">{cat.category_name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(cat.total)}</p>
                  {cat.budget_limit && (
                    <p className="text-xs text-gray-500">
                      av {formatCurrency(cat.budget_limit)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  color: 'green' | 'red' | 'blue';
}

function SummaryCard({ title, amount, icon, color }: SummaryCardProps) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    blue: 'bg-blue-50 border-blue-200',
  };

  return (
    <div className={`rounded-lg shadow p-6 border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon}
      </div>
      <p className="text-3xl font-bold text-gray-900">
        {formatCurrency(amount)}
      </p>
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
