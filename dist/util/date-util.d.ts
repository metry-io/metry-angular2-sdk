/**
  DateUtil
  --------

  This module provides helper function to create request periods from
  Javascript date objects.

  Typically, you use the getPeriod(dates, granularity) function, which in
  its turn calls an appropriate function, depending on the granularity.

  The dates parameter can be either a single date, which returns a single
  period (e.g. YYYYMMDD), or an array with two Dates (range), which returns
  a period range, (e.g. YYYYMM-YYYYMM)

  To parse a period into a date, use the getDate(period) function. This will
  return a Date with the provided period. Periods without months or days will
  have the missing value set to 1, i.e. getDate("2004") will return a the Date
  2014-01-01.
**/
export { getDate, getHourPeriod, getDayPeriod, getMonthPeriod, getPeriod, getYearPeriod, daysInMonth, parseISO, periodFromComponents };
declare function periodFromComponents(year: number, month?: number, day?: number, hour?: number): string;
declare function getYearPeriod(dates: Date | Array<Date>): string;
declare function getMonthPeriod(dates: Date | Array<Date>): string;
declare function getDayPeriod(dates: Date | Array<Date>): string;
declare function getHourPeriod(dates: Date | Array<Date>): string;
declare function getPeriod(dates: Date | Array<Date>, granularity: string, forced?: boolean): string;
declare function getDate(period: string | number): Date;
declare function daysInMonth(date: Date): number;
declare function parseISO(dateString: string): Date;
