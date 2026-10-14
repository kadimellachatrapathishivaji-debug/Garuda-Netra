import { RoutePoint } from '../types';
import { calculateCompassBearing } from './hardwareGPSService';

// Haversine distance in meters
function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Convert an array of raw coordinates [[lat, lng], ...] into RoutePoints with speed and calculated heading
export function buildRoadRoutePoints(coords: [number, number][], targetSpeedKmH: number = 60): RoutePoint[] {
  if (coords.length === 0) return [];
  if (coords.length === 1) {
    return [{ lat: coords[0][0], lng: coords[0][1], speed: targetSpeedKmH, heading: 0 }];
  }

  const points: RoutePoint[] = [];

  for (let i = 0; i < coords.length; i++) {
    const curr = coords[i];
    let heading = 0;

    if (i < coords.length - 1) {
      const next = coords[i + 1];
      heading = calculateCompassBearing(curr[0], curr[1], next[0], next[1]);
    } else if (i > 0) {
      const prev = coords[i - 1];
      heading = calculateCompassBearing(prev[0], prev[1], curr[0], curr[1]);
    }

    // Gentle speed variation based on curves (slow down on sharp bends)
    let speed = targetSpeedKmH;
    if (i < coords.length - 2) {
      const next1 = coords[i + 1];
      const next2 = coords[i + 2];
      const h1 = calculateCompassBearing(curr[0], curr[1], next1[0], next1[1]);
      const h2 = calculateCompassBearing(next1[0], next1[1], next2[0], next2[1]);
      const diff = Math.abs(h1 - h2);
      if (diff > 45 && diff < 315) {
        speed = Math.max(30, Math.round(targetSpeedKmH * 0.65)); // Slow down for turn
      }
    }

    points.push({
      lat: Number(curr[0].toFixed(6)),
      lng: Number(curr[1].toFixed(6)),
      speed,
      heading,
    });
  }

  return points;
}

// Fetch real turn-by-turn road geometry from OpenStreetMap / OSRM public API
export async function fetchOSRMRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  speedKmH: number = 55
): Promise<RoutePoint[] | null> {
  const cacheKey = `garuda_osrm_${startLat.toFixed(3)}_${startLng.toFixed(3)}_${endLat.toFixed(3)}_${endLng.toFixed(3)}`;

  // Check localStorage cache first
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 5) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore storage error
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        // GeoJSON coordinates are [longitude, latitude]
        const rawCoords: [number, number][] = data.routes[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );

        if (rawCoords.length >= 2) {
          const routePoints = buildRoadRoutePoints(rawCoords, speedKmH);
          try {
            localStorage.setItem(cacheKey, JSON.stringify(routePoints));
          } catch (e) {
            // ignore quota errors
          }
          return routePoints;
        }
      }
    }
  } catch (err) {
    console.warn('OSRM public road fetch timed out or failed, using high-precision fallback road geometry:', err);
  }

  return null;
}

// Generate realistic road circuit for any Indian state/city center
export function generateCityRoadCircuit(
  centerLat: number,
  centerLng: number,
  radiusKm: number = 4,
  speedKmH: number = 45
): RoutePoint[] {
  // Generate an 8-way arterial road loop following typical Indian city ring-road patterns
  const numWaypoints = 24;
  const coords: [number, number][] = [];

  for (let i = 0; i < numWaypoints; i++) {
    const angle = (i / numWaypoints) * 2 * Math.PI;
    // Introduce arterial street grid asymmetry
    const r = radiusKm * (0.85 + 0.25 * Math.sin(angle * 2) + 0.1 * Math.cos(angle * 4));
    const dLat = (r * Math.cos(angle)) / 111.0;
    const dLng = (r * Math.sin(angle)) / (111.0 * Math.cos((centerLat * Math.PI) / 180));
    coords.push([centerLat + dLat, centerLng + dLng]);
  }

  // Close loop
  coords.push(coords[0]);
  return buildRoadRoutePoints(coords, speedKmH);
}
