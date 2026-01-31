import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerService } from '../../common/services/logger.service';
import { RecurringFrequency } from '@prisma/client';
import { addDays, addMonths, addYears } from '@moneystack/shared';

@Injectable()
export class SubscriptionsScheduler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  // Run every hour to check for due subscriptions
  @Cron(CronExpression.EVERY_HOUR)
  async processDueSubscriptions() {
    this.logger.log('Processing due subscriptions...', 'SubscriptionsScheduler');

    const now = new Date();

    // Find all active subscriptions that are due
    const dueSubscriptions = await this.prisma.subscription.findMany({
      where: {
        isActive: true,
        nextPaymentDate: {
          lte: now,
        },
      },
      include: {
        account: true,
        category: true,
        user: true,
      },
    });

    this.logger.log(
      `Found ${dueSubscriptions.length} due subscription(s)`,
      'SubscriptionsScheduler',
    );

    for (const subscription of dueSubscriptions) {
      try {
        await this.processSubscriptionPayment(subscription);
        this.logger.log(
          `Processed payment for subscription: ${subscription.name} (${subscription.id})`,
          'SubscriptionsScheduler',
        );
      } catch (error) {
        this.logger.error(
          `Failed to process subscription ${subscription.name}: ${error.message}`,
          error.stack,
          'SubscriptionsScheduler',
        );
      }
    }

    this.logger.log('Finished processing due subscriptions', 'SubscriptionsScheduler');
  }

  private async processSubscriptionPayment(subscription: any) {
    await this.prisma.$transaction(async (tx) => {
      // Create transaction for the payment
      await tx.transaction.create({
        data: {
          accountId: subscription.accountId,
          categoryId: subscription.categoryId,
          amount: subscription.amount,
          type: 'EXPENSE',
          description: `Abonnement: ${subscription.name}`,
          date: new Date(),
          isRecurring: true,
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

      // Update subscription with next payment date
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          nextPaymentDate: nextDate,
        },
      });
    });
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
    // Get the last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    // Use the minimum between paymentDay and last day of month
    const day = Math.min(paymentDay, lastDayOfMonth);
    return new Date(year, month, day, date.getHours(), date.getMinutes(), date.getSeconds());
  }
}
