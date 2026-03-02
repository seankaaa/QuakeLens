# QuakeLens

Interactive earthquake visualization app with:
- Animated global map
- Timeline playback
- Magnitude and depth filters
- Live USGS GeoJSON data ingestion

## Data Source
- USGS GeoJSON feed portal: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
- USGS event query API used for custom 365-day windows:
  - `https://earthquake.usgs.gov/fdsnws/event/1/query`

## Local Setup
1. Install dependencies:
   - `npm install`
2. Start development server:
   - `npm run dev`

## Build
- `npm run build`
- `npm run preview`
