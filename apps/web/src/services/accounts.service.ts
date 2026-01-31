import api from './api';
import type {
  Account,
  CreateAccountDto,
  UpdateAccountDto,
  TransferDto,
} from '@moneystack/shared';

export const accountsService = {
  getAll: async (): Promise<Account[]> => {
    const response = await api.get('/accounts');
    return response.data.data;
  },

  getById: async (id: string): Promise<Account> => {
    const response = await api.get(`/accounts/${id}`);
    return response.data.data;
  },

  create: async (data: CreateAccountDto): Promise<Account> => {
    const response = await api.post('/accounts', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateAccountDto): Promise<Account> => {
    const response = await api.put(`/accounts/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/accounts/${id}`);
  },

  transfer: async (data: TransferDto): Promise<{ fromAccount: Account; toAccount: Account }> => {
    const response = await api.post('/accounts/transfer', data);
    return response.data.data;
  },

  getTotalBalance: async (): Promise<number> => {
    const response = await api.get('/accounts/total-balance');
    return response.data.data.total;
  },

  getBalancesByType: async (): Promise<{ type: string; balance: number }[]> => {
    const response = await api.get('/accounts/balances-by-type');
    return response.data.data;
  },
};
