import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  Satellite,
  Gauge,
  Compass,
  MapPin,
  Play,
  Square,
  Zap,
  Smartphone,
  ExternalLink,
  Shield,
  AlertCircle,
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
import { formatCoordinate, formatTimestamp, getSpeedColor } from '../../utils/helpers';
import { HardwareGPSBroadcast } from '../../types';

export interface GPSTransmitterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeVehicleRegNo?: string;
  initialRegNumber?: string;
}

export const GPSTransmitterDrawer: React.FC<GPSTransmitterDrawerProps> = ({
  isOpen,
  onClose,
  activeVehicleRegNo,
  initialRegNumber,
}) => {
  const effectiveReg = initialRegNumber || activeVehicleRegNo || 'TS09EA1234';
  const [targetRegNo, setTargetRegNo] = useState(effectiveReg);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isDriveBoost, setIsDriveBoost] = useState(false);
  const [boostSpeed, setBoostSpeed] = useState(40);
  const [telemetry, setTelemetry] = useState<HardwareGPSBroadcast | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reg = initialRegNumber || activeVehicleRegNo;
    if (reg) {
      setTargetRegNo(reg);
    }
  }, [activeVehicleRegNo, initialRegNumber]);

  useEffect(() => {
    if (isOpen) {
      setIsTransmitting(isHardwareBroadcasting());
      const last = getLastKnownTelemetry(targetRegNo);
      if (last) setTelemetry(last);
    }
  }, [isOpen, targetRegNo]);

  if (!isOpen) return null;

  const handleStart = () => {
    setError(null);
    const clean = targetRegNo.replace(/\s/g, '').toUpperCase();
    if (!clean) {
      setError('Please provide a vehicle registration number');
      return;
    }

    const ok = startHardwareBroadcast(
      clean,
      (data) => {
        setTelemetry(data);
        setIsTransmitting(true);
      },
      (err) => {
        setError(err);
      }
    );

    if (ok) setIsTransmitting(true);
  };

  const handleStop = () => {
    stopHardwareBroadcast();
    setIsTransmitting(false);
    setIsDriveBoost(false);
  };

  const handleToggleBoost = () => {
    const clean = targetRegNo.replace(/\s/g, '').toUpperCase();
    if (isDriveBoost) {
      stopSimulatedDrivingBoost();
      setIsDriveBoost(false);
    } else {
      setIsDriveBoost(true);
      enableSimulatedDrivingBoost(clean, boostSpeed, (data) => {
        setTelemetry(data);
        setIsTransmitting(true);
      });
    }
  };

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity" onClick={onClose} />

      {/* Slide-over panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-700/80 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider">
                Hardware GPS Transmitter
              </h3>
              <p className="text-[11px] text-slate-400">
                AIS-140 Physical Satellite Broadcast
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-slate-100">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Bound Vehicle Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Binding Telemetry to Registration Plate
            </label>
            <input
              type="text"
              value={targetRegNo}
              onChange={(e) => setTargetRegNo(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-mono text-sm uppercase text-amber-400 font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Broadcast Trigger */}
          <div>
            {!isTransmitting ? (
              <button
                onClick={handleStart}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Transmit This Device's GPS</span>
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all active:scale-95"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Stop Hardware Broadcast</span>
              </button>
            )}
          </div>

          {/* Live HUD Readouts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between mb-1">
                <span>Speed</span>
                <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className={`text-2xl font-mono font-extrabold ${getSpeedColor(telemetry?.speed || 0)}`}>
                {telemetry ? telemetry.speed : 0} <span className="text-[10px] text-slate-500">KM/H</span>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between mb-1">
                <span>Heading</span>
                <Compass className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-slate-200">
                {telemetry ? `${telemetry.heading}°` : '0°'}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between mb-1">
                <span>Accuracy</span>
                <Satellite className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-lg font-mono font-bold text-emerald-400">
                ±{telemetry ? telemetry.accuracy : 5}m
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between mb-1">
                <span>Altitude</span>
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-lg font-mono font-bold text-slate-200">
                {telemetry ? `${telemetry.altitude}m` : '50m'}
              </div>
            </div>
          </div>

          {/* Coordinates readout */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
            <span className="text-slate-400 block text-[11px] uppercase font-semibold">Live Physical Coordinates:</span>
            <div className="font-mono text-slate-200 font-bold">
              {telemetry
                ? `${formatCoordinate(telemetry.lat, 'lat')} • ${formatCoordinate(telemetry.lng, 'lng')}`
                : 'Waiting for device GPS lock...'}
            </div>
          </div>

          {/* Simulated Driving Boost */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200">Indoor Drive Boost</span>
              </div>
              <button
                onClick={handleToggleBoost}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  isDriveBoost
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30'
                }`}
              >
                {isDriveBoost ? 'Active (Stop)' : 'Enable Boost'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Nudges your coordinates along roads every 2s for testing from your desk.
            </p>
          </div>

          {/* Dedicated full page link */}
          <div className="pt-2">
            <a
              href="/transmitter"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <span>Open Dedicated Mobile Transmitter Screen</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default GPSTransmitterDrawer;
