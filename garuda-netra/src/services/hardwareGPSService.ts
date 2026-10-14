import { HardwareGPSBroadcast } from '../types';

export const TELEMETRY_STORAGE_KEY = 'garuda_netra_live_telemetry';
export const TELEMETRY_CHANNEL_NAME = 'garuda_netra_telemetry';

// State for active hardware GPS tracking
let watchId: number | null = null;
let currentBroadcast: HardwareGPSBroadcast | null = null;
let previousPosition: { lat: number; lng: number; time: number } | null = null;
let broadcastChannel: BroadcastChannel | null = null;
let boostIntervalId: ReturnType<typeof setInterval> | null = null;
let boostHeadingDeg = 45; // Initial heading for simulation boost

// Initialize BroadcastChannel if supported
function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    if (!broadcastChannel) {
      broadcastChannel = new BroadcastChannel(TELEMETRY_CHANNEL_NAME);
    }
    return broadcastChannel;
  }
  return null;
}

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

// Calculate compass bearing in degrees 0-360
export function calculateCompassBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const b = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((b + 360) % 360);
}

// Publish telemetry event to both BroadcastChannel and localStorage
export function publishTelemetry(telemetry: HardwareGPSBroadcast): void {
  currentBroadcast = telemetry;

  // 1. Cross-tab BroadcastChannel
  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage(telemetry);
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }
  }

  // 2. localStorage fallback for cross-tab and reload persistence
  try {
    const serialized = JSON.stringify(telemetry);
    localStorage.setItem(`${TELEMETRY_STORAGE_KEY}_${telemetry.regNo.replace(/\s/g, '').toUpperCase()}`, serialized);
    localStorage.setItem(TELEMETRY_STORAGE_KEY, serialized); // Last active
  } catch (e) {
    console.warn('localStorage telemetry write error:', e);
  }

  // 3. In-memory custom event for current window
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('garuda_telemetry_update', { detail: telemetry }));
  }
}

// Retrieve last known telemetry for a vehicle
export function getLastKnownTelemetry(regNo?: string): HardwareGPSBroadcast | null {
  if (currentBroadcast && (!regNo || currentBroadcast.regNo.replace(/\s/g, '').toUpperCase() === regNo.replace(/\s/g, '').toUpperCase())) {
    return currentBroadcast;
  }

  try {
    const key = regNo ? `${TELEMETRY_STORAGE_KEY}_${regNo.replace(/\s/g, '').toUpperCase()}` : TELEMETRY_STORAGE_KEY;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read telemetry from localStorage', e);
  }

  return null;
}

// Start watching device GPS hardware via navigator.geolocation
export function startHardwareBroadcast(
  regNo: string,
  onUpdate?: (telemetry: HardwareGPSBroadcast) => void,
  onError?: (errorMessage: string) => void
): boolean {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    if (onError) onError('Hardware Geolocation is not supported by your current browser.');
    return false;
  }

  const cleanReg = regNo.replace(/\s/g, '').toUpperCase();

  // Stop any existing watch
  stopHardwareBroadcast();

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const now = Date.now();
      const coords = position.coords;
      let calculatedSpeed = 0;
      let calculatedHeading = boostHeadingDeg;

      if (previousPosition) {
        const deltaMeters = haversineDistanceMeters(
          previousPosition.lat,
          previousPosition.lng,
          coords.latitude,
          coords.longitude
        );
        const deltaSeconds = Math.max(1, (now - previousPosition.time) / 1000);

        if (coords.speed !== null && !isNaN(coords.speed) && coords.speed >= 0) {
          calculatedSpeed = Math.round(coords.speed * 3.6); // Convert m/s to km/h
        } else {
          calculatedSpeed = Math.round((deltaMeters / deltaSeconds) * 3.6);
        }

        if (deltaMeters > 2) {
          calculatedHeading = calculateCompassBearing(
            previousPosition.lat,
            previousPosition.lng,
            coords.latitude,
            coords.longitude
          );
          boostHeadingDeg = calculatedHeading;
        }
      }

      if (coords.heading !== null && !isNaN(coords.heading)) {
        calculatedHeading = Math.round(coords.heading);
      }

      previousPosition = {
        lat: coords.latitude,
        lng: coords.longitude,
        time: now,
      };

      const payload: HardwareGPSBroadcast = {
        regNo: cleanReg,
        lat: coords.latitude,
        lng: coords.longitude,
        speed: Math.max(0, calculatedSpeed),
        heading: calculatedHeading,
        accuracy: Math.round(coords.accuracy || 5),
        altitude: Math.round(coords.altitude || 48),
        timestamp: now,
        isBroadcasting: true,
        isSimulatedDrive: false,
        source: 'HARDWARE',
      };

      publishTelemetry(payload);
      if (onUpdate) onUpdate(payload);
    },
    (err) => {
      console.warn('Hardware GPS Error:', err.message);
      if (onError) onError(`GPS Hardware Error (${err.code}): ${err.message}`);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    }
  );

  return true;
}

let boostRouteIndex: number = 0;

// Drive Boost / Indoor Simulation Nudge: advances along road route when available or along road heading
export function enableSimulatedDrivingBoost(
  regNo: string,
  targetSpeedKmH: number = 55,
  onUpdate?: (telemetry: HardwareGPSBroadcast) => void
): void {
  const cleanReg = regNo.replace(/\s/g, '').toUpperCase();
  stopSimulatedDrivingBoost();

  boostRouteIndex = 0;

  boostIntervalId = setInterval(() => {
    // Dynamic import check or known route check
    const last = getLastKnownTelemetry(cleanReg);
    
    // Calculate distance traveled in 2 seconds at targetSpeedKmH
    const distanceMeters = (targetSpeedKmH * 1000 * 2) / 3600; // ~28m per tick
    const baseLat = last ? last.lat : 13.6288;
    const baseLng = last ? last.lng : 79.4192;

    const deltaLat = (distanceMeters * Math.cos((boostHeadingDeg * Math.PI) / 180)) / 111139;
    const deltaLng =
      (distanceMeters * Math.sin((boostHeadingDeg * Math.PI) / 180)) /
      (111139 * Math.cos((baseLat * Math.PI) / 180));

    // Slight gentle steering drift
    boostHeadingDeg = Math.round((boostHeadingDeg + (Math.random() - 0.5) * 4 + 360) % 360);

    const speedJitter = Math.round((Math.random() - 0.5) * 4);
    const boostedPayload: HardwareGPSBroadcast = {
      regNo: cleanReg,
      lat: Number((baseLat + deltaLat).toFixed(6)),
      lng: Number((baseLng + deltaLng).toFixed(6)),
      speed: Math.max(15, Math.round(targetSpeedKmH + speedJitter)),
      heading: boostHeadingDeg,
      accuracy: 3 + Math.round(Math.random() * 2),
      altitude: 85,
      timestamp: Date.now(),
      isBroadcasting: true,
      isSimulatedDrive: true,
      source: 'BOOSTED',
    };

    publishTelemetry(boostedPayload);
    if (onUpdate) onUpdate(boostedPayload);
  }, 2000);
}

export function stopSimulatedDrivingBoost(): void {
  if (boostIntervalId) {
    clearInterval(boostIntervalId);
    boostIntervalId = null;
  }
}

// Stop broadcasting hardware GPS
export function stopHardwareBroadcast(): void {
  if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  stopSimulatedDrivingBoost();
  previousPosition = null;

  if (currentBroadcast) {
    currentBroadcast = {
      ...currentBroadcast,
      isBroadcasting: false,
      speed: 0,
    };
    publishTelemetry(currentBroadcast);
  }
}

export function isHardwareBroadcasting(): boolean {
  return watchId !== null || boostIntervalId !== null;
}

// Subscribe to telemetry updates for a vehicle from other tabs or transmitter
export function subscribeToTelemetry(
  regNo: string,
  callback: (telemetry: HardwareGPSBroadcast) => void
): () => void {
  const cleanReg = regNo.replace(/\s/g, '').toUpperCase();

  // 1. Immediately fire with last known if available
  const existing = getLastKnownTelemetry(cleanReg);
  if (existing) {
    callback(existing);
  }

  // 2. BroadcastChannel handler
  const channel = getBroadcastChannel();
  const handleChannelMessage = (event: MessageEvent) => {
    const data = event.data as HardwareGPSBroadcast;
    if (data && data.regNo && data.regNo.replace(/\s/g, '').toUpperCase() === cleanReg) {
      callback(data);
    }
  };
  if (channel) {
    channel.addEventListener('message', handleChannelMessage);
  }

  // 3. Storage event handler (across browser windows/tabs)
  const handleStorage = (e: StorageEvent) => {
    if (e.key === `${TELEMETRY_STORAGE_KEY}_${cleanReg}` || e.key === TELEMETRY_STORAGE_KEY) {
      if (e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.regNo.replace(/\s/g, '').toUpperCase() === cleanReg) {
            callback(parsed);
          }
        } catch (err) {
          console.warn('Storage telemetry parse error', err);
        }
      }
    }
  };
  window.addEventListener('storage', handleStorage);

  // 4. Same-window custom event handler
  const handleCustomEvent = (e: Event) => {
    const custom = (e as CustomEvent).detail as HardwareGPSBroadcast;
    if (custom && custom.regNo && custom.regNo.replace(/\s/g, '').toUpperCase() === cleanReg) {
      callback(custom);
    }
  };
  window.addEventListener('garuda_telemetry_update', handleCustomEvent);

  // Return unsubscribe cleanup function
  return () => {
    if (channel) {
      channel.removeEventListener('message', handleChannelMessage);
    }
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('garuda_telemetry_update', handleCustomEvent);
  };
}
