import { useMemo } from 'react';
import {
  Calendar,
  TrendingUp,
  CreditCard,
  Landmark,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { formatCurrency } from '@moneystack/shared';
import { clsx } from 'clsx';
import type { Subscription, Credit } from '@moneystack/shared';

interface RecurringIncome {
  id: string;
  description: string;
  amount: number;
  recurringFrequency?: string;
  paymentDay?: number;
}

interface MonthDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: Date;
  startingBalance: number;
  subscriptions: Subscription[];
  credits: Credit[];
  recurringIncomes: RecurringIncome[];
  onPreviousMonth?: () => void;
  onNextMonth?: () => void;
  hasPreviousMonth?: boolean;
  hasNextMonth?: boolean;
}

interface DayEvent {
  id: string;
  type: 'subscription' | 'credit' | 'income';
  name: string;
  amount: number;
  isExpense: boolean;
}

interface DayData {
  day: number;
  date: Date;
  events: DayEvent[];
  balanceAfter: number;
  isWeekend: boolean;
  isToday: boolean;
}

export function MonthDetailModal({
  isOpen,
  onClose,
  month,
  startingBalance,
  subscriptions,
  credits,
  recurringIncomes,
  onPreviousMonth,
  onNextMonth,
  hasPreviousMonth = true,
  hasNextMonth = true,
}: MonthDetailModalProps) {
  const monthName = month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // Calculate daily data for the month
  const dailyData = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const today = new Date();

    const days: DayData[] = [];
    let runningBalance = startingBalance;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      const events: DayEvent[] = [];

      // Add subscriptions for this day
      subscriptions.forEach((sub) => {
        if (sub.isActive && sub.paymentDay === day) {
          events.push({
            id: `sub-${sub.id}`,
            type: 'subscription',
            name: sub.name,
            amount: sub.amount,
            isExpense: true,
          });
          runningBalance -= sub.amount;
        }
      });

      // Add credits for this day
      credits.forEach((credit) => {
        if (credit.paymentDay === day) {
          events.push({
            id: `credit-${credit.id}`,
            type: 'credit',
            name: credit.name,
            amount: credit.monthlyPayment,
            isExpense: true,
          });
          runningBalance -= credit.monthlyPayment;
        }
      });

      // Add recurring incomes (assume they come on a specific day, default to 1st or 28th for salaries)
      recurringIncomes.forEach((income) => {
        // Default salary day to 28th if not specified
        const incomeDay = income.paymentDay || 28;
        if (incomeDay === day) {
          events.push({
            id: `income-${income.id}`,
            type: 'income',
            name: income.description,
            amount: income.amount,
            isExpense: false,
          });
          runningBalance += income.amount;
        }
      });

      days.push({
        day,
        date,
        events,
        balanceAfter: runningBalance,
        isWeekend,
        isToday,
      });
    }

    return days;
  }, [month, startingBalance, subscriptions, credits, recurringIncomes]);

  // Find min balance for the month
  const minBalance = useMemo(() => {
    let min = startingBalance;
    dailyData.forEach((day) => {
      if (day.balanceAfter < min) min = day.balanceAfter;
    });
    return min;
  }, [dailyData, startingBalance]);

  // Calculate totals
  const totals = useMemo(() => {
    let totalIncome = 0;
    let totalSubscriptions = 0;
    let totalCredits = 0;

    dailyData.forEach((day) => {
      day.events.forEach((event) => {
        if (event.type === 'income') {
          totalIncome += event.amount;
        } else if (event.type === 'subscription') {
          totalSubscriptions += event.amount;
        } else if (event.type === 'credit') {
          totalCredits += event.amount;
        }
      });
    });

    return {
      totalIncome,
      totalSubscriptions,
      totalCredits,
      totalExpenses: totalSubscriptions + totalCredits,
      netFlow: totalIncome - totalSubscriptions - totalCredits,
    };
  }, [dailyData]);

  const endingBalance = dailyData[dailyData.length - 1]?.balanceAfter || startingBalance;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
      <div className="space-y-4">
        {/* Header with month navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onPreviousMonth}
            disabled={!hasPreviousMonth}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              hasPreviousMonth ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-300 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h2 className="text-xl font-bold text-gray-900 capitalize flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary-600" />
            {monthName}
          </h2>

          <button
            onClick={onNextMonth}
            disabled={!hasNextMonth}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              hasNextMonth ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-300 cursor-not-allowed'
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Solde début</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(startingBalance)}</p>
          </div>
          <div className="bg-success-50 rounded-lg p-3">
            <p className="text-xs text-success-600">Revenus</p>
            <p className="text-lg font-bold text-success-600">+{formatCurrency(totals.totalIncome)}</p>
          </div>
          <div className="bg-danger-50 rounded-lg p-3">
            <p className="text-xs text-danger-500">Charges</p>
            <p className="text-lg font-bold text-danger-500">-{formatCurrency(totals.totalExpenses)}</p>
          </div>
          <div className={clsx('rounded-lg p-3', endingBalance >= 0 ? 'bg-primary-50' : 'bg-danger-50')}>
            <p className={clsx('text-xs', endingBalance >= 0 ? 'text-primary-600' : 'text-danger-500')}>
              Solde fin
            </p>
            <p className={clsx('text-lg font-bold', endingBalance >= 0 ? 'text-primary-600' : 'text-danger-500')}>
              {formatCurrency(endingBalance)}
            </p>
          </div>
        </div>

        {/* Daily timeline */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Évolution jour par jour</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-20">Jour</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Opérations</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 w-32">Solde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dailyData.map((day) => (
                  <tr
                    key={day.day}
                    className={clsx(
                      day.isToday && 'bg-primary-50',
                      day.isWeekend && !day.isToday && 'bg-gray-50/50',
                      day.events.length > 0 && !day.isToday && 'bg-amber-50/30'
                    )}
                  >
                    <td className="px-4 py-2">
                      <div className={clsx('text-sm font-medium', day.isToday ? 'text-primary-600' : 'text-gray-900')}>
                        {day.day.toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {day.date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {day.events.length > 0 ? (
                        <div className="space-y-1">
                          {day.events.map((event) => (
                            <div key={event.id} className="flex items-center gap-2 text-sm">
                              {event.type === 'income' ? (
                                <TrendingUp className="w-4 h-4 text-success-600 flex-shrink-0" />
                              ) : event.type === 'subscription' ? (
                                <CreditCard className="w-4 h-4 text-danger-500 flex-shrink-0" />
                              ) : (
                                <Landmark className="w-4 h-4 text-danger-500 flex-shrink-0" />
                              )}
                              <span className="text-gray-700 truncate">{event.name}</span>
                              <span
                                className={clsx(
                                  'ml-auto font-medium',
                                  event.isExpense ? 'text-danger-500' : 'text-success-600'
                                )}
                              >
                                {event.isExpense ? '-' : '+'}
                                {formatCurrency(event.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span
                        className={clsx(
                          'text-sm font-bold',
                          day.balanceAfter >= 0 ? 'text-gray-900' : 'text-danger-500'
                        )}
                      >
                        {formatCurrency(day.balanceAfter)}
                      </span>
                      {day.balanceAfter === minBalance && minBalance < startingBalance && (
                        <span className="ml-1 text-xs text-danger-500">↓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-success-600" />
            <span>Revenus ({formatCurrency(totals.totalIncome)})</span>
          </div>
          <div className="flex items-center gap-1">
            <CreditCard className="w-3 h-3 text-danger-500" />
            <span>Abonnements ({formatCurrency(totals.totalSubscriptions)})</span>
          </div>
          <div className="flex items-center gap-1">
            <Landmark className="w-3 h-3 text-danger-500" />
            <span>Crédits ({formatCurrency(totals.totalCredits)})</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
