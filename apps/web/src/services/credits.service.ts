import api from './api';
import type { Credit, CreditPayment } from '@moneystack/shared';

export interface CreateCreditDto {
  accountId: string;
  name: string;
  type: string;
  totalAmount: number;
  remainingAmount?: number;
  monthlyPayment: number;
  interestRate: number;
  startDate: string;
  endDate: string;
  paymentDay: number;
  reminderDays?: number;
  notes?: string;
}

export interface UpdateCreditDto extends Partial<CreateCreditDto> {}

export const creditsService = {
  getAll: async (): Promise<Credit[]> => {
    const response = await api.get('/credits');
    return response.data.data;
  },

  getById: async (id: string): Promise<Credit> => {
    const response = await api.get(`/credits/${id}`);
    return response.data.data;
  },

  create: async (data: CreateCreditDto): Promise<Credit> => {
    const response = await api.post('/credits', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateCreditDto): Promise<Credit> => {
    const response = await api.put(`/credits/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/credits/${id}`);
  },

  getPayments: async (creditId: string): Promise<CreditPayment[]> => {
    const response = await api.get(`/credits/${creditId}/payments`);
    return response.data.data;
  },

  recordPayment: async (creditId: string, amount: number): Promise<CreditPayment> => {
    const response = await api.post(`/credits/${creditId}/payments`, { amount });
    return response.data.data;
  },

  getTotalRemaining: async (): Promise<number> => {
    const response = await api.get('/credits/total-remaining');
    return response.data.data.total;
  },
};
