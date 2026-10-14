import { useState, useEffect, useRef, useCallback } from 'react';
import { GPSCoordinate, RoutePoint } from '../types';
import { vehicleRoutes } from '../data/mockRoutes';

interface UseGPSSimulationOptions {
  registrationNumber: string;
  enabled: boolean;
  intervalMs?: number;
}

interface UseGPSSimulationResult {
  currentPosition: GPSCoordinate | null;
  positionHistory: GPSCoordinate[];
  isSimulating: boolean;
  routeCompleted: boolean;
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
  const progressRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const route = vehicleRoutes[registrationNumber] || [];

  const interpolate = useCallback(
    (progress: number): GPSCoordinate | null => {
      if (route.length === 0) return null;
      if (route.length === 1) {
        const p = route[0];
        return {
          lat: p.lat,
          lng: p.lng,
          timestamp: Date.now(),
          speed: p.speed,
          heading: p.heading,
          ignition: p.speed > 0,
          batteryTamper: registrationNumber === 'KA01MB1029',
          altitude: 50 + Math.random() * 200,
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

      // Add small random jitter for realism
      const jitterLat = (Math.random() - 0.5) * 0.0005;
      const jitterLng = (Math.random() - 0.5) * 0.0005;
      const jitterSpeed = (Math.random() - 0.5) * 5;

      return {
        lat: lat + jitterLat,
        lng: lng + jitterLng,
        timestamp: Date.now(),
        speed: Math.max(0, Math.round(speed + jitterSpeed)),
        heading: Math.round((heading + 360) % 360),
        ignition: speed > 0,
        batteryTamper: registrationNumber === 'KA01MB1029',
        altitude: Math.round(50 + Math.random() * 200),
      };
    },
    [route, registrationNumber]
  );

  useEffect(() => {
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

    // Generate initial position
    const initialPos = interpolate(0);
    if (initialPos) {
      setCurrentPosition(initialPos);
      setPositionHistory([initialPos]);
    }

    const step = 1 / (route.length * 15); // More steps for smoother animation

    intervalRef.current = setInterval(() => {
      progressRef.current += step;

      if (progressRef.current >= 1) {
        progressRef.current = 0; // Loop the route
        setRouteCompleted(true);
      }

      const pos = interpolate(progressRef.current);
      if (pos) {
        setCurrentPosition(pos);
        setPositionHistory((prev) => {
          const newHistory = [...prev, pos];
          // Keep last 200 points to avoid memory issues
          return newHistory.slice(-200);
        });
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, registrationNumber, intervalMs, route.length, interpolate]);

  return {
    currentPosition,
    positionHistory,
    isSimulating,
    routeCompleted,
  };
}

export default useGPSSimulation;
