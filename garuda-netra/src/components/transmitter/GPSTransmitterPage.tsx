import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  Satellite,
  Compass,
  Gauge,
  MapPin,
  Play,
  Square,
  Zap,
  ArrowLeft,
  ShieldCheck,
  Smartphone,
  Layers,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  startHardwareBroadcast,
  stopHardwareBroadcast,
  isHardwareBroadcasting,
  enableSimulatedDrivingBoost,
  stopSimulatedDrivingBoost,
  getLastKnownTelemetry,
} from '../../services/hardwareGPSService';
import { getCustomVehicles } from '../../services/vahanService';
import { mockVehicles } from '../../data/mockVehicles';
import { formatCoordinate, formatTimestamp, getSpeedColor, getHeadingDirection } from '../../utils/helpers';
import { HardwareGPSBroadcast } from '../../types';

export const GPSTransmitterPage: React.FC = () => {
  const navigate = useNavigate();

  const [regNo, setRegNo] = useState('TS09EA1234');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isDriveBoost, setIsDriveBoost] = useState(false);
  const [boostSpeed, setBoostSpeed] = useState(45);
  const [currentTelemetry, setCurrentTelemetry] = useState<HardwareGPSBroadcast | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [pingCount, setPingCount] = useState(0);

  // Available vehicle registration options (mock + custom)
  const [vehicleOptions, setVehicleOptions] = useState<string[]>([]);

  useEffect(() => {
    const custom = getCustomVehicles().map((v) => v.registrationNumber);
    const defaults = mockVehicles.map((v) => v.registrationNumber);
    const combined = Array.from(new Set([...custom, ...defaults]));
    setVehicleOptions(combined);
    if (combined.length > 0 && !regNo) {
      setRegNo(combined[0]);
    }
  }, []);

  // Sync initial broadcast state
  useEffect(() => {
    setIsTransmitting(isHardwareBroadcasting());
    const last = getLastKnownTelemetry(regNo);
    if (last) {
      setCurrentTelemetry(last);
    }
  }, [regNo]);

  // Start hardware broadcast
  const handleStartBroadcast = () => {
    setGpsError(null);
    const clean = regNo.replace(/\s/g, '').toUpperCase();
    if (!clean) {
      setGpsError('Please specify a vehicle registration number to bind telemetry to.');
      return;
    }

    const ok = startHardwareBroadcast(
      clean,
      (data) => {
        setCurrentTelemetry(data);
        setIsTransmitting(true);
        setPingCount((c) => c + 1);
      },
      (err) => {
        setGpsError(err);
      }
    );

    if (ok) {
      setIsTransmitting(true);
    }
  };

  const handleStopBroadcast = () => {
    stopHardwareBroadcast();
    setIsTransmitting(false);
    setIsDriveBoost(false);
  };

  const handleToggleDriveBoost = () => {
    const clean = regNo.replace(/\s/g, '').toUpperCase();
    if (isDriveBoost) {
      stopSimulatedDrivingBoost();
      setIsDriveBoost(false);
    } else {
      setIsDriveBoost(true);
      enableSimulatedDrivingBoost(clean, boostSpeed, (data) => {
        setCurrentTelemetry(data);
        setIsTransmitting(true);
        setPingCount((c) => c + 1);
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h1 className="font-extrabold text-sm sm:text-base tracking-wider text-slate-100 uppercase">
              AIS-140 GPS Transmitter
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isTransmitting ? 'bg-emerald-400' : 'bg-slate-600'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isTransmitting ? 'bg-emerald-500' : 'bg-slate-500'
              }`}
            />
          </span>
          <span className="text-xs font-mono font-bold text-slate-300">
            {isTransmitting ? (isDriveBoost ? 'DRIVE BOOST' : 'BROADCASTING') : 'STANDBY'}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Device Status Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Satellite className="w-5 h-5 text-amber-500" />
                <h2 className="font-bold text-base text-slate-200">
                  Live Satellite Hardware Link
                </h2>
              </div>
              <p className="text-xs text-slate-400 max-w-lg">
                Broadcasts physical GPS telemetry from this device (<code className="text-amber-400">navigator.geolocation</code>) directly into the Garuda Netra tracking grid.
              </p>
            </div>

            {/* Transmitter Start/Stop Action */}
            <div className="flex items-center gap-2">
              {!isTransmitting ? (
                <button
                  onClick={handleStartBroadcast}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start GPS Broadcast</span>
                </button>
              ) : (
                <button
                  onClick={handleStopBroadcast}
                  className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all active:scale-95"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop Broadcast</span>
                </button>
              )}
            </div>
          </div>

          {/* Vehicle Binding Input */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Target Vehicle Registration Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. AP04B1234, TS09EA4455, KA01MB1029"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm uppercase placeholder:normal-case placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Quick-Select Registered Vehicles
              </label>
              <select
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm font-mono focus:outline-none focus:border-emerald-500"
              >
                {vehicleOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* GPS Error alert */}
        {gpsError && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}

        {/* Live Hardware Telemetry HUD Gauges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Speedometer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Speed</span>
              <Gauge className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className={`text-2xl sm:text-3xl font-extrabold font-mono ${getSpeedColor(currentTelemetry?.speed || 0)}`}>
                {currentTelemetry ? currentTelemetry.speed : 0}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">KM / H</span>
            </div>
          </div>

          {/* Compass Heading */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Heading</span>
              <Compass className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-slate-200">
                {currentTelemetry ? `${currentTelemetry.heading}°` : '0°'}
              </div>
              <span className="text-[10px] text-blue-400 font-mono font-semibold">
                {currentTelemetry ? getHeadingDirection(currentTelemetry.heading) : 'N'}
              </span>
            </div>
          </div>

          {/* Satellite Accuracy */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Accuracy</span>
              <Satellite className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                ±{currentTelemetry ? currentTelemetry.accuracy : 5}m
              </div>
              <span className="text-[10px] text-slate-500 font-mono">GNSS / NavIC</span>
            </div>
          </div>

          {/* Altitude */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Altitude</span>
              <MapPin className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-slate-200">
                {currentTelemetry ? currentTelemetry.altitude : 48}m
              </div>
              <span className="text-[10px] text-slate-500 font-mono">MSL Elevation</span>
            </div>
          </div>
        </div>

        {/* Coordinates Readout */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-500" />
            <span className="text-slate-400">Current Position:</span>
            <span className="font-mono font-bold text-slate-200">
              {currentTelemetry
                ? `${formatCoordinate(currentTelemetry.lat, 'lat')} • ${formatCoordinate(currentTelemetry.lng, 'lng')}`
                : 'Waiting for GPS hardware lock...'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
            <span>Pings: {pingCount}</span>
            <span>•</span>
            <span>Last Sync: {currentTelemetry ? formatTimestamp(new Date(currentTelemetry.timestamp)) : 'None'}</span>
          </div>
        </div>

        {/* Walk / Drive Boost Section (for testing indoors) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-bold text-sm text-slate-200">
                  Indoor Driving Simulation Boost
                </h3>
                <p className="text-xs text-slate-400">
                  Nudges your coordinates along roads every 2 seconds if testing indoors on a laptop or desk.
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleDriveBoost}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isDriveBoost
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${isDriveBoost ? 'fill-slate-950' : ''}`} />
              <span>{isDriveBoost ? 'Boost Active (Stop)' : 'Engage Drive Boost'}</span>
            </button>
          </div>

          {/* Speed presets */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
            <span className="text-xs text-slate-400 mr-2">Speed Preset:</span>
            {[
              { label: 'Jog / Walk (8 km/h)', speed: 8 },
              { label: 'City Transit (35 km/h)', speed: 35 },
              { label: 'Highway Patrol (65 km/h)', speed: 65 },
              { label: 'Expressway (90 km/h)', speed: 90 },
            ].map((p) => (
              <button
                key={p.speed}
                type="button"
                onClick={() => {
                  setBoostSpeed(p.speed);
                  if (isDriveBoost) {
                    enableSimulatedDrivingBoost(regNo, p.speed, (d) => setCurrentTelemetry(d));
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  boostSpeed === p.speed
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* View on Command Center Quick Action */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
          >
            <span>Return to Garuda Netra Command Center</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
};

export default GPSTransmitterPage;
