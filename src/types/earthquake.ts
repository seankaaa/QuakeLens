export type QuakeStatus = "idle" | "loading" | "ready" | "error";

export type DatePreset = "24h" | "7d" | "30d" | "365d" | "custom";

export interface CoordinatePair {
  lng: number;
  lat: number;
}

export interface EarthquakeEvent {
  id: string;
  time: number;
  updated: number;
  magnitude: number;
  depthKm: number;
  place: string;
  coordinates: CoordinatePair;
  url: string;
  tsunami: number;
  felt: number | null;
}

export interface EarthquakeQuery {
  startTime: Date;
  endTime: Date;
  minMagnitude: number;
  maxMagnitude: number;
}

export interface RangeFilter {
  min: number;
  max: number;
}

export interface TimeRange {
  startMs: number;
  endMs: number;
}

export interface QuakeSummary {
  count: number;
  maxMagnitude: number;
  avgDepth: number;
  latestTime: number | null;
}
