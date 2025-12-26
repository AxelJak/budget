import axios from 'axios';
import type { Transaction, Category, PeriodSummary, ImportResponse, Loan, LoanWithPayments, LoanPayment, Savings, SavingsWithTransactions, SavingsTransaction } from '../types';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Transactions
export const transactionApi = {
  getAll: async (params?: {
    skip?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
    category_id?: number;
    uncategorized?: boolean;
    search?: string;
  }) => {
    const response = await api.get<Transaction[]>('/transactions/', { params });
    return response.data;
  },

  getCurrentPeriod: async () => {
    const response = await api.get<Transaction[]>('/transactions/current-period');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  update: async (id: number, data: { category_id?: number; description?: string }, learn = true) => {
    const response = await api.put<Transaction>(`/transactions/${id}?learn=${learn}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },

  bulkCategorize: async (transactionIds: number[], categoryId: number | null, learn = true) => {
    const response = await api.post(`/transactions/bulk-categorize?learn=${learn}`, {
      transaction_ids: transactionIds,
      category_id: categoryId,
    });
    return response.data;
  },

  autoCategorize: async (params?: { start_date?: string; end_date?: string }) => {
    const response = await api.post('/transactions/auto-categorize', null, { params });
    return response.data;
  },

  import: async (file: File, autoCategorize = true) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ImportResponse>(
      `/transactions/import?auto_categorize=${autoCategorize}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};

// Categories
export const categoryApi = {
  getAll: async () => {
    const response = await api.get<Category[]>('/categories/');
    return response.data;
  },

  create: async (data: Omit<Category, 'id' | 'created_at'>) => {
    const response = await api.post<Category>('/categories/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Omit<Category, 'id' | 'created_at'>>) => {
    const response = await api.put<Category>(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

// Periods
export const periodApi = {
  getCurrent: async () => {
    const response = await api.get<PeriodSummary>('/periods/current');
    return response.data;
  },

  getSummary: async (startDate: string, endDate: string) => {
    const response = await api.get<PeriodSummary>('/periods/summary', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  list: async (limit = 12) => {
    const response = await api.get<PeriodSummary[]>('/periods/list', {
      params: { limit },
    });
    return response.data;
  },
};

// Loans
export const loanApi = {
  getAll: async (activeOnly = true) => {
    const response = await api.get<Loan[]>('/loans/', {
      params: { active_only: activeOnly },
    });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<LoanWithPayments>(`/loans/${id}`);
    return response.data;
  },

  create: async (data: Omit<Loan, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await api.post<Loan>('/loans/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Omit<Loan, 'id' | 'created_at' | 'updated_at'>>) => {
    const response = await api.put<Loan>(`/loans/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/loans/${id}`);
    return response.data;
  },

  getPayments: async (loanId: number) => {
    const response = await api.get<LoanPayment[]>(`/loans/${loanId}/payments`);
    return response.data;
  },

  addPayment: async (data: Omit<LoanPayment, 'id' | 'created_at'>) => {
    const response = await api.post<LoanPayment>('/loans/payments', data);
    return response.data;
  },

  deletePayment: async (paymentId: number) => {
    const response = await api.delete(`/loans/payments/${paymentId}`);
    return response.data;
  },
};

// Savings
export const savingsApi = {
  getAll: async (activeOnly = true) => {
    const response = await api.get<Savings[]>('/savings/', {
      params: { active_only: activeOnly },
    });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<SavingsWithTransactions>(`/savings/${id}`);
    return response.data;
  },

  create: async (data: Omit<Savings, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await api.post<Savings>('/savings/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Omit<Savings, 'id' | 'created_at' | 'updated_at'>>) => {
    const response = await api.put<Savings>(`/savings/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/savings/${id}`);
    return response.data;
  },

  getTransactions: async (savingsId: number) => {
    const response = await api.get<SavingsTransaction[]>(`/savings/${savingsId}/transactions`);
    return response.data;
  },

  addTransaction: async (data: Omit<SavingsTransaction, 'id' | 'created_at'>) => {
    const response = await api.post<SavingsTransaction>('/savings/transactions', data);
    return response.data;
  },

  deleteTransaction: async (transactionId: number) => {
    const response = await api.delete(`/savings/transactions/${transactionId}`);
    return response.data;
  },
};

export default api;
