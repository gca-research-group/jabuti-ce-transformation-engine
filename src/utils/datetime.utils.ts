import { type ParserRuleContext } from 'antlr4ts';
import { ValidationError } from '../validators';

/**
 * Determines if a given year is a leap year.
 * @param year The year to check.
 * @returns True if the year is a leap year, false otherwise.
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Gets the number of days in a given month of a given year.
 * @param year The year.
 * @param month The month (1 = January, 2 = February, ..., 12 = December).
 * @returns The number of days in the month.
 */
export function getDaysInMonth(year: number, month: number, ctx: ParserRuleContext): number {
  switch (month) {
    case 1: // January
    case 3: // March
    case 5: // May
    case 7: // July
    case 8: // August
    case 10: // October
    case 12: // December
      return 31;
    case 4: // April
    case 6: // June
    case 9: // September
    case 11: // November
      return 30;
    case 2: // February
      return isLeapYear(year) ? 29 : 28;
    default:
      throw new ValidationError('Invalid month', ctx);
  }
}

export function string2Date(data: string, ctx: ParserRuleContext) {
  const pattern = /^(\d{4})-(\d{2})-(\d{2})(?:(\d{2}):(\d{2})(?::(\d{2}))?)?$/;

  const match = data.match(pattern);

  if (!match) {
    throw new ValidationError('Invalid date', ctx);
  }

  const [, year, month, day, hour, minute, second] = match;

  return new Date(+year, +month - 1, +day, +(hour ?? 0), +(minute ?? 0), +(second ?? 0));
}
