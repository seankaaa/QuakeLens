import { useMemo } from "react";
import { formatTimestamp } from "../utils/time";
import type { EarthquakeEvent } from "../types/earthquake";

interface TimelineProps {
  events: EarthquakeEvent[];
  rangeStartMs: number;
  rangeEndMs: number;
  playheadTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onScrub: (value: number) => void;
}

const BIN_COUNT = 72;

export function Timeline({
  events,
  rangeStartMs,
  rangeEndMs,
  playheadTime,
  isPlaying,
  onTogglePlay,
  onScrub
}: TimelineProps) {
  const bins = useMemo(() => {
    const result = Array.from({ length: BIN_COUNT }, () => 0);
    const span = Math.max(rangeEndMs - rangeStartMs, 1);

    for (const event of events) {
      if (event.time < rangeStartMs || event.time > rangeEndMs) {
        continue;
      }

      const ratio = (event.time - rangeStartMs) / span;
      const index = Math.min(BIN_COUNT - 1, Math.floor(ratio * BIN_COUNT));
      result[index] += 1;
    }

    return result;
  }, [events, rangeEndMs, rangeStartMs]);

  const maxBinValue = useMemo(() => Math.max(1, ...bins), [bins]);

  return (
    <div className="timeline-root">
      <div className="timeline-header">
        <button type="button" className="timeline-play-button" onClick={onTogglePlay}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <p className="timeline-current-time">{formatTimestamp(playheadTime)}</p>
      </div>

      <div className="timeline-histogram" aria-hidden="true">
        {bins.map((value, index) => {
          const height = (value / maxBinValue) * 100;
          return (
            <span
              key={index}
              className="timeline-bar"
              style={{ height: `${Math.max(4, height)}%` }}
            />
          );
        })}
      </div>

      <input
        className="timeline-slider"
        type="range"
        min={rangeStartMs}
        max={rangeEndMs}
        step={Math.max(Math.floor((rangeEndMs - rangeStartMs) / 500), 1)}
        value={playheadTime}
        onChange={(event) => onScrub(Number(event.target.value))}
      />

      <div className="timeline-labels">
        <span>{formatTimestamp(rangeStartMs)}</span>
        <span>{formatTimestamp(rangeEndMs)}</span>
      </div>
    </div>
  );
}
