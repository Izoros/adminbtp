const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateOnly(value: string): Date {
  if (!datePattern.test(value)) {
    throw new Error(`Date OPC invalide: ${value}`);
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`Date OPC invalide: ${value}`);
  }

  return parsed;
}

export function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function addCalendarDays(value: string, days: number): string {
  const date = parseDateOnly(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateOnly(date);
}

export function differenceInCalendarDays(
  later: string,
  earlier: string,
): number {
  return Math.round(
    (parseDateOnly(later).getTime() - parseDateOnly(earlier).getTime()) /
      86_400_000,
  );
}

export function dateRangesOverlap(
  leftStart: string,
  leftEnd: string,
  rightStart: string,
  rightEnd: string,
): boolean {
  return leftStart <= rightEnd && rightStart <= leftEnd;
}
