import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerService } from '../../common/services/logger.service';

@Injectable()
export class CreditsScheduler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  // Run every hour to check for due credit payments
  @Cron(CronExpression.EVERY_HOUR)
  async processDueCreditPayments() {
    this.logger.log('Processing due credit payments...', 'CreditsScheduler');

    const now = new Date();

    // Find all unpaid credit payments that are due
    const duePayments = await this.prisma.creditPayment.findMany({
      where: {
        isPaid: false,
        paymentDate: {
          lte: now,
        },
      },
      include: {
        credit: {
          include: {
            account: true,
            user: true,
          },
        },
      },
    });

    this.logger.log(
      `Found ${duePayments.length} due credit payment(s)`,
      'CreditsScheduler',
    );

    for (const payment of duePayments) {
      try {
        await this.processCreditPayment(payment);
        this.logger.log(
          `Processed credit payment for: ${payment.credit.name} (${payment.id})`,
          'CreditsScheduler',
        );
      } catch (error) {
        this.logger.error(
          `Failed to process credit payment ${payment.credit.name}: ${error.message}`,
          error.stack,
          'CreditsScheduler',
        );
      }
    }

    this.logger.log('Finished processing credit payments', 'CreditsScheduler');
  }

  private async processCreditPayment(payment: any) {
    await this.prisma.$transaction(async (tx) => {
      // Mark payment as paid
      await tx.creditPayment.update({
        where: { id: payment.id },
        data: { isPaid: true },
      });

      // Update credit remaining amount
      await tx.credit.update({
        where: { id: payment.creditId },
        data: {
          remainingAmount: { decrement: payment.principal },
        },
      });

      // Create transaction for the payment
      await tx.transaction.create({
        data: {
          accountId: payment.credit.accountId,
          amount: payment.amount,
          type: 'EXPENSE',
          description: `Échéance crédit: ${payment.credit.name}`,
          date: new Date(),
          isRecurring: false,
        },
      });

      // Update account balance
      await tx.account.update({
        where: { id: payment.credit.accountId },
        data: { balance: { decrement: payment.amount } },
      });
    });
  }
}
