import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { TransferDto } from './dto/transfer.dto';
import { Account } from '@prisma/client';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAccountDto): Promise<Account> {
    // If this is the first account or marked as default, handle default logic
    if (dto.isDefault) {
      await this.prisma.account.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.account.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async findAll(userId: string): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string, userId: string): Promise<Account> {
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return account;
  }

  async update(id: string, userId: string, dto: UpdateAccountDto): Promise<Account> {
    await this.findOne(id, userId);

    if (dto.isDefault) {
      await this.prisma.account.updateMany({
        where: { userId, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.account.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const account = await this.findOne(id, userId);

    // Check if it's the only account
    const accountCount = await this.prisma.account.count({
      where: { userId },
    });

    if (accountCount === 1) {
      throw new BadRequestException('Cannot delete the only account');
    }

    // If deleting default account, set another as default
    if (account.isDefault) {
      const nextAccount = await this.prisma.account.findFirst({
        where: { userId, NOT: { id } },
        orderBy: { createdAt: 'asc' },
      });

      if (nextAccount) {
        await this.prisma.account.update({
          where: { id: nextAccount.id },
          data: { isDefault: true },
        });
      }
    }

    await this.prisma.account.delete({
      where: { id },
    });
  }

  async transfer(userId: string, dto: TransferDto): Promise<{ fromAccount: Account; toAccount: Account }> {
    const fromAccount = await this.findOne(dto.fromAccountId, userId);
    const toAccount = await this.findOne(dto.toAccountId, userId);

    if (fromAccount.id === toAccount.id) {
      throw new BadRequestException('Cannot transfer to the same account');
    }

    if (fromAccount.balance < dto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Deduct from source account
      const updatedFromAccount = await tx.account.update({
        where: { id: fromAccount.id },
        data: { balance: { decrement: dto.amount } },
      });

      // Add to destination account
      const updatedToAccount = await tx.account.update({
        where: { id: toAccount.id },
        data: { balance: { increment: dto.amount } },
      });

      // Create transfer transaction
      await tx.transaction.create({
        data: {
          accountId: fromAccount.id,
          toAccountId: toAccount.id,
          amount: dto.amount,
          type: 'TRANSFER',
          description: dto.description || `Transfert vers ${toAccount.name}`,
          date: dto.date ? new Date(dto.date) : new Date(),
        },
      });

      return { fromAccount: updatedFromAccount, toAccount: updatedToAccount };
    });

    return result;
  }

  async updateBalance(id: string, amount: number): Promise<Account> {
    return this.prisma.account.update({
      where: { id },
      data: { balance: { increment: amount } },
    });
  }

  async getTotalBalance(userId: string): Promise<number> {
    const result = await this.prisma.account.aggregate({
      where: { userId },
      _sum: { balance: true },
    });

    return result._sum.balance || 0;
  }

  async getBalancesByType(userId: string) {
    const accounts = await this.prisma.account.groupBy({
      by: ['type'],
      where: { userId },
      _sum: { balance: true },
    });

    return accounts.map((a) => ({
      type: a.type,
      balance: a._sum.balance || 0,
    }));
  }
}
