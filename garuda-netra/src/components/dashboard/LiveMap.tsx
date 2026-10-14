import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  GPSCoordinate,
  VehicleRecord,
  FASTagScan,
  ANPRSighting,
} from '../../types';
import {
  formatCoordinate,
  formatTimestamp,
  getSpeedColor,
} from '../../utils/helpers';
import {
  Radio,
  Layers,
  Siren,
  Camera,
  CreditCard,
  Compass,
} from 'lucide-react';

interface PoliceUnitItem {
  id: string;
  name: string;
  type: string;
  location: { lat: number; lng: number };
  contactNumber?: string;
  state?: string;
  district?: string;
}

export interface LiveMapProps {
  currentPosition: GPSCoordinate | null;
  positionHistory: GPSCoordinate[];
  vehicle: VehicleRecord;
  fastagScans: FASTagScan[];
  anprSightings: ANPRSighting[];
  showPoliceUnits: boolean;
  policeUnits: PoliceUnitItem[];
}

// Inner helper component to smoothly fly/pan the map
function MapUpdater({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, Math.max(map.getZoom(), 13), { duration: 1.2 });
    }
  }, [position, map]);
  return null;
}

// Custom vehicle DivIcon with ping pulse
const createVehicleIcon = (isMoving: boolean, isTampered: boolean) =>
  L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;inset:0;border-radius:50%;background:${
          isTampered ? '#ef4444' : isMoving ? '#f59e0b' : '#64748b'
        };opacity:0.4;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="position:absolute;inset:2px;border-radius:50%;background:${
          isTampered ? '#ef4444' : isMoving ? '#f59e0b' : '#64748b'
        };opacity:0.2;"></div>
        <div style="position:relative;width:14px;height:14px;border-radius:50%;background:${
          isTampered ? '#ef4444' : isMoving ? '#f59e0b' : '#64748b'
        };border:2px solid #ffffff;box-shadow:0 0 10px ${
      isTampered ? '#ef4444' : '#f59e0b'
    };"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

// Custom Police PCR DivIcon
const createPoliceIcon = () =>
  L.divIcon({
    className: 'custom-police-marker',
    html: `
      <div style="position:relative;width:30px;height:30px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;inset:0;border-radius:50%;background:#ef4444;opacity:0.35;animation:ping 1.2s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="position:relative;width:20px;height:20px;border-radius:50%;background:#dc2626;border:2px solid #ffffff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px #ef4444;">
          <span style="color:#ffffff;font-size:10px;font-weight:bold;line-height:1;">P</span>
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

// Custom Toll Marker DivIcon
const createFASTagIcon = () =>
  L.divIcon({
    className: 'custom-fastag-marker',
    html: `
      <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
        <div style="position:relative;width:18px;height:18px;border-radius:6px;background:#2563eb;border:2px solid #ffffff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px rgba(37,99,235,0.8);">
          <span style="color:#ffffff;font-size:9px;font-weight:900;">T</span>
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

// Custom ANPR Marker DivIcon
const createANPRIcon = () =>
  L.divIcon({
    className: 'custom-anpr-marker',
    html: `
      <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
        <div style="position:relative;width:18px;height:18px;border-radius:6px;background:#9333ea;border:2px solid #ffffff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px rgba(147,51,234,0.8);">
          <span style="color:#ffffff;font-size:9px;font-weight:900;">C</span>
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

const LiveMap: React.FC<LiveMapProps> = ({
  currentPosition,
  positionHistory,
  vehicle,
  fastagScans,
  anprSightings,
  showPoliceUnits,
  policeUnits,
}) => {
  // Layer visibility state
  const [showRoute, setShowRoute] = useState(true);
  const [showFASTag, setShowFASTag] = useState(true);
  const [showANPR, setShowANPR] = useState(true);
  const [policeVisible, setPoliceVisible] = useState(showPoliceUnits);

  useEffect(() => {
    setPoliceVisible(showPoliceUnits);
  }, [showPoliceUnits]);

  // Determine initial center
  // Default to India center [20.5937, 78.9629]
  const defaultCenter: [number, number] = [20.5937, 78.9629];
  const initialZoom = currentPosition ? 13 : 5;

  // Active target center
  const activePosition: [number, number] | null = currentPosition
    ? [currentPosition.lat, currentPosition.lng]
    : fastagScans.length > 0
    ? [fastagScans[0].location.lat, fastagScans[0].location.lng]
    : anprSightings.length > 0
    ? [anprSightings[0].location.lat, anprSightings[0].location.lng]
    : null;

  const isMoving = Boolean(currentPosition && currentPosition.speed > 0);
  const isTampered =
    vehicle.ais140Status === 'TAMPERED' || Boolean(currentPosition?.batteryTamper);

  // Polyline positions array
  const polylinePositions: [number, number][] = positionHistory.map((p) => [
    p.lat,
    p.lng,
  ]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-lg overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      {/* HUD Top-Left Overlay: Coordinates & Lock */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1.5 pointer-events-none">
        <div className="px-3 py-1.5 rounded-md bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-lg flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-wider text-slate-200 uppercase">
              {currentPosition ? 'GPS LOCKED' : 'SEARCHING SATELLITES'}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] font-mono text-amber-400">
            {currentPosition
              ? `${formatCoordinate(currentPosition.lat, 'lat')} • ${formatCoordinate(
                  currentPosition.lng,
                  'lng'
                )}`
              : 'FALLBACK SENSORS ONLY'}
          </span>
        </div>

        {/* Speed readout banner on map */}
        {currentPosition && (
          <div className="px-2.5 py-1 rounded bg-slate-900/85 border border-slate-700/60 backdrop-blur-md flex items-center gap-2 w-fit">
            <Compass className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] font-mono text-slate-300">
              HDG: <span className="font-semibold text-white">{currentPosition.heading}°</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className={`text-[10px] font-mono font-bold ${getSpeedColor(currentPosition.speed)}`}>
              {currentPosition.speed} KM/H
            </span>
          </div>
        )}
      </div>

      {/* HUD Top-Right Overlay: Layer Toggles */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 p-1.5 rounded-lg backdrop-blur-md shadow-xl">
        <button
          onClick={() => setShowRoute(!showRoute)}
          title="Toggle Vehicle Route Trace"
          className={`px-2 py-1 rounded text-[11px] font-mono flex items-center gap-1 transition-colors ${
            showRoute
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3 h-3" />
          Route
        </button>

        <button
          onClick={() => setShowFASTag(!showFASTag)}
          title="Toggle FASTag Toll Plazas"
          className={`px-2 py-1 rounded text-[11px] font-mono flex items-center gap-1 transition-colors ${
            showFASTag
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-3 h-3" />
          FASTag ({fastagScans.length})
        </button>

        <button
          onClick={() => setShowANPR(!showANPR)}
          title="Toggle ANPR Highway Cameras"
          className={`px-2 py-1 rounded text-[11px] font-mono flex items-center gap-1 transition-colors ${
            showANPR
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera className="w-3 h-3" />
          ANPR ({anprSightings.length})
        </button>

        <button
          onClick={() => setPoliceVisible(!policeVisible)}
          title="Toggle PCR Intercept Units"
          className={`px-2 py-1 rounded text-[11px] font-mono flex items-center gap-1 transition-colors ${
            policeVisible
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Siren className="w-3 h-3" />
          Police ({policeUnits.length})
        </button>
      </div>

      {/* Map Legend Overlay (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 z-[1000] px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-lg pointer-events-none text-[11px] text-slate-300 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]" />
          <span>Vehicle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-amber-500" />
          <span>Route</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
          <span>FASTag</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 shadow-[0_0_6px_#a855f7]" />
          <span>ANPR</span>
        </div>
        {policeVisible && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444] animate-ping" />
            <span className="text-red-400 font-semibold">PCR Units</span>
          </div>
        )}
      </div>

      {/* Leaflet Map Container */}
      <MapContainer
        center={activePosition || defaultCenter}
        zoom={initialZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ minHeight: '100%', background: '#0f172a' }}
      >
        {/* CartoDB Dark Matter Tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &bull; Garuda Netra'
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Map View Fly Updater */}
        <MapUpdater position={activePosition} />

        {/* Route Polyline */}
        {showRoute && polylinePositions.length > 1 && (
          <>
            {/* Outer Glow Line */}
            <Polyline
              positions={polylinePositions}
              pathOptions={{
                color: '#f59e0b',
                weight: 8,
                opacity: 0.25,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Core Track Line */}
            <Polyline
              positions={polylinePositions}
              pathOptions={{
                color: '#f59e0b',
                weight: 4,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </>
        )}

        {/* Vehicle Current Position Marker */}
        {currentPosition && (
          <Marker
            position={[currentPosition.lat, currentPosition.lng]}
            icon={createVehicleIcon(isMoving, isTampered)}
          >
            <Popup className="tactical-popup">
              <div className="p-1 space-y-1.5 text-xs text-slate-100">
                <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {vehicle.registrationNumber}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isTampered
                        ? 'bg-red-500/20 text-red-400'
                        : isMoving
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isTampered ? 'TAMPERED' : isMoving ? 'MOVING' : 'STOPPED'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  <span className="text-slate-400">Model:</span> {vehicle.vehicleModel}
                </div>
                <div className="text-[11px] text-slate-300">
                  <span className="text-slate-400">Speed:</span>{' '}
                  <span className={`font-mono font-bold ${getSpeedColor(currentPosition.speed)}`}>
                    {currentPosition.speed} km/h
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  <span className="text-slate-400">Heading:</span> {currentPosition.heading}°
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  {formatCoordinate(currentPosition.lat, 'lat')},{' '}
                  {formatCoordinate(currentPosition.lng, 'lng')}
                </div>
                <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-1">
                  Last ping: {formatTimestamp(new Date(currentPosition.timestamp))}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* FASTag Toll Plaza Markers */}
        {showFASTag &&
          fastagScans.map((scan) => (
            <Marker
              key={scan.id}
              position={[scan.location.lat, scan.location.lng]}
              icon={createFASTagIcon()}
            >
              <Popup>
                <div className="p-1 space-y-1.5 text-xs text-slate-100 min-w-[210px]">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                    <span className="font-semibold text-blue-400 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5" />
                      FASTag Toll Plaza
                    </span>
                    <span className="text-[10px] font-mono bg-blue-900/60 text-blue-300 px-1 rounded">
                      Lane #{scan.laneNumber}
                    </span>
                  </div>
                  <div className="font-bold text-slate-200">{scan.tollPlazaName}</div>
                  <div className="text-[11px] text-slate-300">{scan.highway}</div>
                  <div className="text-[11px] text-slate-300">
                    <span className="text-slate-400">Direction:</span> {scan.direction}
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono">
                    <span className="text-slate-400">TXN:</span> {scan.transactionId}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
                    <span className="text-slate-400">{formatTimestamp(scan.timestamp)}</span>
                    <span className="font-bold text-emerald-400">₹{scan.amount}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* ANPR Camera Sightings Markers */}
        {showANPR &&
          anprSightings.map((sighting) => (
            <Marker
              key={sighting.id}
              position={[sighting.location.lat, sighting.location.lng]}
              icon={createANPRIcon()}
            >
              <Popup>
                <div className="p-1 space-y-1.5 text-xs text-slate-100 min-w-[210px]">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                    <span className="font-semibold text-purple-400 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" />
                      ANPR Camera Sighting
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1 rounded font-bold ${
                        sighting.confidenceScore > 95
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : sighting.confidenceScore > 90
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}
                    >
                      {sighting.confidenceScore}% Match
                    </span>
                  </div>
                  <div className="font-bold text-slate-200">{sighting.cameraLocation}</div>
                  <div className="text-[11px] text-slate-300">
                    <span className="text-slate-400">City:</span> {sighting.city}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    <span className="text-slate-400">Direction:</span> {sighting.direction}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    ID: {sighting.cameraId}
                  </div>
                  <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-1">
                    {formatTimestamp(sighting.timestamp)}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Police PCR Intercept Units Markers */}
        {policeVisible &&
          policeUnits.map((unit) => (
            <Marker
              key={unit.id}
              position={[unit.location.lat, unit.location.lng]}
              icon={createPoliceIcon()}
            >
              <Popup>
                <div className="p-1 space-y-1.5 text-xs text-slate-100 min-w-[210px]">
                  <div className="flex items-center justify-between border-b border-red-800/60 pb-1">
                    <span className="font-semibold text-red-400 flex items-center gap-1">
                      <Siren className="w-3.5 h-3.5 animate-pulse" />
                      Intercept Unit
                    </span>
                    <span className="text-[10px] font-mono bg-red-950 text-red-300 px-1 rounded border border-red-800">
                      {unit.type}
                    </span>
                  </div>
                  <div className="font-bold text-slate-100">{unit.name}</div>
                  {unit.district && (
                    <div className="text-[11px] text-slate-300">
                      <span className="text-slate-400">Jurisdiction:</span> {unit.district},{' '}
                      {unit.state}
                    </div>
                  )}
                  {unit.contactNumber && (
                    <div className="text-[11px] text-amber-300 font-mono">
                      📞 {unit.contactNumber}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-1">
                    Position: {formatCoordinate(unit.location.lat, 'lat')},{' '}
                    {formatCoordinate(unit.location.lng, 'lng')}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
};

export default LiveMap;
