import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AccountsService } from '../accounts/accounts.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import { UpdateCreditDto } from './dto/update-credit.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { Credit } from '@prisma/client';
import { addDays } from '@moneystack/shared';

@Injectable()
export class CreditsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
  ) {}

  async create(userId: string, dto: CreateCreditDto): Promise<Credit> {
    await this.accountsService.findOne(dto.accountId, userId);

    const startDate = new Date(dto.startDate);
    const now = new Date();

    // Calculate remaining amount based on payments already made if start date is in the past
    let remainingAmount = dto.remainingAmount ?? dto.totalAmount;
    if (!dto.remainingAmount && startDate < now) {
      remainingAmount = this.calculateRemainingAmount(
        dto.totalAmount,
        dto.monthlyPayment,
        dto.interestRate,
        startDate,
        dto.paymentDay || 1,
      );
    }

    const credit = await this.prisma.credit.create({
      data: {
        ...dto,
        remainingAmount,
        userId,
        startDate,
        endDate: new Date(dto.endDate),
      },
      include: {
        account: true,
      },
    });

    // Generate payment schedule
    await this.generatePaymentSchedule(credit);

    return credit;
  }

  private calculateRemainingAmount(
    totalAmount: number,
    monthlyPayment: number,
    interestRate: number,
    startDate: Date,
    paymentDay: number,
  ): number {
    const monthlyRate = interestRate / 100 / 12;
    let remainingBalance = totalAmount;
    const now = new Date();

    let currentDate = new Date(startDate);
    currentDate.setDate(paymentDay);

    // Count payments that should have been made
    while (currentDate < now && remainingBalance > 0) {
      const interest = remainingBalance * monthlyRate;
      const principal = Math.min(monthlyPayment - interest, remainingBalance);
      remainingBalance -= principal;
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return Math.max(0, remainingBalance);
  }

  async findAll(userId: string): Promise<Credit[]> {
    return this.prisma.credit.findMany({
      where: { userId },
      include: {
        account: true,
        payments: {
          orderBy: { paymentDate: 'asc' },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string): Promise<Credit> {
    const credit = await this.prisma.credit.findUnique({
      where: { id },
      include: {
        account: true,
        payments: {
          orderBy: { paymentDate: 'asc' },
        },
      },
    });

    if (!credit) {
      throw new NotFoundException('Credit not found');
    }

    if (credit.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return credit;
  }

  async update(id: string, userId: string, dto: UpdateCreditDto): Promise<Credit> {
    const existingCredit = await this.findOne(id, userId);

    if (dto.accountId) {
      await this.accountsService.findOne(dto.accountId, userId);
    }

    // Prepare update data with proper date conversion
    const updateData: Record<string, unknown> = { ...dto };
    if (dto.startDate) {
      updateData.startDate = new Date(dto.startDate);
    }
    if (dto.endDate) {
      updateData.endDate = new Date(dto.endDate);
    }

    // Recalculate remaining amount if relevant fields changed
    const shouldRecalculate =
      dto.totalAmount !== undefined ||
      dto.monthlyPayment !== undefined ||
      dto.interestRate !== undefined ||
      dto.startDate !== undefined ||
      dto.paymentDay !== undefined;

    if (shouldRecalculate) {
      const totalAmount = dto.totalAmount ?? existingCredit.totalAmount;
      const monthlyPayment = dto.monthlyPayment ?? existingCredit.monthlyPayment;
      const interestRate = dto.interestRate ?? existingCredit.interestRate;
      const startDate = dto.startDate ? new Date(dto.startDate) : existingCredit.startDate;
      const paymentDay = dto.paymentDay ?? existingCredit.paymentDay;

      updateData.remainingAmount = this.calculateRemainingAmount(
        totalAmount,
        monthlyPayment,
        interestRate,
        startDate,
        paymentDay,
      );
    }

    return this.prisma.credit.update({
      where: { id },
      data: updateData,
      include: {
        account: true,
      },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.prisma.credit.delete({ where: { id } });
  }

  async recordPayment(id: string, userId: string, dto: RecordPaymentDto) {
    const credit = await this.findOne(id, userId);

    return this.prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.creditPayment.create({
        data: {
          creditId: id,
          amount: dto.amount,
          principal: dto.principal,
          interest: dto.interest,
          remainingBalance: credit.remainingAmount - dto.principal,
          paymentDate: new Date(dto.paymentDate),
          isPaid: true,
        },
      });

      // Update credit remaining amount
      await tx.credit.update({
        where: { id },
        data: {
          remainingAmount: { decrement: dto.principal },
        },
      });

      // Create transaction for the payment
      await tx.transaction.create({
        data: {
          accountId: credit.accountId,
          amount: dto.amount,
          type: 'EXPENSE',
          description: `Échéance crédit: ${credit.name}`,
          date: new Date(dto.paymentDate),
        },
      });

      // Update account balance
      await tx.account.update({
        where: { id: credit.accountId },
        data: { balance: { decrement: dto.amount } },
      });

      return payment;
    });
  }

  async getUpcomingPayments(userId: string, days: number = 30) {
    const credits = await this.prisma.credit.findMany({
      where: { userId },
      include: {
        payments: {
          where: {
            isPaid: false,
            paymentDate: {
              lte: addDays(new Date(), days),
            },
          },
          orderBy: { paymentDate: 'asc' },
        },
        account: true,
      },
    });

    return credits.flatMap((credit) =>
      credit.payments.map((payment) => ({
        ...payment,
        creditName: credit.name,
        creditType: credit.type,
        accountName: credit.account.name,
      })),
    ).sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime());
  }

  async getTotalMonthlyPayments(userId: string): Promise<number> {
    const credits = await this.prisma.credit.findMany({
      where: { userId, remainingAmount: { gt: 0 } },
    });

    return credits.reduce((total, credit) => total + credit.monthlyPayment, 0);
  }

  async getTotalRemainingDebt(userId: string): Promise<number> {
    const result = await this.prisma.credit.aggregate({
      where: { userId },
      _sum: { remainingAmount: true },
    });

    return result._sum.remainingAmount || 0;
  }

  private async generatePaymentSchedule(credit: Credit): Promise<void> {
    const payments: Array<{
      creditId: string;
      amount: number;
      principal: number;
      interest: number;
      remainingBalance: number;
      paymentDate: Date;
      isPaid: boolean;
    }> = [];

    const now = new Date();
    let remainingBalance = credit.totalAmount;
    const monthlyRate = credit.interestRate / 100 / 12;
    let currentDate = new Date(credit.startDate);
    currentDate.setDate(credit.paymentDay);

    while (remainingBalance > 0 && currentDate <= credit.endDate) {
      const interest = remainingBalance * monthlyRate;
      const principal = Math.min(credit.monthlyPayment - interest, remainingBalance);
      remainingBalance -= principal;

      // Mark past payments as already paid
      const isPaid = currentDate < now;

      payments.push({
        creditId: credit.id,
        amount: credit.monthlyPayment,
        principal,
        interest,
        remainingBalance: Math.max(0, remainingBalance),
        paymentDate: new Date(currentDate),
        isPaid,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    await this.prisma.creditPayment.createMany({
      data: payments,
    });
  }
}
