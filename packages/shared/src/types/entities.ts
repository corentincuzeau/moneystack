import {
  AccountType,
  TransactionType,
  CategoryType,
  RecurringFrequency,
  CreditType,
  ProjectStatus,
} from './enums.js';

export interface User {
  id: string;
  email: string;
  name: string;
  googleId: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  icon: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  userId?: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  accountId: string;
  account?: Account;
  toAccountId?: string;
  toAccount?: Account;
  categoryId?: string;
  category?: Category;
  amount: number;
  type: TransactionType;
  description: string;
  date: Date;
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  recurringEndDate?: Date;
  parentTransactionId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  accountId: string;
  account?: Account;
  categoryId?: string;
  category?: Category;
  name: string;
  amount: number;
  frequency: RecurringFrequency;
  paymentDay: number;
  nextPaymentDate: Date;
  reminderDays: number;
  isActive: boolean;
  icon?: string;
  color?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Credit {
  id: string;
  userId: string;
  accountId: string;
  account?: Account;
  name: string;
  type: CreditType;
  totalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  interestRate: number;
  startDate: Date;
  endDate: Date;
  paymentDay: number;
  reminderDays: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditPayment {
  id: string;
  creditId: string;
  amount: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  paymentDate: Date;
  isPaid: boolean;
  createdAt: Date;
}

export interface Project {
  id: string;
  userId: string;
  accountId?: string;
  account?: Account;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  status: ProjectStatus;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectContribution {
  id: string;
  projectId: string;
  accountId: string;
  amount: number;
  date: Date;
  notes?: string;
  createdAt: Date;
}

export interface UserSettings {
  id: string;
  userId: string;
  currency: string;
  locale: string;
  timezone: string;
  lowBalanceThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}
