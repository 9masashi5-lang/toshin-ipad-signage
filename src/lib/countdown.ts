const TOKYO_TIME_ZONE = "Asia/Tokyo";

function getTokyoDateKey(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TOKYO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dateKeyToUtc(dateKey: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;
  const [, year, month, day] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day));
}

export function calculateRemainingDays(targetDate: string, now = new Date()) {
  const target = dateKeyToUtc(targetDate);
  const today = dateKeyToUtc(getTokyoDateKey(now));
  if (target === null || today === null) return null;
  return Math.ceil((target - today) / 86_400_000);
}
