import React from 'react';
import {
  MapPin,
  Navigation,
  Gauge,
  Compass,
  Mountain,
  Power,
  BatteryWarning,
  Cpu,
  Signal,
  Clock,
  AlertTriangle,
  Radio,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { GPSCoordinate, VehicleRecord } from '../../types';
import {
  formatCoordinate,
  formatTimestamp,
  getSpeedColor,
  getHeadingDirection,
} from '../../utils/helpers';

interface GPSTelemetryPanelProps {
  position: GPSCoordinate | null;
  vehicle: VehicleRecord;
}

const GPSTelemetryPanel: React.FC<GPSTelemetryPanelProps> = ({ position, vehicle }) => {
  const isTampered = vehicle.ais140Status === 'TAMPERED' || Boolean(position?.batteryTamper);
  const isOffline = vehicle.ais140Status === 'OFFLINE' || (!position && !isTampered);

  // Determine signal status based on AIS-140 status and position presence
  const getSignalStatus = () => {
    if (isTampered) return { label: 'Lost / Tampered', color: 'text-red-400', bg: 'bg-red-500/10', barCount: 0 };
    if (isOffline) return { label: 'No Signal', color: 'text-slate-400', bg: 'bg-slate-700/20', barCount: 0 };
    if (position) {
      if (position.speed > 80) return { label: 'Strong (NavIC + 4G)', color: 'text-emerald-400', bg: 'bg-emerald-500/10', barCount: 4 };
      return { label: 'Strong (NavIC + 4G)', color: 'text-emerald-400', bg: 'bg-emerald-500/10', barCount: 4 };
    }
    return { label: 'Searching...', color: 'text-amber-400', bg: 'bg-amber-500/10', barCount: 1 };
  };

  const signal = getSignalStatus();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xl flex flex-col h-full">
      {/* Panel Header */}
      <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-amber-500 animate-pulse" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            AIS-140 Live Telemetry
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex h-2 w-2 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isTampered
                  ? 'bg-red-400'
                  : isOffline
                  ? 'bg-slate-400'
                  : 'bg-emerald-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isTampered
                  ? 'bg-red-500'
                  : isOffline
                  ? 'bg-slate-500'
                  : 'bg-emerald-500'
              }`}
            />
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {isTampered ? 'TAMPERED' : isOffline ? 'OFFLINE' : 'STREAMING'}
          </span>
        </div>
      </div>

      {/* Warning Banners for Tampered or Offline states */}
      {isTampered && (
        <div className="m-3 p-3 bg-red-950/70 border border-red-600/70 rounded-md text-red-200 flex items-start gap-2.5 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-red-400">
              ⚠ GPS TAMPER DETECTED - Battery Disconnected
            </div>
            <p className="text-[11px] text-red-300/90 mt-0.5 leading-relaxed">
              Internal backup battery engaged or telemetry feed disrupted. Switched to high-priority FASTag & ANPR fallback tracking.
            </p>
          </div>
        </div>
      )}

      {isOffline && !isTampered && (
        <div className="m-3 p-3 bg-amber-950/50 border border-amber-500/50 rounded-md text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-amber-400">
              GPS MODULE OFFLINE - Using Fallback Tracking
            </div>
            <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">
              AIS-140 device is currently not broadcasting satellite fixes. Monitoring NHAI FASTag toll passages and police ANPR cameras.
            </p>
          </div>
        </div>
      )}

      {/* Telemetry Metrics Grid / Rows */}
      <div className="p-3 space-y-2 flex-1 overflow-y-auto">
        {/* Speed Highlight Tile */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-slate-800 text-amber-400">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Ground Speed
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-2xl font-mono font-bold tracking-tight ${
                    position ? getSpeedColor(position.speed) : 'text-slate-500'
                  }`}
                >
                  {position ? position.speed : '0'}
                </span>
                <span className="text-xs font-mono text-slate-400">km/h</span>
              </div>
            </div>
          </div>
          {position && position.speed > 0 && (
            <div className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              IN TRANSIT
            </div>
          )}
          {(!position || position.speed === 0) && (
            <div className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-400 border border-slate-700">
              STATIONARY
            </div>
          )}
        </div>

        {/* Telemetry rows */}
        <div className="grid grid-cols-1 gap-1.5 text-xs">
          {/* Latitude */}
          <div className="p-2 bg-slate-950/40 border border-slate-800/80 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-amber-400/80" />
              <span>Latitude</span>
            </div>
            <div className="font-mono font-semibold text-slate-200">
              {position ? formatCoordinate(position.lat, 'lat') : '13.628800° N (Last Known)'}
            </div>
          </div>

          {/* Longitude */}
          <div className="p-2 bg-slate-950/40 border border-slate-800/80 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <Navigation className="w-3.5 h-3.5 text-amber-400/80" />
              <span>Longitude</span>
            </div>
            <div className="font-mono font-semibold text-slate-200">
              {position ? formatCoordinate(position.lng, 'lng') : '79.419200° E (Last Known)'}
            </div>
          </div>

          {/* Heading */}
          <div className="p-2 bg-slate-950/40 border border-slate-800/80 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <Compass className="w-3.5 h-3.5 text-blue-400/80" />
              <span>Heading</span>
            </div>
            <div className="font-mono font-semibold text-slate-200 flex items-center gap-1.5">
              <span>{position ? `${position.heading}° (${getHeadingDirection(position.heading)})` : '105° (ESE)'}</span>
            </div>
          </div>

          {/* Altitude */}
          <div className="p-2 bg-slate-950/40 border border-slate-800/80 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <Mountain className="w-3.5 h-3.5 text-slate-400" />
              <span>Altitude</span>
            </div>
            <div className="font-mono font-semibold text-slate-200">
              {position ? `${Math.round(position.altitude)} m` : '152 m MSL'}
            </div>
          </div>

          {/* Ignition */}
          <div className="p-2 bg-slate-950/40 border border-slate-800/80 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <Power className="w-3.5 h-3.5 text-slate-400" />
              <span>Ignition Status</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono font-semibold">
              <span
                className={`h-2 w-2 rounded-full ${
                  position?.ignition ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-red-500'
                }`}
              />
              <span className={position?.ignition ? 'text-emerald-400' : 'text-red-400'}>
                {position?.ignition ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>

          {/* Battery Tamper */}
          <div className="p-2 bg-slate-950/40 border border-slate-800/80 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <BatteryWarning className="w-3.5 h-3.5 text-slate-400" />
              <span>Battery Tamper</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono font-semibold">
              {isTampered ? (
                <span className="text-red-400 flex items-center gap-1 animate-pulse">
                  <Zap className="w-3 h-3 text-red-500" />
                  ALERT (Disconnected)
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Normal (12.6V)
                </span>
              )}
            </div>
          </div>

          {/* GPS IMEI */}
          <div className="p-2 bg-slate-950/40 border border-slate-800/80 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-purple-400/80" />
              <span>GPS IMEI</span>
            </div>
            <div className="font-mono text-slate-300 tracking-wider">
              {vehicle.gpsImei || '864209040182741'}
            </div>
          </div>

          {/* Signal Quality */}
          <div className="p-2 bg-slate-950/40 border border-slate-800/80 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <Signal className="w-3.5 h-3.5 text-cyan-400/80" />
              <span>Signal Quality</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-end gap-0.5 h-3">
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className={`w-1 rounded-sm ${
                      bar <= signal.barCount
                        ? 'bg-emerald-400'
                        : 'bg-slate-700'
                    }`}
                    style={{ height: `${bar * 25}%` }}
                  />
                ))}
              </div>
              <span className={`font-mono text-[11px] font-medium ${signal.color}`}>
                {signal.label}
              </span>
            </div>
          </div>

          {/* Last Updated */}
          <div className="p-2 bg-slate-950/40 border border-slate-800/80 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Last Packet</span>
            </div>
            <div className="font-mono text-[11px] text-slate-300">
              {position?.timestamp ? formatTimestamp(new Date(position.timestamp)) : '2026-10-14 05:42:19 IST'}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          MoRTH AIS-140 Specification v2.1
        </span>
        <span className="font-mono text-slate-500">IRNSS/NavIC</span>
      </div>
    </div>
  );
};

export default GPSTelemetryPanel;
