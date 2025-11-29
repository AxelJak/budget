import axios from 'axios';
import type { Transaction, Category, PeriodSummary, ImportResponse } from '../types';

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

export default api;
