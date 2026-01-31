export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidAmount(amount: number): boolean {
  return typeof amount === 'number' && !isNaN(amount) && isFinite(amount) && amount >= 0;
}

export function isPositiveNumber(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value) && value > 0;
}

export function isValidPercentage(value: number): boolean {
  return isValidAmount(value) && value >= 0 && value <= 100;
}

export function isValidHexColor(color: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}

export function isValidDateString(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export function isFutureDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d > new Date();
}

export function isPastDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
}

export function isNotEmpty(value: string | undefined | null): boolean {
  return value !== undefined && value !== null && value.trim().length > 0;
}

export function isWithinRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

export function sanitizeString(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function truncateString(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return value.substring(0, maxLength - 3) + '...';
}
