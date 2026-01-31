import { RecurringFrequency } from '../types/enums.js';

export function formatDate(date: Date | string, locale: string = 'fr-FR'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateShort(date: Date | string, locale: string = 'fr-FR'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string, locale: string = 'fr-FR'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

export function endOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

export function getNextRecurringDate(
  currentDate: Date,
  frequency: RecurringFrequency,
): Date {
  switch (frequency) {
    case RecurringFrequency.DAILY:
      return addDays(currentDate, 1);
    case RecurringFrequency.WEEKLY:
      return addDays(currentDate, 7);
    case RecurringFrequency.BIWEEKLY:
      return addDays(currentDate, 14);
    case RecurringFrequency.MONTHLY:
      return addMonths(currentDate, 1);
    case RecurringFrequency.QUARTERLY:
      return addMonths(currentDate, 3);
    case RecurringFrequency.YEARLY:
      return addYears(currentDate, 1);
    default:
      return currentDate;
  }
}

export function getDaysUntil(date: Date | string): number {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const today = startOfDay(new Date());
  const target = startOfDay(targetDate);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isOverdue(date: Date | string): boolean {
  return getDaysUntil(date) < 0;
}

export function getMonthName(month: number, locale: string = 'fr-FR'): string {
  const date = new Date(2000, month, 1);
  return date.toLocaleDateString(locale, { month: 'long' });
}

export function getMonthsInRange(startDate: Date, endDate: Date): string[] {
  const months: string[] = [];
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (current <= end) {
    months.push(toISODateString(current).substring(0, 7));
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}
