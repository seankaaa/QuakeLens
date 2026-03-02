import clsx from "clsx";
import type {
  DatePreset,
  QuakeStatus,
  QuakeSummary,
  RangeFilter,
  TimeRange
} from "../types/earthquake";
import {
  formatTimestamp,
  fromDateTimeLocalValue,
  toDateTimeLocalValue
} from "../utils/time";

const PRESETS: Array<{ label: string; value: Exclude<DatePreset, "custom"> }> = [
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "365d", value: "365d" }
];

interface FilterPanelProps {
  status: QuakeStatus;
  lastUpdatedMs: number | null;
  summary: QuakeSummary;
  timeRange: TimeRange;
  magnitudeRange: RangeFilter;
  depthRange: RangeFilter;
  activePreset: DatePreset;
  onPresetSelect: (preset: Exclude<DatePreset, "custom">) => void;
  onCustomRangeChange: (startMs: number, endMs: number) => void;
  onMagnitudeChange: (min: number, max: number) => void;
  onDepthChange: (min: number, max: number) => void;
}

export function FilterPanel({
  status,
  lastUpdatedMs,
  summary,
  timeRange,
  magnitudeRange,
  depthRange,
  activePreset,
  onPresetSelect,
  onCustomRangeChange,
  onMagnitudeChange,
  onDepthChange
}: FilterPanelProps) {
  return (
    <div className="filter-panel">
      <header className="panel-header">
        <h1>Live Earthquake Story Map</h1>
        <p>Interactive view of global seismic activity from live USGS data.</p>
      </header>

      <section className="panel-section">
        <h2>Time Window</h2>
        <div className="preset-grid">
          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              className={clsx("preset-button", {
                "is-active": activePreset === preset.value
              })}
              onClick={() => onPresetSelect(preset.value)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="time-inputs">
          <label>
            Start
            <input
              type="datetime-local"
              value={toDateTimeLocalValue(timeRange.startMs)}
              onChange={(event) => {
                const nextStart = fromDateTimeLocalValue(event.target.value);
                if (nextStart === null) {
                  return;
                }

                onCustomRangeChange(nextStart, timeRange.endMs);
              }}
            />
          </label>

          <label>
            End
            <input
              type="datetime-local"
              value={toDateTimeLocalValue(timeRange.endMs)}
              onChange={(event) => {
                const nextEnd = fromDateTimeLocalValue(event.target.value);
                if (nextEnd === null) {
                  return;
                }

                onCustomRangeChange(timeRange.startMs, nextEnd);
              }}
            />
          </label>
        </div>
      </section>

      <section className="panel-section">
        <h2>Magnitude</h2>
        <p className="value-text">
          {magnitudeRange.min.toFixed(1)} to {magnitudeRange.max.toFixed(1)}
        </p>

        <input
          type="range"
          min={0}
          max={10}
          step={0.1}
          value={magnitudeRange.min}
          onChange={(event) => {
            const min = Number(event.target.value);
            const adjusted = Math.min(min, magnitudeRange.max - 0.1);
            onMagnitudeChange(adjusted, magnitudeRange.max);
          }}
        />

        <input
          type="range"
          min={0}
          max={10}
          step={0.1}
          value={magnitudeRange.max}
          onChange={(event) => {
            const max = Number(event.target.value);
            const adjusted = Math.max(max, magnitudeRange.min + 0.1);
            onMagnitudeChange(magnitudeRange.min, adjusted);
          }}
        />
      </section>

      <section className="panel-section">
        <h2>Depth (km)</h2>
        <p className="value-text">
          {depthRange.min.toFixed(0)} to {depthRange.max.toFixed(0)} km
        </p>

        <input
          type="range"
          min={-5}
          max={750}
          step={5}
          value={depthRange.min}
          onChange={(event) => {
            const min = Number(event.target.value);
            const adjusted = Math.min(min, depthRange.max - 5);
            onDepthChange(adjusted, depthRange.max);
          }}
        />

        <input
          type="range"
          min={-5}
          max={750}
          step={5}
          value={depthRange.max}
          onChange={(event) => {
            const max = Number(event.target.value);
            const adjusted = Math.max(max, depthRange.min + 5);
            onDepthChange(depthRange.min, adjusted);
          }}
        />
      </section>

      <section className="panel-section stats-grid">
        <article>
          <h3>Events</h3>
          <p>{summary.count.toLocaleString()}</p>
        </article>
        <article>
          <h3>Max Mag</h3>
          <p>{summary.maxMagnitude.toFixed(1)}</p>
        </article>
        <article>
          <h3>Avg Depth</h3>
          <p>{summary.avgDepth.toFixed(1)} km</p>
        </article>
        <article>
          <h3>Latest</h3>
          <p>{summary.latestTime ? formatTimestamp(summary.latestTime) : "N/A"}</p>
        </article>
      </section>

      <footer className="panel-footer">
        <span className={clsx("status-pill", `status-${status}`)}>{status}</span>
        <p>
          Last updated: {lastUpdatedMs ? formatTimestamp(lastUpdatedMs) : "Not available"}
        </p>
      </footer>
    </div>
  );
}
