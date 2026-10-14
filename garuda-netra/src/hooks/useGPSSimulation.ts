import { useState, useEffect, useRef, useCallback } from 'react';
import { GPSCoordinate, RoutePoint, HardwareGPSBroadcast } from '../types';
import { vehicleRoutes } from '../data/mockRoutes';
import {
  subscribeToTelemetry,
  startHardwareBroadcast,
  stopHardwareBroadcast,
  isHardwareBroadcasting,
  enableSimulatedDrivingBoost,
  stopSimulatedDrivingBoost,
  getLastKnownTelemetry,
} from '../services/hardwareGPSService';

interface UseGPSSimulationOptions {
  registrationNumber: string;
  enabled: boolean;
  intervalMs?: number;
}

export interface UseGPSSimulationResult {
  currentPosition: GPSCoordinate | null;
  positionHistory: GPSCoordinate[];
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
  const [currentPosition, setCurrentPosition] = useState<GPSCoordinate | null>(null);
  const [positionHistory, setPositionHistory] = useState<GPSCoordinate[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [routeCompleted, setRouteCompleted] = useState(false);
  const [isHardwareGPS, setIsHardwareGPS] = useState(false);
  const [hardwareAccuracy, setHardwareAccuracy] = useState<number | undefined>(undefined);
  const [isDriveBoostActive, setIsDriveBoostActive] = useState(false);

  const cleanRegNo = registrationNumber.replace(/\s/g, '').toUpperCase();
  const route = vehicleRoutes[cleanRegNo] || [];

  const progressRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
          // Check if distance/time is different to avoid identical duplicate points
          const last = prev[prev.length - 1];
          if (last && Math.abs(last.lat - newCoord.lat) < 0.00001 && Math.abs(last.lng - newCoord.lng) < 0.00001) {
            return prev;
          }
          return [...prev.slice(-300), newCoord];
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [cleanRegNo, enabled]);

  // Interpolation for mock routes when not using hardware GPS
  const interpolate = useCallback(
    (progress: number): GPSCoordinate | null => {
      if (route.length === 0) {
        // Fallback realistic center for any custom vehicle when not broadcasting
        return {
          lat: 28.6139,
          lng: 77.209,
          timestamp: Date.now(),
          speed: 0,
          heading: 0,
          ignition: false,
          batteryTamper: false,
          altitude: 48,
          accuracy: 5,
          source: 'SIMULATED',
          provider: 'AIS-140 Standby',
        };
      }

      if (route.length === 1) {
        const p = route[0];
        return {
          lat: p.lat,
          lng: p.lng,
          timestamp: Date.now(),
          speed: p.speed,
          heading: p.heading,
          ignition: p.speed > 0,
          batteryTamper: cleanRegNo === 'KA01MB1029',
          altitude: 50 + Math.random() * 200,
          accuracy: 4,
          source: 'SIMULATED',
        };
      }

      const totalSegments = route.length - 1;
      const scaledProgress = progress * totalSegments;
      const segmentIndex = Math.min(Math.floor(scaledProgress), totalSegments - 1);
      const segmentProgress = scaledProgress - segmentIndex;

      const from = route[segmentIndex];
      const to = route[Math.min(segmentIndex + 1, route.length - 1)];

      const lat = from.lat + (to.lat - from.lat) * segmentProgress;
      const lng = from.lng + (to.lng - from.lng) * segmentProgress;
      const speed = from.speed + (to.speed - from.speed) * segmentProgress;
      const heading = from.heading + (to.heading - from.heading) * segmentProgress;

      const jitterLat = (Math.random() - 0.5) * 0.0003;
      const jitterLng = (Math.random() - 0.5) * 0.0003;
      const jitterSpeed = (Math.random() - 0.5) * 4;

      return {
        lat: lat + jitterLat,
        lng: lng + jitterLng,
        timestamp: Date.now(),
        speed: Math.max(0, Math.round(speed + jitterSpeed)),
        heading: Math.round((heading + 360) % 360),
        ignition: speed > 0,
        batteryTamper: cleanRegNo === 'KA01MB1029',
        altitude: Math.round(50 + Math.random() * 200),
        accuracy: 4,
        source: 'SIMULATED',
        provider: 'AIS-140 Hardware eSIM',
      };
    },
    [route, cleanRegNo]
  );

  // 2. Mock route simulation loop (only active if no hardware GPS is currently broadcasting)
  useEffect(() => {
    // Check if hardware GPS is active first
    const activeTelemetry = getLastKnownTelemetry(cleanRegNo);
    if (activeTelemetry && activeTelemetry.isBroadcasting && Date.now() - activeTelemetry.timestamp < 15000) {
      setIsHardwareGPS(true);
      setHardwareAccuracy(activeTelemetry.accuracy);
      setIsSimulating(false);
      return;
    }

    if (!enabled || route.length === 0) {
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

    const initialPos = interpolate(0);
    if (initialPos) {
      setCurrentPosition(initialPos);
      setPositionHistory([initialPos]);
    }

    const step = 1 / (route.length * 15);

    intervalRef.current = setInterval(() => {
      // Don't overwrite if live hardware GPS broadcast took over
      if (isHardwareBroadcasting()) {
        return;
      }

      progressRef.current += step;

      if (progressRef.current >= 1) {
        progressRef.current = 0;
        setRouteCompleted(true);
      }

      const pos = interpolate(progressRef.current);
      if (pos) {
        setCurrentPosition(pos);
        setPositionHistory((prev) => [...prev.slice(-250), pos]);
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, cleanRegNo, intervalMs, route.length, interpolate]);

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
