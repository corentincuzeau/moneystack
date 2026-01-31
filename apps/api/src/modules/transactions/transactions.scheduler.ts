import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerService } from '../../common/services/logger.service';
import { RecurringFrequency } from '@prisma/client';
import { addDays, addMonths, addYears } from '@moneystack/shared';

@Injectable()
export class TransactionsScheduler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  // Run every hour to check for due recurring transactions
  @Cron(CronExpression.EVERY_HOUR)
  async processDueRecurringTransactions() {
    this.logger.log('Processing due recurring transactions...', 'TransactionsScheduler');

    const now = new Date();

    // Find all recurring transactions that are due for a new occurrence
    // We look for parent transactions that are recurring and check their last child
    const recurringTransactions = await this.prisma.transaction.findMany({
      where: {
        isRecurring: true,
        recurringFrequency: { not: null },
        OR: [
          { recurringEndDate: null },
          { recurringEndDate: { gte: now } },
        ],
      },
      include: {
        account: true,
        category: true,
        childTransactions: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    this.logger.log(
      `Found ${recurringTransactions.length} recurring transaction(s) to check`,
      'TransactionsScheduler',
    );

    for (const transaction of recurringTransactions) {
      try {
        const lastOccurrence = transaction.childTransactions[0]?.date || transaction.date;
        const nextDueDate = this.getNextPaymentDate(
          lastOccurrence,
          transaction.recurringFrequency!,
        );

        // If next due date is in the past or today, create new occurrence
        if (nextDueDate <= now) {
          await this.createRecurringOccurrence(transaction, nextDueDate);
          this.logger.log(
            `Created recurring transaction: ${transaction.description} (${transaction.id})`,
            'TransactionsScheduler',
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to process recurring transaction ${transaction.description}: ${error.message}`,
          error.stack,
          'TransactionsScheduler',
        );
      }
    }

    this.logger.log('Finished processing recurring transactions', 'TransactionsScheduler');
  }

  private async createRecurringOccurrence(parentTransaction: any, date: Date) {
    await this.prisma.$transaction(async (tx) => {
      // Create new transaction as child of the recurring parent
      await tx.transaction.create({
        data: {
          accountId: parentTransaction.accountId,
          categoryId: parentTransaction.categoryId,
          amount: parentTransaction.amount,
          type: parentTransaction.type,
          description: parentTransaction.description,
          date: date,
          isRecurring: false,
          parentTransactionId: parentTransaction.id,
          tags: parentTransaction.tags,
        },
      });

      // Update account balance
      const balanceChange = parentTransaction.type === 'INCOME'
        ? parentTransaction.amount
        : -parentTransaction.amount;

      await tx.account.update({
        where: { id: parentTransaction.accountId },
        data: { balance: { increment: balanceChange } },
      });
    });
  }

  private getNextPaymentDate(currentDate: Date, frequency: RecurringFrequency): Date {
    switch (frequency) {
      case 'DAILY':
        return addDays(currentDate, 1);
      case 'WEEKLY':
        return addDays(currentDate, 7);
      case 'BIWEEKLY':
        return addDays(currentDate, 14);
      case 'MONTHLY':
        return addMonths(currentDate, 1);
      case 'QUARTERLY':
        return addMonths(currentDate, 3);
      case 'YEARLY':
        return addYears(currentDate, 1);
      default:
        return addMonths(currentDate, 1);
    }
  }
}
