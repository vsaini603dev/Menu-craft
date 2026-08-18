// Simple Monday-start week helpers. Not strictly ISO-8601 week numbering,
// just a consistent way to key a 7-day plan.

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun ... 6 = Sat
  const diff = (day === 0 ? -6 : 1) - day; // shift back to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateId(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getWeekId(date: Date = new Date()): string {
  return formatDateId(startOfWeek(date));
}

export function getWeekDates(weekId: string): Date[] {
  const start = new Date(`${weekId}T00:00:00`);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Shift a weekId forward/back by whole weeks — used for prev/next navigation.
export function addWeeks(weekId: string, delta: number): string {
  const start = new Date(`${weekId}T00:00:00`);
  start.setDate(start.getDate() + delta * 7);
  return formatDateId(start);
}

// Short human label for a week's date range, e.g. "Aug 10 – Aug 16" (adds the
// year only when it differs from this year, to stay compact in the header).
export function formatWeekRangeLabel(weekId: string): string {
  const dates = getWeekDates(weekId);
  const start = dates[0];
  const end = dates[6];
  const thisYear = new Date().getFullYear();

  const startLabel = `${MONTH_LABELS[start.getMonth()]} ${start.getDate()}`;
  const endLabel = `${MONTH_LABELS[end.getMonth()]} ${end.getDate()}`;
  const yearSuffix = end.getFullYear() !== thisYear ? `, ${end.getFullYear()}` : '';

  return `${startLabel} – ${endLabel}${yearSuffix}`;
}

export function isCurrentWeek(weekId: string): boolean {
  return weekId === getWeekId();
}
