import api from './api';
import type {
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionFilters,
  PaginatedResponse,
} from '@moneystack/shared';

export const transactionsService = {
  getAll: async (filters: TransactionFilters = {}): Promise<PaginatedResponse<Transaction>> => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else {
          params.append(key, String(value));
        }
      }
    });

    const response = await api.get(`/transactions?${params.toString()}`);
    return response.data.data;
  },

  getById: async (id: string): Promise<Transaction> => {
    const response = await api.get(`/transactions/${id}`);
    return response.data.data;
  },

  create: async (data: CreateTransactionDto): Promise<Transaction> => {
    const response = await api.post('/transactions', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateTransactionDto): Promise<Transaction> => {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },

  getStats: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/transactions/stats?${params.toString()}`);
    return response.data.data;
  },
};
