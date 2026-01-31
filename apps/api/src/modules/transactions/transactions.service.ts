import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AccountsService } from '../accounts/accounts.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionFiltersDto } from './dto/transaction-filters.dto';
import { Transaction, Prisma } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
  ) {}

  async create(userId: string, dto: CreateTransactionDto): Promise<Transaction> {
    // Verify account belongs to user
    await this.accountsService.findOne(dto.accountId, userId);

    // If category is provided, verify it belongs to user or is default
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category || (category.userId && category.userId !== userId)) {
        throw new BadRequestException('Invalid category');
      }
    }

    const transaction = await this.prisma.$transaction(async (tx) => {
      // Create transaction
      const newTransaction = await tx.transaction.create({
        data: {
          accountId: dto.accountId,
          categoryId: dto.categoryId,
          amount: dto.amount,
          type: dto.type,
          description: dto.description,
          date: new Date(dto.date),
          isRecurring: dto.isRecurring || false,
          recurringFrequency: dto.recurringFrequency,
          recurringEndDate: dto.recurringEndDate ? new Date(dto.recurringEndDate) : null,
          tags: dto.tags || [],
        },
        include: {
          account: true,
          category: true,
        },
      });

      // Update account balance
      const balanceChange = dto.type === 'INCOME' ? dto.amount : -dto.amount;
      await tx.account.update({
        where: { id: dto.accountId },
        data: { balance: { increment: balanceChange } },
      });

      return newTransaction;
    });

    return transaction;
  }

  async findAll(userId: string, filters: TransactionFiltersDto) {
    // Get user's account IDs
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      select: { id: true },
    });
    const accountIds = accounts.map((a) => a.id);

    const where: Prisma.TransactionWhereInput = {
      accountId: { in: accountIds },
    };

    if (filters.accountId) {
      where.accountId = filters.accountId;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }

    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.amount = {};
      if (filters.minAmount !== undefined) {
        where.amount.gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        where.amount.lte = filters.maxAmount;
      }
    }

    if (filters.search) {
      where.description = { contains: filters.search, mode: 'insensitive' };
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters.isRecurring !== undefined) {
      where.isRecurring = filters.isRecurring;
    }

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          account: true,
          category: true,
          toAccount: true,
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        account: true,
        category: true,
        toAccount: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Verify ownership through account
    const account = await this.prisma.account.findUnique({
      where: { id: transaction.accountId },
    });

    if (!account || account.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return transaction;
  }

  async update(id: string, userId: string, dto: UpdateTransactionDto): Promise<Transaction> {
    const existingTransaction = await this.findOne(id, userId);

    return this.prisma.$transaction(async (tx) => {
      // Reverse old balance change
      const oldBalanceChange = existingTransaction.type === 'INCOME'
        ? -existingTransaction.amount
        : existingTransaction.amount;

      await tx.account.update({
        where: { id: existingTransaction.accountId },
        data: { balance: { increment: oldBalanceChange } },
      });

      // If account changed, verify new account
      if (dto.accountId && dto.accountId !== existingTransaction.accountId) {
        await this.accountsService.findOne(dto.accountId, userId);
      }

      // Update transaction
      const updated = await tx.transaction.update({
        where: { id },
        data: {
          ...dto,
          date: dto.date ? new Date(dto.date) : undefined,
        },
        include: {
          account: true,
          category: true,
        },
      });

      // Apply new balance change
      const newBalanceChange = updated.type === 'INCOME' ? updated.amount : -updated.amount;
      await tx.account.update({
        where: { id: updated.accountId },
        data: { balance: { increment: newBalanceChange } },
      });

      return updated;
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const transaction = await this.findOne(id, userId);

    await this.prisma.$transaction(async (tx) => {
      // Reverse balance change
      const balanceChange = transaction.type === 'INCOME'
        ? -transaction.amount
        : transaction.amount;

      await tx.account.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: balanceChange } },
      });

      await tx.transaction.delete({ where: { id } });
    });
  }

  async getStats(userId: string, startDate: Date, endDate: Date) {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      select: { id: true },
    });
    const accountIds = accounts.map((a) => a.id);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        accountId: { in: accountIds },
        date: { gte: startDate, lte: endDate },
        type: { not: 'TRANSFER' },
      },
      include: { category: true },
    });

    const income = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const byCategory = transactions.reduce((acc, t) => {
      const categoryName = t.category?.name || 'Sans catégorie';
      if (!acc[categoryName]) {
        acc[categoryName] = { income: 0, expense: 0 };
      }
      if (t.type === 'INCOME') {
        acc[categoryName].income += t.amount;
      } else {
        acc[categoryName].expense += t.amount;
      }
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);

    return {
      income,
      expenses,
      net: income - expenses,
      byCategory: Object.entries(byCategory).map(([name, values]) => ({
        name,
        ...values,
      })),
    };
  }
}
