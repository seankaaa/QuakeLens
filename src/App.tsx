import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { FilterPanel } from "./components/FilterPanel";
import { MapView } from "./components/MapView";
import { Timeline } from "./components/Timeline";
import { EventDrawer } from "./components/EventDrawer";
import { fetchEarthquakes } from "./services/usgs";
import { useQuakeStore } from "./store/useQuakeStore";
import { getPresetRange } from "./utils/time";
import type { DatePreset, EarthquakeEvent, QuakeSummary } from "./types/earthquake";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const PLAY_INTERVAL_MS = 80;
const PLAY_DIVISOR = 500;

function buildSummary(events: EarthquakeEvent[]): QuakeSummary {
  if (events.length === 0) {
    return {
      count: 0,
      maxMagnitude: 0,
      avgDepth: 0,
      latestTime: null
    };
  }

  const totalDepth = events.reduce((sum, event) => sum + event.depthKm, 0);

  return {
    count: events.length,
    maxMagnitude: events.reduce(
      (currentMax, event) => Math.max(currentMax, event.magnitude),
      0
    ),
    avgDepth: totalDepth / events.length,
    latestTime: events[events.length - 1]?.time ?? null
  };
}

export default function App() {
  const [reloadKey, setReloadKey] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const rawEvents = useQuakeStore((state) => state.rawEvents);
  const status = useQuakeStore((state) => state.status);
  const error = useQuakeStore((state) => state.error);
  const lastUpdatedMs = useQuakeStore((state) => state.lastUpdatedMs);
  const selectedEventId = useQuakeStore((state) => state.selectedEventId);
  const isPlaying = useQuakeStore((state) => state.isPlaying);
  const playheadTime = useQuakeStore((state) => state.playheadTime);
  const timeRange = useQuakeStore((state) => state.timeRange);
  const magnitudeRange = useQuakeStore((state) => state.magnitudeRange);
  const depthRange = useQuakeStore((state) => state.depthRange);
  const activePreset = useQuakeStore((state) => state.activePreset);

  const setStatus = useQuakeStore((state) => state.setStatus);
  const setError = useQuakeStore((state) => state.setError);
  const mergeEvents = useQuakeStore((state) => state.mergeEvents);
  const setSelectedEvent = useQuakeStore((state) => state.setSelectedEvent);
  const setTimeRange = useQuakeStore((state) => state.setTimeRange);
  const setMagnitudeRange = useQuakeStore((state) => state.setMagnitudeRange);
  const setDepthRange = useQuakeStore((state) => state.setDepthRange);
  const setPlayheadTime = useQuakeStore((state) => state.setPlayheadTime);
  const advancePlayhead = useQuakeStore((state) => state.advancePlayhead);
  const setIsPlaying = useQuakeStore((state) => state.setIsPlaying);
  const togglePlaying = useQuakeStore((state) => state.togglePlaying);
  const setActivePreset = useQuakeStore((state) => state.setActivePreset);

  const selectedEvent = useMemo(
    () => rawEvents.find((event) => event.id === selectedEventId) ?? null,
    [rawEvents, selectedEventId]
  );

  const filteredEvents = useMemo(
    () =>
      rawEvents.filter(
        (event) =>
          event.time >= timeRange.startMs &&
          event.time <= timeRange.endMs &&
          event.magnitude >= magnitudeRange.min &&
          event.magnitude <= magnitudeRange.max &&
          event.depthKm >= depthRange.min &&
          event.depthKm <= depthRange.max
      ),
    [
      depthRange.max,
      depthRange.min,
      magnitudeRange.max,
      magnitudeRange.min,
      rawEvents,
      timeRange.endMs,
      timeRange.startMs
    ]
  );

  const currentPlayhead = playheadTime ?? timeRange.endMs;

  const visibleEvents = useMemo(
    () => filteredEvents.filter((event) => event.time <= currentPlayhead),
    [filteredEvents, currentPlayhead]
  );

  const summary = useMemo(() => buildSummary(filteredEvents), [filteredEvents]);

  useEffect(() => {
    let isCancelled = false;
    let controller: AbortController | null = null;

    const load = async () => {
      controller?.abort();
      controller = new AbortController();

      if (useQuakeStore.getState().rawEvents.length === 0) {
        setStatus("loading");
      }

      try {
        const events = await fetchEarthquakes(
          {
            startTime: new Date(timeRange.startMs),
            endTime: new Date(timeRange.endMs),
            minMagnitude: 0,
            maxMagnitude: 10
          },
          controller.signal
        );

        if (isCancelled || controller.signal.aborted) {
          return;
        }

        mergeEvents(events);
      } catch (caughtError) {
        if (isCancelled || controller?.signal.aborted) {
          return;
        }

        const message =
          caughtError instanceof Error ? caughtError.message : "Unknown data loading error.";
        setStatus("error");
        setError(message);
      }
    };

    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, REFRESH_INTERVAL_MS);

    return () => {
      isCancelled = true;
      controller?.abort();
      window.clearInterval(intervalId);
    };
  }, [mergeEvents, reloadKey, setError, setStatus, timeRange.endMs, timeRange.startMs]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const span = Math.max(timeRange.endMs - timeRange.startMs, 1);
    const step = Math.max(Math.floor(span / PLAY_DIVISOR), 30_000);

    const intervalId = window.setInterval(() => {
      advancePlayhead(step);
    }, PLAY_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [advancePlayhead, isPlaying, timeRange.endMs, timeRange.startMs]);

  const handlePresetSelect = (preset: Exclude<DatePreset, "custom">) => {
    const range = getPresetRange(preset);
    setActivePreset(preset);
    setIsPlaying(false);
    setSelectedEvent(null);
    setTimeRange(range.startMs, range.endMs);
    setPlayheadTime(range.endMs);
  };

  const handleCustomRangeChange = (startMs: number, endMs: number) => {
    setActivePreset("custom");
    setIsPlaying(false);
    setSelectedEvent(null);
    setTimeRange(startMs, endMs);
    setPlayheadTime(Math.max(startMs, endMs));
  };

  const handleTogglePlay = () => {
    if (!isPlaying && currentPlayhead >= timeRange.endMs) {
      setPlayheadTime(timeRange.startMs);
    }

    togglePlaying();
  };

  const handleScrub = (value: number) => {
    if (isPlaying) {
      setIsPlaying(false);
    }
    setPlayheadTime(value);
  };

  return (
    <div className="app-shell">
      <button
        type="button"
        className="mobile-controls-toggle"
        onClick={() => setIsPanelOpen((value) => !value)}
      >
        {isPanelOpen ? "Hide Controls" : "Show Controls"}
      </button>

      <aside className={clsx("panel-left", { "is-collapsed": !isPanelOpen })}>
        <FilterPanel
          status={status}
          lastUpdatedMs={lastUpdatedMs}
          summary={summary}
          timeRange={timeRange}
          magnitudeRange={magnitudeRange}
          depthRange={depthRange}
          activePreset={activePreset}
          onPresetSelect={handlePresetSelect}
          onCustomRangeChange={handleCustomRangeChange}
          onMagnitudeChange={setMagnitudeRange}
          onDepthChange={setDepthRange}
        />
      </aside>

      <main className="map-stage">
        <MapView
          events={visibleEvents}
          selectedEventId={selectedEventId}
          onSelectEvent={setSelectedEvent}
        />

        {error && status === "error" ? (
          <div className="status-overlay error-overlay">
            <p>{error}</p>
            <button type="button" onClick={() => setReloadKey((value) => value + 1)}>
              Retry
            </button>
          </div>
        ) : null}

        {status === "loading" ? (
          <div className="status-overlay loading-overlay">Loading USGS data...</div>
        ) : null}
      </main>

      <aside className="panel-right">
        <EventDrawer event={selectedEvent} />
      </aside>

      <footer className="timeline-shell">
        <Timeline
          events={filteredEvents}
          rangeStartMs={timeRange.startMs}
          rangeEndMs={timeRange.endMs}
          playheadTime={currentPlayhead}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onScrub={handleScrub}
        />
      </footer>
    </div>
  );
}
