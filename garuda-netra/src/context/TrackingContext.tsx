import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { VehicleRecord, TrackingSession, AuditLogEntry, GPSCoordinate, NotificationMessage } from '../types';
import { generateId, formatTimestamp } from '../utils/helpers';

interface TrackingContextType {
  // Vehicle
  selectedVehicle: VehicleRecord | null;
  setSelectedVehicle: (v: VehicleRecord | null) => void;
  
  // Tracking session
  activeSession: TrackingSession | null;
  startTracking: (session: Omit<TrackingSession, 'id' | 'startTime' | 'status'>) => void;
  approveTracking: () => void;
  stopTracking: () => void;
  
  // GPS
  currentPosition: GPSCoordinate | null;
  setCurrentPosition: (pos: GPSCoordinate | null) => void;
  positionHistory: GPSCoordinate[];
  addPositionToHistory: (pos: GPSCoordinate) => void;
  clearPositionHistory: () => void;
  
  // Audit log
  auditLog: AuditLogEntry[];
  addAuditEntry: (action: string, performedBy: string, details: string, severity?: AuditLogEntry['severity']) => void;
  
  // Notifications
  notifications: NotificationMessage[];
  addNotification: (notif: Omit<NotificationMessage, 'id' | 'timestamp' | 'status'>) => void;
  
  // Intercept
  interceptAlertSent: boolean;
  setInterceptAlertSent: (v: boolean) => void;
}

const TrackingContext = createContext<TrackingContextType | null>(null);

export function TrackingProvider({ children }: { children: ReactNode }) {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRecord | null>(null);
  const [activeSession, setActiveSession] = useState<TrackingSession | null>(null);
  const [currentPosition, setCurrentPosition] = useState<GPSCoordinate | null>(null);
  const [positionHistory, setPositionHistory] = useState<GPSCoordinate[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [interceptAlertSent, setInterceptAlertSent] = useState(false);

  const startTracking = useCallback(
    (session: Omit<TrackingSession, 'id' | 'startTime' | 'status'>) => {
      const newSession: TrackingSession = {
        ...session,
        id: generateId(),
        startTime: new Date().toISOString(),
        status: session.isEmergencyOverride || session.initiatedBy.role === 'owner' ? 'ACTIVE' : 'PENDING_APPROVAL',
      };
      setActiveSession(newSession);
      setPositionHistory([]);
      setInterceptAlertSent(false);
    },
    []
  );

  const approveTracking = useCallback(() => {
    setActiveSession((prev) => (prev ? { ...prev, status: 'ACTIVE', ownerApproved: true } : null));
  }, []);

  const stopTracking = useCallback(() => {
    setActiveSession(null);
    setCurrentPosition(null);
    setPositionHistory([]);
    setSelectedVehicle(null);
    setInterceptAlertSent(false);
  }, []);

  const addPositionToHistory = useCallback((pos: GPSCoordinate) => {
    setPositionHistory((prev) => [...prev, pos]);
  }, []);

  const clearPositionHistory = useCallback(() => {
    setPositionHistory([]);
  }, []);

  const addAuditEntry = useCallback(
    (action: string, performedBy: string, details: string, severity: AuditLogEntry['severity'] = 'INFO') => {
      const entry: AuditLogEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        action,
        performedBy,
        details,
        severity,
      };
      setAuditLog((prev) => [entry, ...prev]);
    },
    []
  );

  const addNotification = useCallback(
    (notif: Omit<NotificationMessage, 'id' | 'timestamp' | 'status'>) => {
      const notification: NotificationMessage = {
        ...notif,
        id: generateId(),
        timestamp: new Date().toISOString(),
        status: 'SENT',
      };
      setNotifications((prev) => [notification, ...prev]);
    },
    []
  );

  return (
    <TrackingContext.Provider
      value={{
        selectedVehicle,
        setSelectedVehicle,
        activeSession,
        startTracking,
        approveTracking,
        stopTracking,
        currentPosition,
        setCurrentPosition,
        positionHistory,
        addPositionToHistory,
        clearPositionHistory,
        auditLog,
        addAuditEntry,
        notifications,
        addNotification,
        interceptAlertSent,
        setInterceptAlertSent,
      }}
    >
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking(): TrackingContextType {
  const ctx = useContext(TrackingContext);
  if (!ctx) throw new Error('useTracking must be used within TrackingProvider');
  return ctx;
}

export default TrackingProvider;
