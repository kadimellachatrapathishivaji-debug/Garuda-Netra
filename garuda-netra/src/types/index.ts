export type UserRole = 'owner' | 'government';

export interface OwnerUser {
  role: 'owner';
  mobile: string;
  name: string;
  isVerified: boolean;
}

export interface GovUser {
  role: 'government';
  email: string;
  badgeId: string;
  department: string;
  state: string;
  rank: string;
  name: string;
}

export type User = OwnerUser | GovUser;

export interface VehicleRecord {
  registrationNumber: string;
  ownerName: string;
  mobileNumber: string; // full number for internal matching
  maskedMobile: string; // display version like +91 ******4321
  vehicleModel: string;
  vehicleClass: string;
  chassisNumber: string;
  maskedChassis: string;
  engineNumber: string;
  fuelType: string;
  color: string;
  registrationDate: string;
  insuranceExpiry: string;
  ais140Status: 'ACTIVE' | 'OFFLINE' | 'TAMPERED';
  gpsImei: string;
  fastagId: string;
  fastagStatus: 'ACTIVE' | 'INACTIVE';
  stateRTO: string;
  isCustomRegistered?: boolean;
  isHardwareLinked?: boolean;
  dataSource?: 'VAHAN_API' | 'LOCAL_REGISTRY' | 'SYNTHESIZED';
}

export interface GPSCoordinate {
  lat: number;
  lng: number;
  timestamp: number;
  speed: number; // km/h
  heading: number; // degrees 0-360
  ignition: boolean;
  batteryTamper: boolean;
  altitude: number;
  accuracy?: number; // satellite accuracy in meters (e.g. ±3.5m)
  source?: 'HARDWARE' | 'SIMULATED' | 'BOOSTED';
  provider?: string; // e.g. "Device GPS / NavIC"
}

export interface HardwareGPSBroadcast {
  regNo: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  accuracy: number;
  altitude: number;
  timestamp: number;
  isBroadcasting: boolean;
  isSimulatedDrive: boolean;
  source: 'HARDWARE' | 'SIMULATED' | 'BOOSTED';
}

export interface RoutePoint {
  lat: number;
  lng: number;
  speed: number;
  heading: number;
}

export interface FASTagScan {
  id: string;
  tollPlazaName: string;
  location: { lat: number; lng: number };
  highway: string;
  timestamp: string;
  laneNumber: number;
  transactionId: string;
  amount: number;
  direction: string;
}

export interface ANPRSighting {
  id: string;
  cameraId: string;
  cameraLocation: string;
  location: { lat: number; lng: number };
  timestamp: string;
  confidenceScore: number;
  capturedImage: string; // placeholder URL
  direction: string;
  city: string;
}

export interface TrackingSession {
  id: string;
  vehicleRegNo: string;
  initiatedBy: User;
  firNumber?: string;
  isEmergencyOverride: boolean;
  ownerApproved: boolean;
  startTime: string;
  status: 'PENDING_APPROVAL' | 'ACTIVE' | 'COMPLETED' | 'REJECTED';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface InterceptAlert {
  id: string;
  vehicleRegNo: string;
  lastKnownLat: number;
  lastKnownLng: number;
  nearestPCR: string;
  alertTime: string;
  status: 'DISPATCHED' | 'ACKNOWLEDGED' | 'INTERCEPTED';
}

export interface NotificationMessage {
  id: string;
  type: 'SMS' | 'PUSH' | 'EMAIL';
  recipient: string;
  message: string;
  timestamp: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
}

export type { PoliceUnit } from '../data/mockPoliceStations';

