import { create } from "zustand";
import type {
  DatePreset,
  EarthquakeEvent,
  QuakeStatus,
  RangeFilter,
  TimeRange
} from "../types/earthquake";
import { clamp, getPresetRange } from "../utils/time";

const DEFAULT_TIME_RANGE = getPresetRange("365d");
const DEFAULT_MAGNITUDE_RANGE: RangeFilter = { min: 0, max: 10 };
const DEFAULT_DEPTH_RANGE: RangeFilter = { min: -5, max: 750 };

interface QuakeStore {
  rawEvents: EarthquakeEvent[];
  status: QuakeStatus;
  error: string | null;
  lastUpdatedMs: number | null;
  selectedEventId: string | null;
  isPlaying: boolean;
  playheadTime: number | null;
  timeRange: TimeRange;
  magnitudeRange: RangeFilter;
  depthRange: RangeFilter;
  activePreset: DatePreset;
  setStatus: (status: QuakeStatus) => void;
  setError: (error: string | null) => void;
  mergeEvents: (events: EarthquakeEvent[]) => void;
  setSelectedEvent: (eventId: string | null) => void;
  setTimeRange: (startMs: number, endMs: number) => void;
  setMagnitudeRange: (min: number, max: number) => void;
  setDepthRange: (min: number, max: number) => void;
  setPlayheadTime: (time: number) => void;
  advancePlayhead: (stepMs: number) => void;
  setIsPlaying: (value: boolean) => void;
  togglePlaying: () => void;
  setActivePreset: (preset: DatePreset) => void;
}

export const useQuakeStore = create<QuakeStore>((set) => ({
  rawEvents: [],
  status: "idle",
  error: null,
  lastUpdatedMs: null,
  selectedEventId: null,
  isPlaying: false,
  playheadTime: DEFAULT_TIME_RANGE.endMs,
  timeRange: DEFAULT_TIME_RANGE,
  magnitudeRange: DEFAULT_MAGNITUDE_RANGE,
  depthRange: DEFAULT_DEPTH_RANGE,
  activePreset: "365d",
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  mergeEvents: (events) =>
    set((state) => {
      const mergedMap = new Map(state.rawEvents.map((event) => [event.id, event]));

      for (const event of events) {
        mergedMap.set(event.id, event);
      }

      const merged = Array.from(mergedMap.values()).sort((a, b) => a.time - b.time);

      return {
        rawEvents: merged,
        status: "ready",
        error: null,
        lastUpdatedMs: Date.now()
      };
    }),
  setSelectedEvent: (eventId) => set({ selectedEventId: eventId }),
  setTimeRange: (startMs, endMs) =>
    set((state) => {
      const normalizedStart = Math.min(startMs, endMs);
      const normalizedEnd = Math.max(startMs, endMs);
      const nextPlayhead = clamp(
        state.playheadTime ?? normalizedEnd,
        normalizedStart,
        normalizedEnd
      );

      return {
        timeRange: { startMs: normalizedStart, endMs: normalizedEnd },
        playheadTime: nextPlayhead
      };
    }),
  setMagnitudeRange: (min, max) =>
    set({
      magnitudeRange: {
        min: Math.min(min, max),
        max: Math.max(min, max)
      }
    }),
  setDepthRange: (min, max) =>
    set({
      depthRange: {
        min: Math.min(min, max),
        max: Math.max(min, max)
      }
    }),
  setPlayheadTime: (time) =>
    set((state) => ({
      playheadTime: clamp(time, state.timeRange.startMs, state.timeRange.endMs)
    })),
  advancePlayhead: (stepMs) =>
    set((state) => {
      const current = state.playheadTime ?? state.timeRange.startMs;
      const next = Math.min(current + stepMs, state.timeRange.endMs);

      return {
        playheadTime: next,
        isPlaying: next >= state.timeRange.endMs ? false : state.isPlaying
      };
    }),
  setIsPlaying: (value) => set({ isPlaying: value }),
  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setActivePreset: (preset) => set({ activePreset: preset })
}));
