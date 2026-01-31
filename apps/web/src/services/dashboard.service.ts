import api from './api';
import type { DashboardStats, MonthlyStats, CalendarEvent } from '@moneystack/shared';

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard');
    return response.data.data;
  },

  getMonthlyStats: async (year?: number): Promise<MonthlyStats[]> => {
    const params = year ? `?year=${year}` : '';
    const response = await api.get(`/dashboard/monthly-stats${params}`);
    return response.data.data;
  },

  getCalendarEvents: async (startDate: string, endDate: string): Promise<CalendarEvent[]> => {
    const response = await api.get(
      `/dashboard/calendar?startDate=${startDate}&endDate=${endDate}`,
    );
    return response.data.data;
  },

  getYearSummary: async (year?: number) => {
    const params = year ? `?year=${year}` : '';
    const response = await api.get(`/dashboard/year-summary${params}`);
    return response.data.data;
  },

  getBudgetSummary: async (): Promise<BudgetSummary> => {
    const response = await api.get('/dashboard/budget-summary');
    return response.data.data;
  },

  getFutureProjection: async (months?: number): Promise<FutureProjection> => {
    const params = months ? `?months=${months}` : '';
    const response = await api.get(`/dashboard/future-projection${params}`);
    return response.data.data;
  },
};

export interface BudgetSummary {
  expectedMonthlyIncome: number;
  fixedExpenses: {
    subscriptions: number;
    credits: number;
    total: number;
  };
  availableBudget: number;
  actualSpentThisMonth: number;
  remainingBudget: number;
  recurringIncomes: Array<{
    id: string;
    description: string;
    amount: number;
    frequency: string;
    monthlyAmount: number;
  }>;
}

export interface MonthProjection {
  month: string;
  monthLabel: string;
  expectedIncome: number;
  expectedExpenses: number;
  subscriptions: number;
  credits: number;
  netFlow: number;
  projectedBalance: number;
}

export interface FutureProjection {
  currentBalance: number;
  monthlyIncome: number;
  monthlyFixedExpenses: number;
  projection: MonthProjection[];
  recurringIncomes: Array<{
    id: string;
    description: string;
    amount: number;
    frequency: string;
    monthlyAmount: number;
  }>;
  subscriptions: Array<{
    id: string;
    name: string;
    amount: number;
    frequency: string;
    monthlyAmount: number;
    paymentDay: number;
  }>;
  credits: Array<{
    id: string;
    name: string;
    type: string;
    totalAmount: number;
    remainingAmount: number;
    monthlyPayment: number;
    paymentDay: number;
  }>;
}
