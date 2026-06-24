export const weekdays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'] as const;

function dateInTimezone(tz: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .split('-')
    .map(Number);
  return { year: parts[0], month: parts[1], day: parts[2] };
}

export function currentWeekKey(tz: string): string {
  const { year, month, day } = dateInTimezone(tz);
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function todayIndex(tz: string): number {
  const { year, month, day } = dateInTimezone(tz);
  const dayNum = (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
  return dayNum <= 4 ? dayNum : -1;
}
