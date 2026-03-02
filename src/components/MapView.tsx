import { useEffect, useMemo } from "react";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap
} from "react-leaflet";
import type { EarthquakeEvent } from "../types/earthquake";

export interface MapViewProps {
  events: EarthquakeEvent[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string | null) => void;
}

const INITIAL_CENTER: [number, number] = [18, 5];
const CANVAS_RENDERER = L.canvas({ padding: 0.5 });

function markerRadius(magnitude: number): number {
  if (magnitude < 1) {
    return 3;
  }

  return Math.min(18, 3 + magnitude * 1.8);
}

function depthColor(depth: number): string {
  if (depth < 70) {
    return "#0ea5e9";
  }

  if (depth < 300) {
    return "#f59e0b";
  }

  return "#dc2626";
}

function SelectedEventCamera({ selectedEvent }: { selectedEvent: EarthquakeEvent | null }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedEvent) {
      return;
    }

    map.flyTo(
      [selectedEvent.coordinates.lat, selectedEvent.coordinates.lng],
      Math.max(map.getZoom(), 4),
      {
        duration: 0.7,
        animate: true
      }
    );
  }, [map, selectedEvent]);

  return null;
}

function BackgroundClickClear({
  onSelectEvent
}: {
  onSelectEvent: (eventId: string | null) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const clearSelection = () => onSelectEvent(null);

    map.on("click", clearSelection);
    return () => {
      map.off("click", clearSelection);
    };
  }, [map, onSelectEvent]);

  return null;
}

export function MapView({ events, selectedEventId, onSelectEvent }: MapViewProps) {
  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const recentThreshold = Date.now() - 24 * 60 * 60 * 1000;

  return (
    <MapContainer
      center={INITIAL_CENTER}
      zoom={2}
      minZoom={1.5}
      worldCopyJump
      zoomControl
      className="map-canvas"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <SelectedEventCamera selectedEvent={selectedEvent} />
      <BackgroundClickClear onSelectEvent={onSelectEvent} />

      {events.map((event) => {
        const isSelected = selectedEventId === event.id;
        const isRecent = event.time >= recentThreshold;

        return (
          <CircleMarker
            key={event.id}
            center={[event.coordinates.lat, event.coordinates.lng]}
            radius={isSelected ? markerRadius(event.magnitude) + 2 : markerRadius(event.magnitude)}
            bubblingMouseEvents={false}
            renderer={CANVAS_RENDERER}
            pathOptions={{
              fillColor: depthColor(event.depthKm),
              fillOpacity: isRecent ? 0.92 : 0.72,
              color: "#f8fafc",
              opacity: 1,
              weight: isSelected ? 2.4 : isRecent ? 1.5 : 1
            }}
            eventHandlers={{
              click: () => {
                onSelectEvent(event.id);
              }
            }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              <div>
                <strong>{event.place}</strong>
                <br />
                Mag {event.magnitude.toFixed(1)} | Depth {event.depthKm.toFixed(1)} km
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
