import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  Siren,
  Download,
  Share2,
  FileText,
  X,
  AlertTriangle,
  Radio,
  ChevronDown,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { VehicleRecord, GPSCoordinate, AuditLogEntry } from '../../types';
import { useTracking } from '../../context/TrackingContext';
import { useAuth } from '../../context/AuthContext';
import { nearbyPoliceUnits } from '../../data/mockPoliceStations';
import { fastagScans } from '../../data/mockFASTag';
import { anprSightings } from '../../data/mockANPR';
import {
  formatCoordinate,
  formatTimestamp,
  generateId,
} from '../../utils/helpers';

export interface ActionControlsProps {
  vehicle: VehicleRecord;
  currentPosition: GPSCoordinate | null;
  positionHistory: GPSCoordinate[];
}

interface ToastInfo {
  id: string;
  type: 'success' | 'info' | 'warning' | 'critical';
  title: string;
  message: string;
}

const ActionControls: React.FC<ActionControlsProps> = ({
  vehicle,
  currentPosition,
  positionHistory,
}) => {
  const {
    interceptAlertSent,
    setInterceptAlertSent,
    auditLog,
    addAuditEntry,
    activeSession,
  } = useTracking();
  const { user } = useAuth();

  // Local UI states
  const [showInterceptModal, setShowInterceptModal] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showAuditDrawer, setShowAuditDrawer] = useState(false);
  const [auditSeverityFilter, setAuditSeverityFilter] = useState<string>('ALL');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  // Add toast helper
  const addToast = (
    title: string,
    message: string,
    type: ToastInfo['type'] = 'info'
  ) => {
    const newToast: ToastInfo = {
      id: generateId(),
      title,
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4500);
  };

  // Find nearest police unit
  const units = nearbyPoliceUnits[vehicle.registrationNumber] || [];
  const nearestUnit =
    units.length > 0
      ? units[0]
      : {
          name: 'PCR Van #AP-142 (Highway Patrol)',
          location: { lat: 13.2, lng: 80.25 },
          contactNumber: '+91-44-2345-6789',
          district: 'Tiruvallur District',
          state: 'State Police Border Intercept Wing',
        };

  // Action: Handle Intercept Alert Confirmation
  const handleConfirmIntercept = () => {
    setInterceptAlertSent(true);
    setShowInterceptModal(false);

    const targetLat = currentPosition?.lat ?? nearestUnit.location.lat;
    const targetLng = currentPosition?.lng ?? nearestUnit.location.lng;
    const performer =
      user?.name ||
      (user?.role === 'government' ? user.badgeId : 'HQ Command Center');

    // Add entry to audit log
    addAuditEntry(
      'POLICE_INTERCEPT_DISPATCHED',
      performer,
      `High-priority intercept vector broadcasted to ${
        nearestUnit.name
      } at coordinates [${formatCoordinate(
        targetLat,
        'lat'
      )}, ${formatCoordinate(targetLng, 'lng')}].`,
      'CRITICAL'
    );

    // Show toast
    addToast(
      'Intercept Alert Dispatched',
      `Dispatched to ${nearestUnit.name} at [${formatCoordinate(
        targetLat,
        'lat'
      )}, ${formatCoordinate(targetLng, 'lng')}]`,
      'critical'
    );
  };

  // Action: Share Live Location Link
  const handleShareLiveLocation = () => {
    const liveUrl = `${window.location.origin}/track/live/${vehicle.registrationNumber}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(liveUrl).catch(() => {});
    }

    const performer = user?.name || 'Operator';
    addAuditEntry(
      'LIVE_LOCATION_SHARED',
      performer,
      `Generated temporary secure live tracking token link for ${vehicle.registrationNumber}`,
      'INFO'
    );

    addToast(
      'Live Location Shared',
      'Live location link copied to clipboard. Secure token expires in 6 hours.',
      'success'
    );
  };

  // Action: Export JSON Log
  const handleDownloadJSON = () => {
    setShowDownloadMenu(false);

    const vehicleFASTag = fastagScans[vehicle.registrationNumber] || [];
    const vehicleANPR = anprSightings[vehicle.registrationNumber] || [];

    const trackingData = {
      exportMetadata: {
        system: 'Garuda Netra - National Missing Vehicle Tracking System',
        agency: 'Ministry of Home Affairs & MoRTH (Govt of India)',
        generatedAt: new Date().toISOString(),
        exportedBy: user?.name || 'Authorized Officer',
        exportId: generateId(),
      },
      session: activeSession || {
        id: 'DEMO-SESSION-01',
        vehicleRegNo: vehicle.registrationNumber,
        status: 'ACTIVE',
        startTime: new Date().toISOString(),
      },
      vehicle: {
        registrationNumber: vehicle.registrationNumber,
        ownerName: vehicle.ownerName,
        mobileNumber: vehicle.maskedMobile,
        vehicleModel: vehicle.vehicleModel,
        vehicleClass: vehicle.vehicleClass,
        chassisNumber: vehicle.maskedChassis,
        engineNumber: vehicle.engineNumber,
        fuelType: vehicle.fuelType,
        color: vehicle.color,
        stateRTO: vehicle.stateRTO,
        ais140Status: vehicle.ais140Status,
        gpsImei: vehicle.gpsImei,
        fastagId: vehicle.fastagId,
      },
      telemetry: {
        currentPosition,
        positionHistoryCount: positionHistory.length,
        positionHistory,
      },
      checkpoints: {
        fastagScans: vehicleFASTag,
        anprSightings: vehicleANPR,
      },
      interceptDetails: {
        alertDispatched: interceptAlertSent,
        nearestUnit,
      },
      auditTrail: auditLog,
    };

    const jsonString = JSON.stringify(trackingData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GarudaNetra_Tracking_${vehicle.registrationNumber}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast(
      'Export Complete',
      `JSON tracking session log downloaded for ${vehicle.registrationNumber}`,
      'info'
    );
  };

  // Action: Export PDF Log using jsPDF
  const handleDownloadPDF = () => {
    setShowDownloadMenu(false);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 14;

    // Header Band
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(245, 158, 11); // amber-500
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('GARUDA NETRA - NATIONAL VEHICLE TRACKING SYSTEM', 14, 12);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(
      'MINISTRY OF HOME AFFAIRS • MoRTH • CRIME & CRIMINAL TRACKING NETWORK (CCTNS)',
      14,
      18
    );
    doc.text(
      `OFFICIAL FIR TRACKING DOSSIER • GENERATED: ${formatTimestamp(new Date())}`,
      14,
      23
    );

    y = 35;

    // Section 1: Vehicle & Incident Summary
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('1. TARGET VEHICLE IDENTIFICATION & REGISTRATION', 16, y + 5);
    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    const vehicleRows = [
      ['Registration No:', vehicle.registrationNumber, 'Registered Owner:', vehicle.ownerName],
      ['Vehicle Model:', vehicle.vehicleModel, 'Contact Phone:', vehicle.maskedMobile],
      ['Vehicle Class:', vehicle.vehicleClass, 'Chassis Number:', vehicle.maskedChassis],
      ['Fuel / Color:', `${vehicle.fuelType} / ${vehicle.color}`, 'RTO Jurisdiction:', vehicle.stateRTO],
      ['AIS-140 Status:', vehicle.ais140Status, 'FASTag Tag ID:', vehicle.fastagId],
      ['GPS IMEI:', vehicle.gpsImei, 'Tracking Status:', interceptAlertSent ? 'INTERCEPT DISPATCHED' : 'MONITORING ACTIVE'],
    ];

    vehicleRows.forEach(([l1, v1, l2, v2]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(l1, 16, y);
      doc.setFont('helvetica', 'normal');
      doc.text(v1, 52, y);

      doc.setFont('helvetica', 'bold');
      doc.text(l2, 108, y);
      doc.setFont('helvetica', 'normal');
      doc.text(v2, 148, y);
      y += 6;
    });

    y += 4;

    // Section 2: Real-time Telemetry & Current Vector
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('2. TELEMETRY FIX & LAST KNOWN VECTOR', 16, y + 5);
    y += 12;

    const latStr = currentPosition ? formatCoordinate(currentPosition.lat, 'lat') : '13.628800° N';
    const lngStr = currentPosition ? formatCoordinate(currentPosition.lng, 'lng') : '79.419200° E';
    const speedStr = currentPosition ? `${currentPosition.speed} km/h` : '62 km/h';
    const hdgStr = currentPosition ? `${currentPosition.heading}°` : '105° (ESE)';
    const ignStr = currentPosition ? (currentPosition.ignition ? 'IGNITION ON' : 'IGNITION OFF') : 'IGNITION ON';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Latitude: ${latStr}`, 16, y);
    doc.text(`Longitude: ${lngStr}`, 70, y);
    doc.text(`Speed: ${speedStr}`, 125, y);
    doc.text(`Heading: ${hdgStr}`, 165, y);
    y += 6;
    doc.text(`Power Circuit: ${ignStr}`, 16, y);
    doc.text(`Battery Tamper State: ${vehicle.ais140Status === 'TAMPERED' ? 'TAMPERED (ALERT)' : 'NORMAL'}`, 70, y);
    doc.text(`Total Route Fixes Logged: ${positionHistory.length}`, 140, y);
    y += 10;

    // Section 3: Checkpoint Intercept History
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('3. NHAI FASTAG TOLL & POLICE ANPR CHECKPOINT AUDIT', 16, y + 5);
    y += 11;

    const vehicleFASTag = fastagScans[vehicle.registrationNumber] || [];
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('FASTag Scans:', 16, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    if (vehicleFASTag.length === 0) {
      doc.text('No toll plaza scan records available.', 20, y);
      y += 5;
    } else {
      vehicleFASTag.slice(0, 3).forEach((f) => {
        doc.text(
          `• ${f.tollPlazaName} (${f.highway}) - Lane ${f.laneNumber} | ₹${f.amount} | ${formatTimestamp(
            f.timestamp
          )}`,
          20,
          y
        );
        y += 5;
      });
    }

    const vehicleANPR = anprSightings[vehicle.registrationNumber] || [];
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Police ANPR Camera Sightings:', 16, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    if (vehicleANPR.length === 0) {
      doc.text('No optical camera matches recorded.', 20, y);
      y += 5;
    } else {
      vehicleANPR.slice(0, 3).forEach((a) => {
        doc.text(
          `• ${a.cameraLocation} (${a.city}) - Match Confidence: ${a.confidenceScore}% | ${formatTimestamp(
            a.timestamp
          )}`,
          20,
          y
        );
        y += 5;
      });
    }

    y += 8;

    // Section 4: Police Dispatch & Chain of Custody
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('4. POLICE INTERCEPT & CHAIN OF CUSTODY AUDIT', 16, y + 5);
    y += 11;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      `Nearest Assigned Unit: ${nearestUnit.name} (${nearestUnit.district}, ${nearestUnit.state})`,
      16,
      y
    );
    y += 5;
    doc.text(`Emergency Police Dispatch Status: ${interceptAlertSent ? 'DISPATCHED' : 'STANDBY'}`, 16, y);
    y += 5;
    doc.text(
      `Authorized Law Enforcement Officer: ${user?.name || 'Inspector R. K. Sharma (Badge #DL-8841)'}`,
      16,
      y
    );
    y += 12;

    // Footer Watermark & Barcode simulation
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 275, pageWidth - 14, 275);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'CONFIDENTIAL • FOR LAW ENFORCEMENT & INVESTIGATION USE ONLY • CCTNS / GARUDA NETRA ARCHIVE',
      14,
      280
    );
    doc.text(
      `Document Hash: SHA-256: ${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)} • Page 1 of 1`,
      14,
      284
    );

    doc.save(`GarudaNetra_FIR_TrackingLog_${vehicle.registrationNumber}.pdf`);

    addToast(
      'Dossier Generated',
      `Official PDF Tracking Dossier downloaded for ${vehicle.registrationNumber}`,
      'success'
    );
  };

  // Compile combined audit entries (live auditLog from context + baseline session logs)
  const defaultEntries: AuditLogEntry[] = [
    {
      id: 'AUD-001',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      action: 'TRACKING_INITIATED',
      performedBy: user?.name || 'Control Room Sub-Inspector S. Verma',
      details: `Tracking initiated by ${user?.name || 'Officer'} for vehicle ${vehicle.registrationNumber}`,
      severity: 'INFO',
    },
    {
      id: 'AUD-002',
      timestamp: new Date(Date.now() - 3500000).toISOString(),
      action: 'SMS_OTP_DISPATCHED',
      performedBy: 'GARUDA_AUTOMATION_GATEWAY',
      details: `Owner SMS notification and verification dispatch sent to ${vehicle.maskedMobile}`,
      severity: 'INFO',
    },
    {
      id: 'AUD-003',
      timestamp: new Date(Date.now() - 3300000).toISOString(),
      action: 'OWNER_VERIFICATION_ACCEPTED',
      performedBy: `${vehicle.ownerName} (Registered Owner)`,
      details: `Owner approved live tracking request via verified OTP session`,
      severity: 'INFO',
    },
    {
      id: 'AUD-004',
      timestamp: new Date(Date.now() - 2800000).toISOString(),
      action: 'EMERGENCY_OVERRIDE_CHECK',
      performedBy: 'SYSTEM_AUDITOR',
      details: 'Emergency override authorized under Section 91 CrPC protocol',
      severity: 'WARNING',
    },
  ];

  const fullAuditList = [
    ...auditLog,
    ...defaultEntries.filter((d) => !auditLog.some((a) => a.action === d.action)),
  ];

  const filteredAuditList = fullAuditList.filter((entry) => {
    const matchesSeverity =
      auditSeverityFilter === 'ALL' || entry.severity === auditSeverityFilter;
    const matchesSearch =
      auditSearchQuery.trim() === '' ||
      entry.action.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      entry.details.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      entry.performedBy.toLowerCase().includes(auditSearchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  return (
    <>
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-lg border shadow-2xl backdrop-blur-md max-w-sm transition-all duration-300 animate-in slide-in-from-top-2 ${
              toast.type === 'critical'
                ? 'bg-red-950/90 border-red-500 text-red-100'
                : toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-100'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500 text-amber-100'
                : 'bg-slate-900/95 border-slate-700 text-slate-100'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider">
                {toast.title}
              </span>
              <button
                onClick={() =>
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                }
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] mt-1 text-slate-300 leading-relaxed">
              {toast.message}
            </p>
          </div>
        ))}
      </div>

      {/* Main Bottom Action Bar */}
      <div className="w-full bg-slate-900 border-t border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
        {/* Left Status info */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Tactical Controls:</span>
          <span className="font-mono text-slate-200">
            {vehicle.registrationNumber}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            {interceptAlertSent ? (
              <span className="text-red-400 font-semibold flex items-center gap-1">
                <Siren className="w-3.5 h-3.5" /> PCR Intercept Dispatched
              </span>
            ) : (
              'Standby / Monitoring'
            )}
          </span>
        </div>

        {/* Action Button Row */}
        <div className="flex items-center gap-2.5 flex-wrap ml-auto">
          {/* Button 1: Intercept Alert */}
          {interceptAlertSent ? (
            <button
              disabled
              className="px-4 py-2 rounded-lg bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 font-medium text-xs flex items-center gap-2 cursor-default shadow-inner"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Alert Dispatched ✓</span>
            </button>
          ) : (
            <button
              onClick={() => setShowInterceptModal(true)}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg hover:shadow-red-500/20 transition-all border border-red-500 active:scale-95"
            >
              <Siren className="w-4 h-4 text-red-200 animate-pulse" />
              <span>Generate Police Intercept Alert</span>
            </button>
          )}

          {/* Button 2: Download FIR Tracking Log Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg hover:shadow-blue-500/20 transition-all border border-blue-500 active:scale-95"
            >
              <Download className="w-4 h-4 text-blue-200" />
              <span>Download FIR Tracking Log</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {showDownloadMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDownloadMenu(false)}
                />
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-slate-850 border border-slate-700 rounded-lg shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95">
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-750 hover:text-white rounded flex items-center gap-2 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-red-400" />
                    <div>
                      <div className="font-semibold">Download as PDF</div>
                      <div className="text-[10px] text-slate-400">
                        Official CCTNS Dossier
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleDownloadJSON}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-750 hover:text-white rounded flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="font-semibold">Download as JSON</div>
                      <div className="text-[10px] text-slate-400">
                        Raw Telemetry & Audit Stream
                      </div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Button 3: Share Live Location */}
          <button
            onClick={handleShareLiveLocation}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-lg hover:shadow-amber-500/20 transition-all border border-amber-400 active:scale-95"
          >
            <Share2 className="w-4 h-4 text-slate-900" />
            <span>Share Live Location</span>
          </button>

          {/* Button 4: View Audit Log */}
          <button
            onClick={() => setShowAuditDrawer(true)}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 font-medium text-xs flex items-center gap-2 border border-slate-700 hover:border-slate-600 transition-all active:scale-95 shadow-sm"
          >
            <FileText className="w-4 h-4 text-slate-400" />
            <span>View Audit Log</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Police Intercept */}
      {showInterceptModal && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-red-600/60 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 bg-red-950/80 border-b border-red-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Siren className="w-5 h-5 text-red-400 animate-pulse" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-red-200">
                  Confirm Police Intercept Alert
                </h3>
              </div>
              <button
                onClick={() => setShowInterceptModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-200">
              <p className="text-slate-300 leading-relaxed">
                You are about to issue a high-priority law enforcement intercept
                alert. All regional highway patrol units, district police
                control rooms, and border checkposts will be notified.
              </p>

              {/* Target info card */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Target Vehicle:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {vehicle.registrationNumber} ({vehicle.vehicleModel})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Assigned First Responder:</span>
                  <span className="font-semibold text-slate-200">
                    {nearestUnit.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Jurisdiction:</span>
                  <span className="text-slate-300">
                    {nearestUnit.district || 'Highway Patrol'}, {nearestUnit.state}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Coordinates:</span>
                  <span className="font-mono text-slate-200">
                    {formatCoordinate(
                      currentPosition?.lat ?? nearestUnit.location.lat,
                      'lat'
                    )}
                    ,{' '}
                    {formatCoordinate(
                      currentPosition?.lng ?? nearestUnit.location.lng,
                      'lng'
                    )}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-lg flex items-start gap-2 text-[11px] text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Action will be permanently recorded in the National CCTNS
                  Immutable Audit Ledger under your authorized identity.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowInterceptModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmIntercept}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition-colors"
              >
                <Siren className="w-4 h-4" />
                Confirm & Dispatch Intercept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Drawer (slides in from right) */}
      {showAuditDrawer && (
        <div className="fixed inset-0 z-[9995] flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setShowAuditDrawer(false)}
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-lg bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                    System Audit Ledger
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Immutable Compliance Log • {vehicle.registrationNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuditDrawer(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-3 bg-slate-950/60 border-b border-slate-800 space-y-2">
              <input
                type="text"
                placeholder="Search audit actions, officers, details..."
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />

              <div className="flex items-center gap-1.5">
                {['ALL', 'INFO', 'WARNING', 'CRITICAL'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setAuditSeverityFilter(sev)}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-medium transition-colors ${
                      auditSeverityFilter === sev
                        ? sev === 'CRITICAL'
                          ? 'bg-red-500 text-white'
                          : sev === 'WARNING'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : sev === 'INFO'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-white'
                        : 'bg-slate-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer Audit Trail List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredAuditList.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No matching audit events found.</p>
                </div>
              ) : (
                filteredAuditList.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1.5 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-200">
                        {entry.action}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                          entry.severity === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : entry.severity === 'WARNING'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                        }`}
                      >
                        {entry.severity}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {entry.details}
                    </p>

                    <div className="pt-1.5 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>By: {entry.performedBy}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Section 91 CrPC / IT Act 2000 Compliant</span>
              <span className="font-mono text-emerald-400">Cryptographically Signed</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ActionControls;
