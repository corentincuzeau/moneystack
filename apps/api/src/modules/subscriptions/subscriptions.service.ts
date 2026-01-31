import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AccountsService } from '../accounts/accounts.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { Subscription, RecurringFrequency } from '@prisma/client';
import { addDays, addMonths, addYears } from '@moneystack/shared';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
  ) {}

  async create(userId: string, dto: CreateSubscriptionDto): Promise<Subscription> {
    await this.accountsService.findOne(dto.accountId, userId);

    // Calculate next payment date from paymentDay
    const nextPaymentDate = this.calculateNextPaymentDateFromDay(dto.paymentDay);

    return this.prisma.subscription.create({
      data: {
        ...dto,
        userId,
        nextPaymentDate,
      },
      include: {
        account: true,
        category: true,
      },
    });
  }

  async findAll(userId: string): Promise<Subscription[]> {
    return this.prisma.subscription.findMany({
      where: { userId },
      include: {
        account: true,
        category: true,
      },
      orderBy: { nextPaymentDate: 'asc' },
    });
  }

  async findUpcoming(userId: string, days: number = 30): Promise<Subscription[]> {
    const endDate = addDays(new Date(), days);

    return this.prisma.subscription.findMany({
      where: {
        userId,
        isActive: true,
        nextPaymentDate: {
          lte: endDate,
        },
      },
      include: {
        account: true,
        category: true,
      },
      orderBy: { nextPaymentDate: 'asc' },
    });
  }

  async findOne(id: string, userId: string): Promise<Subscription> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        account: true,
        category: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return subscription;
  }

  async update(id: string, userId: string, dto: UpdateSubscriptionDto): Promise<Subscription> {
    await this.findOne(id, userId);

    if (dto.accountId) {
      await this.accountsService.findOne(dto.accountId, userId);
    }

    // If paymentDay is changed, recalculate nextPaymentDate
    const nextPaymentDate = dto.paymentDay
      ? this.calculateNextPaymentDateFromDay(dto.paymentDay)
      : undefined;

    return this.prisma.subscription.update({
      where: { id },
      data: {
        ...dto,
        nextPaymentDate,
      },
      include: {
        account: true,
        category: true,
      },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.prisma.subscription.delete({ where: { id } });
  }

  async processPayment(id: string, userId: string): Promise<Subscription> {
    const subscription = await this.findOne(id, userId);

    return this.prisma.$transaction(async (tx) => {
      // Create transaction for the payment
      await tx.transaction.create({
        data: {
          accountId: subscription.accountId,
          categoryId: subscription.categoryId,
          amount: subscription.amount,
          type: 'EXPENSE',
          description: `Abonnement: ${subscription.name}`,
          date: new Date(),
        },
      });

      // Update account balance
      await tx.account.update({
        where: { id: subscription.accountId },
        data: { balance: { decrement: subscription.amount } },
      });

      // Calculate next payment date
      const nextDate = this.getNextPaymentDate(
        subscription.nextPaymentDate,
        subscription.frequency,
        subscription.paymentDay,
      );

      // Update subscription
      return tx.subscription.update({
        where: { id },
        data: {
          nextPaymentDate: nextDate,
        },
        include: {
          account: true,
          category: true,
        },
      });
    });
  }

  async getTotalMonthly(userId: string): Promise<number> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId, isActive: true },
    });

    return subscriptions.reduce((total, sub) => {
      return total + this.getMonthlyAmount(sub.amount, sub.frequency);
    }, 0);
  }

  /**
   * Calculate the next payment date based on the payment day.
   * If the payment day has already passed this month, use next month.
   * Handles months with different number of days (e.g., February).
   */
  private calculateNextPaymentDateFromDay(paymentDay: number): Date {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    // Determine target month
    let targetMonth = currentMonth;
    let targetYear = currentYear;

    // If payment day has passed this month, go to next month
    if (currentDay > paymentDay) {
      targetMonth += 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear += 1;
      }
    }

    // Get the last day of the target month
    const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    // Use the minimum between paymentDay and last day of month
    const day = Math.min(paymentDay, lastDayOfMonth);

    return new Date(targetYear, targetMonth, day, 12, 0, 0);
  }

  private getNextPaymentDate(
    currentDate: Date,
    frequency: RecurringFrequency,
    paymentDay?: number,
  ): Date {
    let nextDate: Date;

    switch (frequency) {
      case 'DAILY':
        return addDays(currentDate, 1);
      case 'WEEKLY':
        return addDays(currentDate, 7);
      case 'BIWEEKLY':
        return addDays(currentDate, 14);
      case 'MONTHLY':
        nextDate = addMonths(currentDate, 1);
        if (paymentDay) {
          nextDate = this.setPaymentDay(nextDate, paymentDay);
        }
        return nextDate;
      case 'QUARTERLY':
        nextDate = addMonths(currentDate, 3);
        if (paymentDay) {
          nextDate = this.setPaymentDay(nextDate, paymentDay);
        }
        return nextDate;
      case 'YEARLY':
        nextDate = addYears(currentDate, 1);
        if (paymentDay) {
          nextDate = this.setPaymentDay(nextDate, paymentDay);
        }
        return nextDate;
      default:
        return addMonths(currentDate, 1);
    }
  }

  private setPaymentDay(date: Date, paymentDay: number): Date {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const day = Math.min(paymentDay, lastDayOfMonth);
    return new Date(year, month, day, date.getHours(), date.getMinutes(), date.getSeconds());
  }

  private getMonthlyAmount(amount: number, frequency: RecurringFrequency): number {
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
}
