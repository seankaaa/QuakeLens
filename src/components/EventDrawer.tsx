import type { EarthquakeEvent } from "../types/earthquake";
import { formatTimestamp } from "../utils/time";

interface EventDrawerProps {
  event: EarthquakeEvent | null;
}

export function EventDrawer({ event }: EventDrawerProps) {
  if (!event) {
    return (
      <aside className="event-drawer empty">
        <h2>Event Details</h2>
        <p>Select an earthquake point on the map to inspect details.</p>
      </aside>
    );
  }

  return (
    <aside className="event-drawer">
      <h2>Event Details</h2>
      <h3>{event.place}</h3>
      <dl>
        <div>
          <dt>Magnitude</dt>
          <dd>{event.magnitude.toFixed(1)}</dd>
        </div>
        <div>
          <dt>Depth</dt>
          <dd>{event.depthKm.toFixed(1)} km</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{formatTimestamp(event.time)}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{formatTimestamp(event.updated)}</dd>
        </div>
        <div>
          <dt>Coordinates</dt>
          <dd>
            {event.coordinates.lat.toFixed(3)}, {event.coordinates.lng.toFixed(3)}
          </dd>
        </div>
        <div>
          <dt>Tsunami Flag</dt>
          <dd>{event.tsunami}</dd>
        </div>
        <div>
          <dt>Felt Reports</dt>
          <dd>{event.felt ?? "N/A"}</dd>
        </div>
      </dl>
      <a href={event.url} target="_blank" rel="noreferrer">
        Open USGS Event
      </a>
    </aside>
  );
}
