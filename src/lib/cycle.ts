export interface CycleDays {
  daysElapsed: number;
  daysRemaining: number;
  totalDays: number;
}

export function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function computeCycleContaining(date: Date): { start: Date; end: Date } {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  let start: Date;
  let end: Date;
  if (d.getDate() >= 15) {
    start = new Date(d.getFullYear(), d.getMonth(), 15);
    end = new Date(d.getFullYear(), d.getMonth() + 1, 15);
  } else {
    start = new Date(d.getFullYear(), d.getMonth() - 1, 15);
    end = new Date(d.getFullYear(), d.getMonth(), 15);
  }
  return { start, end };
}

export function shiftCycle(
  cycleStart: string,
  cycleEnd: string,
  deltaMonths: number,
): { start: string; end: string } | null {
  if (!cycleStart || !cycleEnd) return null;
  const start = new Date(cycleStart + 'T00:00:00');
  const end = new Date(cycleEnd + 'T00:00:00');
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  const newStart = new Date(start.getFullYear(), start.getMonth() + deltaMonths, 15);
  const newEnd = new Date(end.getFullYear(), end.getMonth() + deltaMonths, 15);
  return { start: formatYMD(newStart), end: formatYMD(newEnd) };
}

export function daysBetweenExclusive(
  start: string,
  end: string,
  todayInput?: Date,
): CycleDays {
  if (!start || !end) return { daysElapsed: 0, daysRemaining: 0, totalDays: 0 };
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
    return { daysElapsed: 0, daysRemaining: 0, totalDays: 0 };
  }
  const current = todayInput ? new Date(todayInput) : new Date();
  const msPerDay = 86400000;
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;
  let daysElapsed = 0;
  if (current >= startDate) {
    daysElapsed = Math.min(
      totalDays,
      Math.floor((current.getTime() - startDate.getTime()) / msPerDay) + 1,
    );
  }
  const daysRemaining = Math.max(0, totalDays - daysElapsed);
  return { daysElapsed, daysRemaining, totalDays };
}
