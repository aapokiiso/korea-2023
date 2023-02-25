import { formatInTimeZone } from 'date-fns-tz'

export const formatInDisplayTimeZone = (date: Date | string | number, format: string): string =>
  formatInTimeZone(date, process.env.NEXT_PUBLIC_DISPLAY_TIMEZONE || 'UTC', format)

export const getDateTitle = (date: Date | string | number): string =>
  formatInTimeZone(date, 'UTC', 'E, MMM d')
