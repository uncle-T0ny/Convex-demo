/** Format a Date as an ISO date string (YYYY-MM-DD). */
export function toISODate(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}
