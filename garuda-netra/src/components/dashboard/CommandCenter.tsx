import React, { useEffect, useState } from 'react';
import {
  Eye,
  AlertTriangle,
  LogOut,
  Square,
  Car,
  Activity,
  History,
  Radio,
  RadioTower,
  Sparkles,
} from 'lucide-react';
import { VehicleRecord } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTracking } from '../../context/TrackingContext';
import { useGPSSimulation } from '../../hooks/useGPSSimulation';
import { fastagScans } from '../../data/mockFASTag';
import { anprSightings } from '../../data/mockANPR';
import { nearbyPoliceUnits } from '../../data/mockPoliceStations';
import { formatTimestamp } from '../../utils/helpers';

import LiveMap from './LiveMap';
import GPSTelemetryPanel from './GPSTelemetryPanel';
import FallbackTrackingTimeline from './FallbackTrackingTimeline';
import ActionControls from './ActionControls';
import GPSTransmitterDrawer from '../transmitter/GPSTransmitterDrawer';

export interface CommandCenterProps {
  vehicle: VehicleRecord;
  onStopTracking: () => void;
}

const CommandCenter: React.FC<CommandCenterProps> = ({
  vehicle,
  onStopTracking,
}) => {
  const { user, logout } = useAuth();
  const {
    activeSession,
    stopTracking: contextStopTracking,
    setCurrentPosition: setContextPosition,
    interceptAlertSent,
    auditLog,
  } = useTracking();

  // Subtab for left sidebar (telemetry vs specs vs audit)
  const [activeLeftTab, setActiveLeftTab] = useState<'telemetry' | 'details' | 'audit'>('telemetry');
  const [isTransmitterDrawerOpen, setIsTransmitterDrawerOpen] = useState(false);

  // GPS Simulation & Hardware Hook
  const isAis140Active = vehicle.ais140Status === 'ACTIVE';
  const {
    currentPosition,
    positionHistory,
    isHardwareGPS,
    hardwareAccuracy,
    isDriveBoostActive,
    toggleDeviceGPS,
    toggleDriveBoost,
  } = useGPSSimulation({
    registrationNumber: vehicle.registrationNumber,
    enabled: isAis140Active,
  });

  // Sync simulated position to TrackingContext
  useEffect(() => {
    if (currentPosition) {
      setContextPosition(currentPosition);
    }
  }, [currentPosition, setContextPosition]);

  // Retrieve FASTag, ANPR, and Police Unit records
  const vehicleFASTag = fastagScans[vehicle.registrationNumber] || [];
  const vehicleANPR = anprSightings[vehicle.registrationNumber] || [];
  const policeUnitList = nearbyPoliceUnits[vehicle.registrationNumber] || [];

  // Tracker Identity string
  const trackerInfo = user
    ? user.role === 'government'
      ? `${user.name} (${user.badgeId} • ${user.rank})`
      : `${user.name} (Owner • ${user.mobile})`
    : activeSession?.initiatedBy
    ? activeSession.initiatedBy.name
    : 'National Command Center';

  // Tracking status string
  const trackingStatus = activeSession?.status || 'ACTIVE';

  const handleStopTrackingClick = () => {
    contextStopTracking();
    onStopTracking();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* ======================================================== */}
      {/* 1. TOP BAR                                               */}
      {/* ======================================================== */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-20 shadow-lg">
        {/* Logo and System Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <Eye className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-wider text-slate-100">
                GARUDA <span className="text-amber-400">NETRA</span>
              </span>
              <span className="hidden md:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/30">
                MoRTH / CCTNS v2.4
              </span>
            </div>
            <p className="hidden sm:block text-[10px] text-slate-400 tracking-tight">
              National Missing Vehicle Tracking & Tactical Intercept Network
            </p>
          </div>
        </div>

        {/* Center: Vehicle Info & Status Pill */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Target Vehicle Tag */}
          <div className="px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center gap-2">
            <Car className="w-4 h-4 text-amber-400" />
            <div>
              <div className="font-mono font-bold text-xs sm:text-sm text-amber-400 leading-tight">
                {vehicle.registrationNumber}
              </div>
              <div className="text-[10px] text-slate-400 hidden sm:block leading-tight">
                {vehicle.vehicleModel}
              </div>
            </div>
          </div>

          {/* Tracking Status Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg">
            <span className="flex h-2.5 w-2.5 relative">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  trackingStatus === 'ACTIVE'
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  trackingStatus === 'ACTIVE'
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
              />
            </span>
            <div className="text-[11px] font-mono">
              <span className="text-slate-400">STATUS:</span>{' '}
              <span
                className={`font-bold ${
                  trackingStatus === 'ACTIVE'
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {trackingStatus}
              </span>
            </div>
          </div>

          {/* AIS-140 Status Indicator */}
          <div
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold flex items-center gap-1.5 border ${
              vehicle.ais140Status === 'ACTIVE'
                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60'
                : vehicle.ais140Status === 'TAMPERED'
                ? 'bg-red-950/60 text-red-400 border-red-700 animate-pulse'
                : 'bg-amber-950/50 text-amber-400 border-amber-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>AIS-140: {vehicle.ais140Status}</span>
          </div>
        </div>

        {/* Right: Hardware GPS Connection & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* One-Click Connect This Device's GPS */}
          <button
            onClick={() => toggleDeviceGPS()}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 border ${
              isHardwareGPS
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/50 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-amber-500/40 shadow-sm'
            }`}
            title={
              isHardwareGPS
                ? 'Disconnect this device from streaming GPS to this vehicle'
                : `Connect this device's real GPS sensor to vehicle ${vehicle.registrationNumber}`
            }
          >
            <RadioTower className={`w-3.5 h-3.5 ${isHardwareGPS ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">
              {isHardwareGPS ? 'Device GPS Linked' : `Connect Device GPS`}
            </span>
            <span className="sm:hidden">{isHardwareGPS ? 'Linked' : 'Connect GPS'}</span>
          </button>

          {/* Quick open Transmitter drawer */}
          <button
            onClick={() => setIsTransmitterDrawerOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95"
            title="Open Live GPS Transmitter Console"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">Transmitter</span>
          </button>

          {/* Stop Tracking Button */}
          <button
            onClick={handleStopTrackingClick}
            className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
            title="Conclude current vehicle tracking mission"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Stop</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95"
            title="Log out of Garuda Netra"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Prominent High-Visibility Live Hardware GPS Signal Banner */}
      {isHardwareGPS && (
        <div className="bg-emerald-950/90 border-b border-emerald-600/80 px-4 py-2 flex items-center justify-between text-xs text-emerald-100 z-10 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-bold uppercase tracking-wider text-emerald-300">
              LIVE HARDWARE GPS SIGNAL (AIS-140 ACTIVE)
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/40">
              ±{hardwareAccuracy ? Math.round(hardwareAccuracy) : 4}m ACCURACY
            </span>
            {isDriveBoostActive && (
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/40 hidden sm:inline-block">
                DRIVE BOOST ACTIVE (+45 KM/H)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleDriveBoost(45)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${
                isDriveBoostActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-emerald-900/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60'
              }`}
            >
              {isDriveBoostActive ? 'Stop Boost' : 'Simulate Drive (+45 km/h)'}
            </button>
            <button
              onClick={() => setIsTransmitterDrawerOpen(true)}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-medium"
            >
              Configure Sensor
            </button>
          </div>
        </div>
      )}

      {/* Prominent High-Visibility Fallback Header if GPS TAMPERED or OFFLINE */}
      {!isAis140Active && !isHardwareGPS && (
        <div className="bg-amber-950/90 border-b border-amber-600/70 px-4 py-2 flex items-center justify-between text-xs text-amber-100 z-10 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider text-amber-300">
                TACTICAL NOTICE: GPS MODULE {vehicle.ais140Status}
              </span>
              <span className="text-amber-200/90 ml-2 hidden sm:inline">
                Real-time satellite link severed. Autonomous Multi-Agency Fallback Mode is engaged across NHAI FASTag and Police ANPR feeds.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
            <span className="text-amber-300">FASTag: {vehicleFASTag.length} scans</span>
            <span className="text-purple-300">ANPR: {vehicleANPR.length} sightings</span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MAIN 3-COLUMN DASHBOARD GRID                         */}
      {/* Left Sidebar (25%) | Center Map (50%) | Right (25%)     */}
      {/* ======================================================== */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden min-h-0 bg-slate-950">
        {/* ------------------------------------------------------ */}
        {/* LEFT COLUMN: Telemetry + Vehicle Details + Quick Audit */}
        {/* ------------------------------------------------------ */}
        <section className="lg:col-span-3 flex flex-col gap-3 min-h-0 h-full overflow-hidden">
          {/* Subtabs for Left Sidebar (Telemetry vs Specs vs Audit) */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1 shrink-0 text-xs">
            <button
              onClick={() => setActiveLeftTab('telemetry')}
              className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                activeLeftTab === 'telemetry'
                  ? 'bg-slate-800 text-amber-400 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Telemetry
            </button>
            <button
              onClick={() => setActiveLeftTab('details')}
              className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                activeLeftTab === 'details'
                  ? 'bg-slate-800 text-amber-400 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Specs
            </button>
            <button
              onClick={() => setActiveLeftTab('audit')}
              className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                activeLeftTab === 'audit'
                  ? 'bg-slate-800 text-amber-400 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Audit ({auditLog.length})
            </button>
          </div>

          {/* Left Subtab 1: Telemetry Panel */}
          {activeLeftTab === 'telemetry' && (
            <div className="flex-1 min-h-0">
              <GPSTelemetryPanel position={currentPosition} vehicle={vehicle} />
            </div>
          )}

          {/* Left Subtab 2: Detailed Vehicle Record */}
          {activeLeftTab === 'details' && (
            <div className="flex-1 min-h-0 bg-slate-900 border border-slate-800 rounded-lg overflow-y-auto p-3 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-amber-400" />
                  Vehicle Dossier
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  VAHAN Database
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded">
                  <div className="text-[10px] text-slate-400">Registered Owner</div>
                  <div className="font-semibold text-slate-100">{vehicle.ownerName}</div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">{vehicle.maskedMobile}</div>
                </div>

                <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded">
                  <div className="text-[10px] text-slate-400">Vehicle Model & Class</div>
                  <div className="font-semibold text-slate-100">{vehicle.vehicleModel}</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">{vehicle.vehicleClass} • {vehicle.color}</div>
                </div>

                <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded">
                  <div className="text-[10px] text-slate-400">Chassis & Engine</div>
                  <div className="font-mono text-[11px] text-slate-200">Chassis: {vehicle.maskedChassis}</div>
                  <div className="font-mono text-[11px] text-slate-300 mt-0.5">Engine: {vehicle.engineNumber}</div>
                </div>

                <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded">
                  <div className="text-[10px] text-slate-400">Fuel & State RTO</div>
                  <div className="font-semibold text-slate-100">{vehicle.fuelType}</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">{vehicle.stateRTO}</div>
                </div>

                <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded">
                  <div className="text-[10px] text-slate-400">FASTag RFID Identifier</div>
                  <div className="font-mono text-[11px] text-blue-300">{vehicle.fastagId}</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Status: {vehicle.fastagStatus}</div>
                </div>

                <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded">
                  <div className="text-[10px] text-slate-400">Registration & Insurance Expiry</div>
                  <div className="text-[11px] text-slate-300">Registered: {vehicle.registrationDate}</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">Valid Till: {vehicle.insuranceExpiry}</div>
                </div>
              </div>
            </div>
          )}

          {/* Left Subtab 3: Quick Audit Log Feed */}
          {activeLeftTab === 'audit' && (
            <div className="flex-1 min-h-0 bg-slate-900 border border-slate-800 rounded-lg overflow-y-auto p-3 shadow-xl space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-amber-400" />
                  Live Activity Audit
                </span>
                <span className="text-[10px] font-mono text-emerald-400">LIVE FEED</span>
              </div>

              {auditLog.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Session initialized. Awaiting event logs.
                </div>
              ) : (
                auditLog.map((log) => (
                  <div key={log.id} className="p-2 bg-slate-950/60 border border-slate-800/70 rounded text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[11px] text-slate-200">{log.action}</span>
                      <span
                        className={`text-[9px] font-mono px-1 rounded uppercase ${
                          log.severity === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400'
                            : log.severity === 'WARNING'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {log.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{log.details}</p>
                    <div className="text-[9px] text-slate-500 font-mono flex items-center justify-between pt-0.5">
                      <span>{log.performedBy}</span>
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {/* ------------------------------------------------------ */}
        {/* CENTER COLUMN (50%): Interactive Leaflet Live Map      */}
        {/* ------------------------------------------------------ */}
        <section className="lg:col-span-6 flex flex-col min-h-[420px] lg:min-h-0 h-full overflow-hidden">
          <LiveMap
            currentPosition={currentPosition}
            positionHistory={positionHistory}
            vehicle={vehicle}
            fastagScans={vehicleFASTag}
            anprSightings={vehicleANPR}
            showPoliceUnits={interceptAlertSent}
            policeUnits={policeUnitList}
            isHardwareGPS={isHardwareGPS}
          />
        </section>

        {/* ------------------------------------------------------ */}
        {/* RIGHT COLUMN (25%): FASTag & ANPR Fallback Timeline    */}
        {/* ------------------------------------------------------ */}
        <section className="lg:col-span-3 flex flex-col min-h-0 h-full overflow-hidden">
          <FallbackTrackingTimeline
            fastagScans={vehicleFASTag}
            anprSightings={vehicleANPR}
            vehicle={vehicle}
          />
        </section>
      </main>

      {/* ======================================================== */}
      {/* 3. BOTTOM BAR: Action Controls                          */}
      {/* ======================================================== */}
      <footer className="shrink-0 z-20">
        <ActionControls
          vehicle={vehicle}
          currentPosition={currentPosition}
          positionHistory={positionHistory}
        />
      </footer>

      {/* Slide-Over GPS Hardware Transmitter Drawer */}
      <GPSTransmitterDrawer
        isOpen={isTransmitterDrawerOpen}
        onClose={() => setIsTransmitterDrawerOpen(false)}
        initialRegNumber={vehicle.registrationNumber}
      />
    </div>
  );
};

export default CommandCenter;
