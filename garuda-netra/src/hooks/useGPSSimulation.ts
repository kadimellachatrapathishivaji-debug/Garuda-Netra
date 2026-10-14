import { useState, useEffect, useRef, useCallback } from 'react';
import { GPSCoordinate, RoutePoint, HardwareGPSBroadcast } from '../types';
import { vehicleRoutes, tirupatiChennaiRoute } from '../data/mockRoutes';
import {
  subscribeToTelemetry,
  startHardwareBroadcast,
  stopHardwareBroadcast,
  isHardwareBroadcasting,
  enableSimulatedDrivingBoost,
  stopSimulatedDrivingBoost,
  getLastKnownTelemetry,
  calculateCompassBearing,
} from '../services/hardwareGPSService';
import { generateCityRoadCircuit, fetchOSRMRoute } from '../services/roadRoutingService';
import { deriveRTOFromRegNumber } from '../services/vahanService';

// Fallback city center coordinates for major Indian state prefixes
const STATE_ROAD_CENTERS: Record<string, { lat: number; lng: number }> = {
  AP: { lat: 13.6288, lng: 79.4192 }, // Tirupati / Amaravati
  TS: { lat: 17.3850, lng: 78.4867 }, // Hyderabad
  KA: { lat: 12.9716, lng: 77.5946 }, // Bengaluru
  DL: { lat: 28.6139, lng: 77.2090 }, // Delhi
  MH: { lat: 19.0760, lng: 72.8777 }, // Mumbai
  TN: { lat: 13.0827, lng: 80.2707 }, // Chennai
  UP: { lat: 26.8467, lng: 80.9462 }, // Lucknow
  HR: { lat: 28.4595, lng: 77.0266 }, // Gurugram
  GJ: { lat: 23.0225, lng: 72.5714 }, // Ahmedabad
  RJ: { lat: 26.9124, lng: 75.7873 }, // Jaipur
  KL: { lat: 9.9312, lng: 76.2673 },  // Kochi
  WB: { lat: 22.5726, lng: 88.3639 }, // Kolkata
  PB: { lat: 30.7046, lng: 76.7179 }, // Mohali
};

interface UseGPSSimulationOptions {
  registrationNumber: string;
  enabled: boolean;
  intervalMs?: number;
}

export interface UseGPSSimulationResult {
  currentPosition: GPSCoordinate | null;
  positionHistory: GPSCoordinate[];
  activeRoute: RoutePoint[];
  isSimulating: boolean;
  routeCompleted: boolean;
  isHardwareGPS: boolean;
  hardwareAccuracy?: number;
  isDriveBoostActive: boolean;
  toggleDeviceGPS: () => boolean;
  toggleDriveBoost: (speedKmH?: number) => void;
}

export function useGPSSimulation({
  registrationNumber,
  enabled,
  intervalMs = 2000,
}: UseGPSSimulationOptions): UseGPSSimulationResult {
  const cleanRegNo = registrationNumber.replace(/\s/g, '').toUpperCase();
  const stateCode = cleanRegNo.slice(0, 2);

  // Determine initial road route
  const getInitialRoute = (): RoutePoint[] => {
    if (vehicleRoutes[cleanRegNo]) {
      return vehicleRoutes[cleanRegNo];
    }
    const center = STATE_ROAD_CENTERS[stateCode] || STATE_ROAD_CENTERS['DL'];
    return generateCityRoadCircuit(center.lat, center.lng, 6, 50);
  };

  const [activeRoute, setActiveRoute] = useState<RoutePoint[]>(getInitialRoute());
  const [currentPosition, setCurrentPosition] = useState<GPSCoordinate | null>(null);
  const [positionHistory, setPositionHistory] = useState<GPSCoordinate[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [routeCompleted, setRouteCompleted] = useState(false);
  const [isHardwareGPS, setIsHardwareGPS] = useState(false);
  const [hardwareAccuracy, setHardwareAccuracy] = useState<number | undefined>(undefined);
  const [isDriveBoostActive, setIsDriveBoostActive] = useState(false);

  const progressRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync route if registration number changes
  useEffect(() => {
    const defaultRoute = getInitialRoute();
    setActiveRoute(defaultRoute);

    // If custom route with > 1 point, attempt OSRM highway enhancement asynchronously
    if (!vehicleRoutes[cleanRegNo] && defaultRoute.length >= 2) {
      const first = defaultRoute[0];
      const mid = defaultRoute[Math.floor(defaultRoute.length / 2)];
      fetchOSRMRoute(first.lat, first.lng, mid.lat, mid.lng).then((osrmPoints) => {
        if (osrmPoints && osrmPoints.length > 10) {
          setActiveRoute(osrmPoints);
        }
      });
    }
  }, [cleanRegNo, stateCode]);

  // 1. Subscribe to live hardware GPS broadcasts (cross-tab / cross-device)
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribeToTelemetry(cleanRegNo, (telemetry: HardwareGPSBroadcast) => {
      if (telemetry && telemetry.isBroadcasting) {
        setIsHardwareGPS(true);
        setHardwareAccuracy(telemetry.accuracy);
        setIsDriveBoostActive(telemetry.isSimulatedDrive);

        const newCoord: GPSCoordinate = {
          lat: telemetry.lat,
          lng: telemetry.lng,
          timestamp: telemetry.timestamp,
          speed: telemetry.speed,
          heading: telemetry.heading,
          ignition: telemetry.speed > 0 || telemetry.isBroadcasting,
          batteryTamper: false,
          altitude: telemetry.altitude,
          accuracy: telemetry.accuracy,
          source: telemetry.source,
          provider: telemetry.source === 'HARDWARE' ? 'Live Satellite (NavIC / GPS)' : 'Simulation Boost',
        };

        setCurrentPosition(newCoord);
        setPositionHistory((prev) => {
          const last = prev[prev.length - 1];
          if (last && Math.abs(last.lat - newCoord.lat) < 0.00001 && Math.abs(last.lng - newCoord.lng) < 0.00001) {
            return prev;
          }
          return [...prev.slice(-400), newCoord];
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [cleanRegNo, enabled]);

  // 2. Strict road interpolation: follows actual road waypoints without cutting corners or jittering
  const interpolateRoadPosition = useCallback(
    (progress: number): GPSCoordinate | null => {
      if (activeRoute.length === 0) {
        const center = STATE_ROAD_CENTERS[stateCode] || { lat: 13.6288, lng: 79.4192 };
        return {
          lat: center.lat,
          lng: center.lng,
          timestamp: Date.now(),
          speed: 0,
          heading: 0,
          ignition: false,
          batteryTamper: false,
          altitude: 48,
          accuracy: 4,
          source: 'SIMULATED',
          provider: 'AIS-140 Standby',
        };
      }

      if (activeRoute.length === 1) {
        const p = activeRoute[0];
        return {
          lat: p.lat,
          lng: p.lng,
          timestamp: Date.now(),
          speed: p.speed,
          heading: p.heading,
          ignition: p.speed > 0,
          batteryTamper: cleanRegNo === 'KA01MB1029',
          altitude: 120,
          accuracy: 4,
          source: 'SIMULATED',
        };
      }

      const totalSegments = activeRoute.length - 1;
      const scaledProgress = Math.max(0, Math.min(progress, 0.999999)) * totalSegments;
      const segmentIndex = Math.floor(scaledProgress);
      const segmentProgress = scaledProgress - segmentIndex;

      const from = activeRoute[segmentIndex];
      const to = activeRoute[Math.min(segmentIndex + 1, activeRoute.length - 1)];

      // Linear interpolation strictly along the road segment
      const lat = from.lat + (to.lat - from.lat) * segmentProgress;
      const lng = from.lng + (to.lng - from.lng) * segmentProgress;
      const speed = Math.round(from.speed + (to.speed - from.speed) * segmentProgress);
      
      // Exact compass bearing along the road tangent
      const heading = calculateCompassBearing(from.lat, from.lng, to.lat, to.lng);

      return {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        timestamp: Date.now(),
        speed: Math.max(0, speed),
        heading: (heading + 360) % 360,
        ignition: speed > 0,
        batteryTamper: cleanRegNo === 'KA01MB1029',
        altitude: 80,
        accuracy: 3,
        source: 'SIMULATED',
        provider: 'AIS-140 Road Telemetry',
      };
    },
    [activeRoute, cleanRegNo, stateCode]
  );

  // 3. Road-snapped simulation loop (active when not streaming real hardware GPS)
  useEffect(() => {
    // Check if hardware GPS is active first
    const activeTelemetry = getLastKnownTelemetry(cleanRegNo);
    if (activeTelemetry && activeTelemetry.isBroadcasting && Date.now() - activeTelemetry.timestamp < 15000) {
      setIsHardwareGPS(true);
      setHardwareAccuracy(activeTelemetry.accuracy);
      setIsSimulating(false);
      return;
    }

    if (!enabled || activeRoute.length === 0) {
      setIsSimulating(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setIsSimulating(true);
    setRouteCompleted(false);
    progressRef.current = 0;

    const initialPos = interpolateRoadPosition(0);
    if (initialPos) {
      setCurrentPosition(initialPos);
      setPositionHistory([initialPos]);
    }

    // Advance smoothly along road geometry
    // Step size ensures vehicle stays on roads and glides realistically
    const step = 1 / Math.max(80, activeRoute.length * 8);

    intervalRef.current = setInterval(() => {
      if (isHardwareBroadcasting()) {
        return;
      }

      progressRef.current += step;

      if (progressRef.current >= 1) {
        progressRef.current = 0; // Loop or complete
        setRouteCompleted(true);
      }

      const pos = interpolateRoadPosition(progressRef.current);
      if (pos) {
        setCurrentPosition(pos);
        setPositionHistory((prev) => [...prev.slice(-350), pos]);
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, cleanRegNo, intervalMs, activeRoute, interpolateRoadPosition]);

  // One-click toggle device hardware GPS directly from tracking view
  const toggleDeviceGPS = useCallback((): boolean => {
    if (isHardwareBroadcasting()) {
      stopHardwareBroadcast();
      setIsHardwareGPS(false);
      setIsDriveBoostActive(false);
      setHardwareAccuracy(undefined);
      return false;
    } else {
      const started = startHardwareBroadcast(cleanRegNo, (telemetry) => {
        setIsHardwareGPS(true);
        setHardwareAccuracy(telemetry.accuracy);
        setIsDriveBoostActive(telemetry.isSimulatedDrive);
      });
      return started;
    }
  }, [cleanRegNo]);

  // Toggle simulated driving boost
  const toggleDriveBoost = useCallback(
    (speedKmH: number = 45) => {
      if (isDriveBoostActive) {
        stopSimulatedDrivingBoost();
        setIsDriveBoostActive(false);
      } else {
        enableSimulatedDrivingBoost(cleanRegNo, speedKmH, (telemetry) => {
          setIsHardwareGPS(true);
          setIsDriveBoostActive(true);
          setHardwareAccuracy(telemetry.accuracy);
        });
      }
    },
    [cleanRegNo, isDriveBoostActive]
  );

  return {
    currentPosition,
    positionHistory,
    activeRoute,
    isSimulating,
    routeCompleted,
    isHardwareGPS,
    hardwareAccuracy,
    isDriveBoostActive,
    toggleDeviceGPS,
    toggleDriveBoost,
  };
}

export default useGPSSimulation;
