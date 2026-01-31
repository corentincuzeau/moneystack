import api from './api';
import type { Subscription } from '@moneystack/shared';

export interface CreateSubscriptionDto {
  accountId: string;
  categoryId?: string;
  name: string;
  amount: number;
  frequency: string;
  paymentDay: number;
  reminderDays?: number;
  icon?: string;
  color?: string;
  notes?: string;
}

export interface UpdateSubscriptionDto extends Partial<CreateSubscriptionDto> {
  isActive?: boolean;
}

export const subscriptionsService = {
  getAll: async (): Promise<Subscription[]> => {
    const response = await api.get('/subscriptions');
    return response.data.data;
  },

  getById: async (id: string): Promise<Subscription> => {
    const response = await api.get(`/subscriptions/${id}`);
    return response.data.data;
  },

  create: async (data: CreateSubscriptionDto): Promise<Subscription> => {
    const response = await api.post('/subscriptions', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateSubscriptionDto): Promise<Subscription> => {
    const response = await api.put(`/subscriptions/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/subscriptions/${id}`);
  },

  getUpcoming: async (days: number = 7): Promise<Subscription[]> => {
    const response = await api.get(`/subscriptions/upcoming?days=${days}`);
    return response.data.data;
  },

  getMonthlyTotal: async (): Promise<number> => {
    const response = await api.get('/subscriptions/monthly-total');
    return response.data.data.total;
  },

  processDue: async (): Promise<void> => {
    await api.post('/subscriptions/process-due');
  },
};
