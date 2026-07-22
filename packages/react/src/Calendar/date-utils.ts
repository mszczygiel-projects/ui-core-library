/**
 * Internal date helpers for ui-calendar. All public dates are ISO `YYYY-MM-DD`
 * strings (interpreted in the local time zone); comparisons rely on ISO strings
 * being lexicographically ordered.
 */

export interface CalendarDay {
  iso: string;
  day: number;
  inMonth: boolean;
}

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseISODate(iso: string | undefined | null): Date | null {
  if (!iso) return null;
  const m = ISO_RE.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  // new Date() silently rolls invalid dates over (2026-02-31 → March 3) — reject those.
  return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d
    ? date
    : null;
}

export function toISODate(d: Date): string {
  const p = (n: number, l = 2) => String(n).padStart(l, '0');
  return `${p(d.getFullYear(), 4)}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDaysISO(iso: string, days: number): string | null {
  const d = parseISODate(iso);
  if (!d) return null;
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function addMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const i = year * 12 + (month - 1) + delta;
  return { year: Math.floor(i / 12), month: (((i % 12) + 12) % 12) + 1 };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** ISO weekday: 1 (Monday) … 7 (Sunday). */
export function isoWeekday(d: Date): number {
  return ((d.getDay() + 6) % 7) + 1;
}

/**
 * The locale's first day of week (ISO 1-7). Reads `Intl.Locale#weekInfo`
 * (property form) or `getWeekInfo()` (method form, Firefox); falls back to Monday.
 */
export function localeFirstDayOfWeek(locale: string): number {
  try {
    const l = new Intl.Locale(locale) as Intl.Locale & {
      weekInfo?: { firstDay: number };
      getWeekInfo?: () => { firstDay: number };
    };
    const info = l.weekInfo ?? l.getWeekInfo?.();
    if (info && info.firstDay >= 1 && info.firstDay <= 7) return info.firstDay;
  } catch {
    /* invalid locale tag — fall through to the default */
  }
  return 1;
}

/** Seven weekday labels starting from `firstDay`, formatted for the locale. */
export function weekdayLabels(locale: string, firstDay: number): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const labels: string[] = [];
  for (let i = 0; i < 7; i++) {
    const isoDay = ((firstDay - 1 + i) % 7) + 1;
    // 2024-01-01 is a Monday, so Jan 1 + (isoDay - 1) has weekday `isoDay`.
    labels.push(fmt.format(new Date(2024, 0, isoDay)));
  }
  return labels;
}

export function monthLabel(locale: string, year: number, month: number): string {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  );
}

export function dayLabel(locale: string, iso: string): string {
  const d = parseISODate(iso);
  return d ? new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(d) : iso;
}

/** Visible weeks of a month: full weeks padded with adjacent-month days. */
export function buildWeeks(year: number, month: number, firstDay: number): CalendarDay[][] {
  const first = new Date(year, month - 1, 1);
  const lead = (isoWeekday(first) - firstDay + 7) % 7;
  const cur = new Date(year, month - 1, 1 - lead);
  const weeks: CalendarDay[][] = [];
  do {
    const week: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      week.push({ iso: toISODate(cur), day: cur.getDate(), inMonth: cur.getMonth() === month - 1 });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  } while (cur.getMonth() === month - 1);
  return weeks;
}
