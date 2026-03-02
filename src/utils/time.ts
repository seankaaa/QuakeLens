import { format, subDays, subHours } from "date-fns";
import type { DatePreset } from "../types/earthquake";

export function getPresetRange(
  preset: Exclude<DatePreset, "custom">,
  now = Date.now()
): { startMs: number; endMs: number } {
  const end = now;

  switch (preset) {
    case "24h":
      return { startMs: subHours(end, 24).getTime(), endMs: end };
    case "7d":
      return { startMs: subDays(end, 7).getTime(), endMs: end };
    case "30d":
      return { startMs: subDays(end, 30).getTime(), endMs: end };
    case "365d":
    default:
      return { startMs: subDays(end, 365).getTime(), endMs: end };
  }
}

export function formatTimestamp(ms: number): string {
  return format(ms, "MMM d, yyyy HH:mm:ss");
}

export function toDateTimeLocalValue(ms: number): string {
  const value = new Date(ms);
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function fromDateTimeLocalValue(value: string): number | null {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
