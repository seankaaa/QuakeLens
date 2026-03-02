import type { EarthquakeEvent, EarthquakeQuery } from "../types/earthquake";

const USGS_EVENT_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query";

interface UsgsFeature {
  id: string;
  properties: {
    mag: number | null;
    place: string | null;
    time: number | null;
    updated: number | null;
    url: string | null;
    tsunami: number | null;
    felt: number | null;
  };
  geometry: {
    coordinates: number[];
  } | null;
}

interface UsgsResponse {
  features: UsgsFeature[];
}

function buildQueryUrl(query: EarthquakeQuery): string {
  const params = new URLSearchParams({
    format: "geojson",
    starttime: query.startTime.toISOString(),
    endtime: query.endTime.toISOString(),
    minmagnitude: String(query.minMagnitude),
    maxmagnitude: String(query.maxMagnitude),
    orderby: "time"
  });

  return `${USGS_EVENT_URL}?${params.toString()}`;
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

async function fetchWithRetry(url: string, signal?: AbortSignal): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal,
        headers: {
          Accept: "application/geo+json, application/json"
        }
      });

      if (!response.ok && isRetryableStatus(response.status) && attempt === 0) {
        continue;
      }

      if (!response.ok) {
        throw new Error(`USGS request failed with status ${response.status}`);
      }

      return response;
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }

      lastError = error;
      if (attempt === 1) {
        throw new Error(
          "Unable to fetch earthquake data from USGS.",
          { cause: lastError }
        );
      }
    }
  }

  throw new Error("Unable to fetch earthquake data from USGS.", { cause: lastError });
}

function normalizeFeature(feature: UsgsFeature): EarthquakeEvent | null {
  const coords = feature.geometry?.coordinates;
  if (!coords || coords.length < 3) {
    return null;
  }

  const [lng, lat, depth] = coords;
  if (
    typeof lng !== "number" ||
    typeof lat !== "number" ||
    typeof depth !== "number"
  ) {
    return null;
  }

  const time = feature.properties.time;
  if (typeof time !== "number") {
    return null;
  }

  return {
    id: feature.id,
    time,
    updated: feature.properties.updated ?? time,
    magnitude: typeof feature.properties.mag === "number" ? feature.properties.mag : 0,
    depthKm: depth,
    place: feature.properties.place ?? "Unknown location",
    coordinates: { lng, lat },
    url: feature.properties.url ?? "https://earthquake.usgs.gov",
    tsunami: feature.properties.tsunami ?? 0,
    felt: feature.properties.felt ?? null
  };
}

export async function fetchEarthquakes(
  query: EarthquakeQuery,
  signal?: AbortSignal
): Promise<EarthquakeEvent[]> {
  const url = buildQueryUrl(query);
  const response = await fetchWithRetry(url, signal);
  const data = (await response.json()) as UsgsResponse;

  if (!Array.isArray(data.features)) {
    throw new Error("USGS response did not include a valid features array.");
  }

  return data.features
    .map(normalizeFeature)
    .filter((event): event is EarthquakeEvent => event !== null)
    .sort((a, b) => a.time - b.time);
}
