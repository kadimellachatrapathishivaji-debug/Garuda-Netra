import React, { useState } from 'react';
import {
  CreditCard,
  Camera,
  AlertTriangle,
  Clock,
  MapPin,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { FASTagScan, ANPRSighting, VehicleRecord } from '../../types';
import { formatTimestamp } from '../../utils/helpers';

export interface FallbackTrackingTimelineProps {
  fastagScans: FASTagScan[];
  anprSightings: ANPRSighting[];
  vehicle: VehicleRecord;
}

const FallbackTrackingTimeline: React.FC<FallbackTrackingTimelineProps> = ({
  fastagScans,
  anprSightings,
  vehicle,
}) => {
  const [activeTab, setActiveTab] = useState<'fastag' | 'anpr'>('fastag');

  const isFallbackActive =
    vehicle.ais140Status === 'TAMPERED' || vehicle.ais140Status === 'OFFLINE';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xl flex flex-col h-full">
      {/* Top Header / Fallback Tracking Status */}
      <div className="px-4 py-3 bg-slate-850 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Checkpoint Feed
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            NHAI & State Police
          </span>
        </div>

        {/* Fallback Active Banner */}
        {isFallbackActive && (
          <div className="mt-2.5 p-2.5 bg-amber-950/60 border border-amber-500/60 rounded-md text-amber-200 flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-[11px] font-bold tracking-wide uppercase text-amber-300">
              FALLBACK TRACKING ACTIVE
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 p-1">
        <button
          onClick={() => setActiveTab('fastag')}
          className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
            activeTab === 'fastag'
              ? 'bg-slate-800 text-blue-400 shadow-sm border border-slate-700 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>FASTag Tolls</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === 'fastag'
                ? 'bg-blue-500/20 text-blue-300'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            {fastagScans.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('anpr')}
          className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
            activeTab === 'anpr'
              ? 'bg-slate-800 text-purple-400 shadow-sm border border-slate-700 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>ANPR Sightings</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === 'anpr'
                ? 'bg-purple-500/20 text-purple-300'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            {anprSightings.length}
          </span>
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'fastag' && (
          <div className="space-y-3">
            {fastagScans.length === 0 ? (
              <div className="py-12 px-4 text-center text-slate-500">
                <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-xs font-medium text-slate-400">No FASTag scans recorded</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  No toll plaza transactions detected in NHAI NETC network.
                </p>
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-800 ml-3.5 pl-4 space-y-4">
                {fastagScans.map((scan, idx) => (
                  <div key={scan.id} className="relative group">
                    {/* Blue Timeline Marker Dot */}
                    <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-blue-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    </div>

                    {/* Timeline Item Card */}
                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                          <span>{scan.tollPlazaName}</span>
                          {idx === 0 && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                              LATEST
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40 shrink-0">
                          ₹{scan.amount}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{scan.highway}</span>
                      </div>

                      <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="text-slate-400">Dir:</span>
                        <span className="font-medium text-slate-200">{scan.direction}</span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-mono text-slate-400">Lane #{scan.laneNumber}</span>
                        <span className="font-mono text-slate-500 truncate max-w-[120px]" title={scan.transactionId}>
                          {scan.transactionId}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{formatTimestamp(scan.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'anpr' && (
          <div className="space-y-3">
            {anprSightings.length === 0 ? (
              <div className="py-12 px-4 text-center text-slate-500">
                <Camera className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-xs font-medium text-slate-400">No ANPR sightings recorded</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Optical number plate recognition cameras have not registered a match yet.
                </p>
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-800 ml-3.5 pl-4 space-y-4">
                {anprSightings.map((sighting, idx) => {
                  const isHighConf = sighting.confidenceScore >= 95;
                  const isMedConf = sighting.confidenceScore >= 90 && sighting.confidenceScore < 95;

                  return (
                    <div key={sighting.id} className="relative group">
                      {/* Purple Timeline Marker Dot */}
                      <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-purple-500 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      </div>

                      {/* Timeline Item Card */}
                      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                            <span className="truncate">{sighting.cameraLocation}</span>
                            {idx === 0 && (
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                RECENT
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold border shrink-0 ${
                              isHighConf
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                                : isMedConf
                                ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                                : 'bg-red-950/60 text-red-400 border-red-800/60'
                            }`}
                          >
                            {sighting.confidenceScore}%
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{sighting.city}</span>
                        </div>

                        <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-purple-400 shrink-0" />
                          <span className="text-slate-400">Dir:</span>
                          <span className="font-medium text-slate-200">{sighting.direction}</span>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-mono text-slate-500">Camera: {sighting.cameraId}</span>
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Match
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{formatTimestamp(sighting.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          FASTag NETC + ITMS Network
        </span>
        <span className="font-mono text-slate-500">Auto-Polling</span>
      </div>
    </div>
  );
};

export default FallbackTrackingTimeline;
