# QuakeLens

An interactive earthquake visualization app built on live USGS data. Explore global seismic activity on an animated map with timeline playback and magnitude/depth filtering.

## Features

- Animated global map of earthquake events (Leaflet)
- Timeline playback to scrub through events over time
- Magnitude and depth range filters
- Event detail drawer with per-earthquake metadata
- Live ingestion from the USGS earthquake feed and event-query API, with retry on rate-limited/server errors

## Data source

- [USGS GeoJSON feed](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php)
- [USGS FDSN event query API](https://earthquake.usgs.gov/fdsnws/event/1/query) for custom date/magnitude windows (default: trailing 365 days)

## Getting started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build     # type-check (tsc -b) + production build
npm run preview   # preview the production build locally
```

## Project structure

```text
src/
├── components/   # MapView, Timeline, FilterPanel, EventDrawer
├── services/      # USGS API client (fetching, retry, query building)
├── store/         # Zustand store: events, filters, playback state
├── types/         # Earthquake event + query types
└── utils/         # Time/range helpers
```

## Tech stack

React 18 + TypeScript, Vite, Leaflet / react-leaflet, Zustand, date-fns.
