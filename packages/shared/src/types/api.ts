import {
  AccountType,
  TransactionType,
  CategoryType,
  RecurringFrequency,
  CreditType,
  ProjectStatus,
} from './enums.js';

// Base API Response
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

// Auth DTOs
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

// Account DTOs
export interface CreateAccountDto {
  name: string;
  type: AccountType;
  balance: number;
  color?: string;
  icon?: string;
  isDefault?: boolean;
}

export interface UpdateAccountDto {
  name?: string;
  type?: AccountType;
  color?: string;
  icon?: string;
  isDefault?: boolean;
}

export interface TransferDto {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
  date?: string;
}

// Transaction DTOs
export interface CreateTransactionDto {
  accountId: string;
  categoryId?: string;
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  recurringEndDate?: string;
  tags?: string[];
}

export interface UpdateTransactionDto {
  accountId?: string;
  categoryId?: string;
  amount?: number;
  type?: TransactionType;
  description?: string;
  date?: string;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  tags?: string[];
}

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  tags?: string[];
  isRecurring?: boolean;
  page?: number;
  limit?: number;
}

// Category DTOs
export interface CreateCategoryDto {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  icon?: string;
  color?: string;
}

// Subscription DTOs
export interface CreateSubscriptionDto {
  accountId: string;
  categoryId?: string;
  name: string;
  amount: number;
  frequency: RecurringFrequency;
  nextPaymentDate: string;
  reminderDays?: number;
  icon?: string;
  color?: string;
  notes?: string;
}

export interface UpdateSubscriptionDto {
  accountId?: string;
  categoryId?: string;
  name?: string;
  amount?: number;
  frequency?: RecurringFrequency;
  nextPaymentDate?: string;
  reminderDays?: number;
  isActive?: boolean;
  icon?: string;
  color?: string;
  notes?: string;
}

// Credit DTOs
export interface CreateCreditDto {
  accountId: string;
  name: string;
  type: CreditType;
  totalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  interestRate: number;
  startDate: string;
  endDate: string;
  paymentDay: number;
  reminderDays?: number;
  notes?: string;
}

export interface UpdateCreditDto {
  accountId?: string;
  name?: string;
  type?: CreditType;
  monthlyPayment?: number;
  interestRate?: number;
  paymentDay?: number;
  reminderDays?: number;
  notes?: string;
}

export interface RecordCreditPaymentDto {
  amount: number;
  principal: number;
  interest: number;
  paymentDate: string;
}

// Project DTOs
export interface CreateProjectDto {
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount?: number;
  deadline?: string;
  accountId?: string;
  color?: string;
  icon?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  targetAmount?: number;
  deadline?: string;
  accountId?: string;
  status?: ProjectStatus;
  color?: string;
  icon?: string;
}

export interface ContributeToProjectDto {
  accountId: string;
  amount: number;
  notes?: string;
}

// Settings DTOs
export interface UpdateSettingsDto {
  currency?: string;
  locale?: string;
  timezone?: string;
  lowBalanceThreshold?: number;
}

// Dashboard/Stats DTOs
export interface DashboardStats {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  accountBalances: {
    accountId: string;
    accountName: string;
    balance: number;
    type: AccountType;
  }[];
  recentTransactions: {
    id: string;
    amount: number;
    type: TransactionType;
    description: string;
    date: string;
    categoryName?: string;
    accountName: string;
  }[];
  upcomingSubscriptions: {
    id: string;
    name: string;
    amount: number;
    nextPaymentDate: string;
  }[];
  upcomingCredits: {
    id: string;
    name: string;
    monthlyPayment: number;
    nextPaymentDate: string;
  }[];
  projectsProgress: {
    id: string;
    name: string;
    currentAmount: number;
    targetAmount: number;
    progress: number;
    color?: string;
  }[];
}

export interface MonthlyStats {
  month: string;
  income: number;
  expenses: number;
  net: number;
  byCategory: {
    categoryId: string;
    categoryName: string;
    amount: number;
    percentage: number;
  }[];
}

export interface CalendarEvent {
  id: string;
  type: 'subscription' | 'credit' | 'recurring_transaction';
  title: string;
  amount: number;
  date: string;
  accountId: string;
  accountName: string;
}
