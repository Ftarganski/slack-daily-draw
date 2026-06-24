export const weekdays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'] as const;

export const weekdayLabels = [
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
] as const;

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

// Datas (segunda a sexta) da semana ISO codificada em "YYYY-Www".
export function weekDates(week: string): Date[] {
  const [yearStr, weekStr] = week.split('-W');
  const year = Number(yearStr);
  const weekNum = Number(weekStr);
  // Quinta-feira de jan/4 sempre cai na semana 1.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Dow = (jan4.getUTCDay() + 6) % 7; // Seg=0 … Dom=6
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Dow);
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (weekNum - 1) * 7);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    return d;
  });
}

export function formatDayMonth(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}
