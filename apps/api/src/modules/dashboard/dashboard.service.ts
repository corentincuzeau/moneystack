import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AccountsService } from '../accounts/accounts.service';
import { TransactionsService } from '../transactions/transactions.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreditsService } from '../credits/credits.service';
import { ProjectsService } from '../projects/projects.service';
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  addMonths,
} from '@moneystack/shared';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
    private readonly transactionsService: TransactionsService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly creditsService: CreditsService,
    private readonly projectsService: ProjectsService,
  ) {}

  async getDashboardStats(userId: string) {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [
      accounts,
      totalBalance,
      monthStats,
      recentTransactions,
      upcomingSubscriptions,
      upcomingCredits,
      projects,
    ] = await Promise.all([
      this.accountsService.findAll(userId),
      this.accountsService.getTotalBalance(userId),
      this.transactionsService.getStats(userId, monthStart, monthEnd),
      this.getRecentTransactions(userId, 5),
      this.subscriptionsService.findUpcoming(userId, 14),
      this.creditsService.getUpcomingPayments(userId, 14),
      this.projectsService.findAll(userId, 'ACTIVE'),
    ]);

    return {
      totalBalance,
      totalIncome: monthStats.income,
      totalExpenses: monthStats.expenses,
      netFlow: monthStats.net,
      accountBalances: accounts.map((a) => ({
        accountId: a.id,
        accountName: a.name,
        balance: a.balance,
        type: a.type,
        color: a.color,
      })),
      recentTransactions,
      upcomingSubscriptions: upcomingSubscriptions.slice(0, 5).map((s) => ({
        id: s.id,
        name: s.name,
        amount: s.amount,
        nextPaymentDate: s.nextPaymentDate.toISOString(),
        icon: s.icon,
        color: s.color,
      })),
      upcomingCredits: upcomingCredits.slice(0, 5),
      projectsProgress: projects.map((p) => ({
        id: p.id,
        name: p.name,
        currentAmount: p.currentAmount,
        targetAmount: p.targetAmount,
        progress: p.targetAmount > 0 ? (p.currentAmount / p.targetAmount) * 100 : 0,
        color: p.color,
      })),
    };
  }

  async getMonthlyStats(userId: string, year: number) {
    const months = [];

    for (let month = 0; month < 12; month++) {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59);

      const stats = await this.transactionsService.getStats(userId, start, end);

      months.push({
        month: start.toISOString().substring(0, 7),
        income: stats.income,
        expenses: stats.expenses,
        net: stats.net,
        byCategory: stats.byCategory,
      });
    }

    return months;
  }

  async getCalendarEvents(userId: string, startDate: Date, endDate: Date) {
    const events: Array<{
      id: string;
      type: 'subscription' | 'credit' | 'recurring_transaction';
      title: string;
      amount: number;
      date: string;
      accountId: string;
      accountName: string;
      color?: string;
    }> = [];

    // Get subscriptions
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        userId,
        isActive: true,
        nextPaymentDate: { gte: startDate, lte: endDate },
      },
      include: { account: true },
    });

    subscriptions.forEach((sub) => {
      events.push({
        id: sub.id,
        type: 'subscription',
        title: sub.name,
        amount: sub.amount,
        date: sub.nextPaymentDate.toISOString(),
        accountId: sub.accountId,
        accountName: sub.account.name,
        color: sub.color || undefined,
      });
    });

    // Get credit payments
    const creditPayments = await this.prisma.creditPayment.findMany({
      where: {
        credit: { userId },
        isPaid: false,
        paymentDate: { gte: startDate, lte: endDate },
      },
      include: {
        credit: {
          include: { account: true },
        },
      },
    });

    creditPayments.forEach((payment) => {
      events.push({
        id: payment.id,
        type: 'credit',
        title: payment.credit.name,
        amount: payment.amount,
        date: payment.paymentDate.toISOString(),
        accountId: payment.credit.accountId,
        accountName: payment.credit.account.name,
      });
    });

    // Sort by date
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getYearSummary(userId: string, year: number) {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));

    const stats = await this.transactionsService.getStats(userId, yearStart, yearEnd);
    const monthlyStats = await this.getMonthlyStats(userId, year);

    const totalSubscriptions = await this.subscriptionsService.getTotalMonthly(userId);
    const totalCredits = await this.creditsService.getTotalMonthlyPayments(userId);
    const totalDebt = await this.creditsService.getTotalRemainingDebt(userId);
    const totalSavings = await this.projectsService.getTotalSavings(userId);

    return {
      year,
      totalIncome: stats.income,
      totalExpenses: stats.expenses,
      netSavings: stats.net,
      averageMonthlyIncome: stats.income / 12,
      averageMonthlyExpenses: stats.expenses / 12,
      monthlyFixedCosts: totalSubscriptions + totalCredits,
      totalDebt,
      totalSavings,
      byCategory: stats.byCategory,
      monthlyBreakdown: monthlyStats,
    };
  }

  async getBudgetSummary(userId: string) {
    // Get user's accounts
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      select: { id: true },
    });
    const accountIds = accounts.map((a) => a.id);

    // Get recurring income transactions (salary, etc.)
    const recurringIncomes = await this.prisma.transaction.findMany({
      where: {
        accountId: { in: accountIds },
        type: 'INCOME',
        isRecurring: true,
        recurringFrequency: { not: null },
      },
    });

    // Calculate monthly income from recurring transactions
    const expectedMonthlyIncome = recurringIncomes.reduce((total, t) => {
      return total + this.getMonthlyAmount(t.amount, t.recurringFrequency!);
    }, 0);

    // Get monthly subscription costs
    const monthlySubscriptions = await this.subscriptionsService.getTotalMonthly(userId);

    // Get monthly credit payments
    const monthlyCredits = await this.creditsService.getTotalMonthlyPayments(userId);

    // Total fixed expenses
    const totalFixedExpenses = monthlySubscriptions + monthlyCredits;

    // Available budget
    const availableBudget = expectedMonthlyIncome - totalFixedExpenses;

    // Get current month's actual spending (non-recurring expenses)
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthTransactions = await this.prisma.transaction.findMany({
      where: {
        accountId: { in: accountIds },
        type: 'EXPENSE',
        date: { gte: monthStart, lte: monthEnd },
        isRecurring: false,
      },
    });

    const actualSpentThisMonth = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
    const remainingBudget = availableBudget - actualSpentThisMonth;

    return {
      expectedMonthlyIncome,
      fixedExpenses: {
        subscriptions: monthlySubscriptions,
        credits: monthlyCredits,
        total: totalFixedExpenses,
      },
      availableBudget,
      actualSpentThisMonth,
      remainingBudget,
      recurringIncomes: recurringIncomes.map((t) => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        frequency: t.recurringFrequency,
        monthlyAmount: this.getMonthlyAmount(t.amount, t.recurringFrequency!),
      })),
    };
  }

  /**
   * Get projected budget for future months
   * Shows expected balance, income, and expenses for the next X months
   */
  async getFutureProjection(userId: string, months: number = 6) {
    const now = new Date();
    const currentBalance = await this.accountsService.getTotalBalance(userId);

    // Get recurring incomes
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      select: { id: true },
    });
    const accountIds = accounts.map((a) => a.id);

    const recurringIncomes = await this.prisma.transaction.findMany({
      where: {
        accountId: { in: accountIds },
        type: 'INCOME',
        isRecurring: true,
        recurringFrequency: { not: null },
      },
    });

    const monthlyIncome = recurringIncomes.reduce((total, t) => {
      return total + this.getMonthlyAmount(t.amount, t.recurringFrequency!);
    }, 0);

    // Get monthly subscription costs
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId, isActive: true },
    });

    const monthlySubscriptions = subscriptions.reduce((total, sub) => {
      return total + this.getMonthlyAmount(sub.amount, sub.frequency);
    }, 0);

    // Get credits with remaining balance
    const credits = await this.prisma.credit.findMany({
      where: { userId, remainingAmount: { gt: 0 } },
    });

    const monthlyCredits = credits.reduce((total, credit) => total + credit.monthlyPayment, 0);

    // Build projection for each month
    const projection: Array<{
      month: string;
      monthLabel: string;
      expectedIncome: number;
      expectedExpenses: number;
      subscriptions: number;
      credits: number;
      netFlow: number;
      projectedBalance: number;
    }> = [];

    let runningBalance = currentBalance;

    for (let i = 0; i <= months; i++) {
      const targetDate = addMonths(now, i);
      const monthStart = startOfMonth(targetDate);
      const monthEnd = endOfMonth(targetDate);
      const monthKey = targetDate.toISOString().substring(0, 7);
      const monthLabel = targetDate.toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      });

      // For current month, get actual data
      if (i === 0) {
        const stats = await this.transactionsService.getStats(userId, monthStart, monthEnd);

        projection.push({
          month: monthKey,
          monthLabel,
          expectedIncome: stats.income,
          expectedExpenses: stats.expenses,
          subscriptions: monthlySubscriptions,
          credits: monthlyCredits,
          netFlow: stats.net,
          projectedBalance: currentBalance,
        });
      } else {
        // For future months, use projected values
        const totalExpenses = monthlySubscriptions + monthlyCredits;
        const netFlow = monthlyIncome - totalExpenses;
        runningBalance += netFlow;

        projection.push({
          month: monthKey,
          monthLabel,
          expectedIncome: monthlyIncome,
          expectedExpenses: totalExpenses,
          subscriptions: monthlySubscriptions,
          credits: monthlyCredits,
          netFlow,
          projectedBalance: runningBalance,
        });
      }
    }

    return {
      currentBalance,
      monthlyIncome,
      monthlyFixedExpenses: monthlySubscriptions + monthlyCredits,
      projection,
      recurringIncomes: recurringIncomes.map((t) => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        frequency: t.recurringFrequency,
        monthlyAmount: this.getMonthlyAmount(t.amount, t.recurringFrequency!),
      })),
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        name: s.name,
        amount: s.amount,
        frequency: s.frequency,
        monthlyAmount: this.getMonthlyAmount(s.amount, s.frequency),
        paymentDay: s.paymentDay,
      })),
      credits: credits.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        totalAmount: c.totalAmount,
        remainingAmount: c.remainingAmount,
        monthlyPayment: c.monthlyPayment,
        paymentDay: c.paymentDay,
      })),
    };
  }

  private getMonthlyAmount(amount: number, frequency: string): number {
    switch (frequency) {
      case 'DAILY':
        return amount * 30;
      case 'WEEKLY':
        return amount * 4.33;
      case 'BIWEEKLY':
        return amount * 2.17;
      case 'MONTHLY':
        return amount;
      case 'QUARTERLY':
        return amount / 3;
      case 'YEARLY':
        return amount / 12;
      default:
        return amount;
    }
  }

  private async getRecentTransactions(userId: string, limit: number) {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      select: { id: true },
    });
    const accountIds = accounts.map((a) => a.id);

    const transactions = await this.prisma.transaction.findMany({
      where: { accountId: { in: accountIds } },
      include: {
        account: true,
        category: true,
      },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      description: t.description,
      date: t.date.toISOString(),
      categoryName: t.category?.name,
      categoryColor: t.category?.color,
      accountName: t.account.name,
    }));
  }
}
