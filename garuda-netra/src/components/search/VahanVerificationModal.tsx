import React, { useState } from 'react';
import { VehicleRecord } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTracking } from '../../context/TrackingContext';
import { formatTimestamp } from '../../utils/helpers';
import {
  FileSearch,
  X,
  CheckCircle2,
  AlertTriangle,
  Shield,
  ShieldAlert,
  Car,
  Phone,
  Calendar,
  MapPin,
  Hash,
  Cpu,
  Palette,
  Radio,
  Send,
  Bell,
  ArrowRight,
  AlertOctagon,
  Clock,
  Sparkles,
  Zap,
  Check,
  Smartphone
} from 'lucide-react';

export interface VahanVerificationModalProps {
  vehicle: VehicleRecord;
  onClose: () => void;
  onStartTracking: (firNumber?: string, isEmergencyOverride?: boolean) => void;
}

type VerificationStep = 'details' | 'authorization' | 'notification' | 'approved';

export const VahanVerificationModal: React.FC<VahanVerificationModalProps> = ({
  vehicle,
  onClose,
  onStartTracking,
}) => {
  const { user } = useAuth();
  const { setSelectedVehicle, startTracking, addAuditEntry, addNotification } = useTracking();

  // State management
  const [step, setStep] = useState<VerificationStep>('details');
  const [firNumber, setFirNumber] = useState<string>('FIR-2026-');
  const [isEmergencyOverride, setIsEmergencyOverride] = useState<boolean>(false);
  const [ownerApproved, setOwnerApproved] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [firError, setFirError] = useState<string>('');

  // Determine user role and owner match
  const isGov = user?.role === 'government';
  const isOwner = user?.role === 'owner';

  // Check mobile matching for citizen owner
  const cleanUserMobile = user?.role === 'owner' ? user.mobile.replace(/\D/g, '') : '';
  const cleanVehicleMobile = vehicle.mobileNumber.replace(/\D/g, '');
  const isOwnerMatched =
    isOwner &&
    cleanUserMobile.length > 0 &&
    (cleanUserMobile.endsWith(cleanVehicleMobile.slice(-10)) ||
      cleanVehicleMobile.endsWith(cleanUserMobile.slice(-10)));

  // Simulated SMS text for owner
  const officerName = isGov ? user.name : 'Authorized Officer';
  const officerDept = isGov ? user.department : 'Cyber & Crime Branch';
  const officerBadge = isGov ? user.badgeId : 'NETRA-9842';
  const simulatedSmsText = `[GARUDA NETRA - MHA Alert]: Officer ${officerName} (${officerDept}, Badge: ${officerBadge}) has requested live tracking authorization for your registered vehicle ${vehicle.registrationNumber} under Case ${firNumber || 'WARRANT-SEC-92'}. If you recognize this request, verify & approve: https://garuda.gov.in/auth/v/${vehicle.registrationNumber.toLowerCase()}`;

  // Request authorization flow
  const handleRequestAuthorization = () => {
    if (!isEmergencyOverride && (!firNumber.trim() || firNumber.trim() === 'FIR-2026-')) {
      setFirError('Please enter a valid FIR number or enable Emergency Warrant Override');
      return;
    }
    setFirError('');
    setShowNotification(true);
    setStep('notification');

    // Record notification in context
    addNotification({
      type: 'SMS',
      recipient: vehicle.maskedMobile,
      message: simulatedSmsText,
    });

    addAuditEntry(
      'TRACKING_AUTHORIZATION_REQUESTED',
      user?.name || 'Law Enforcement Officer',
      `Sent consent SMS to owner ${vehicle.maskedMobile} for ${vehicle.registrationNumber} under ${firNumber}`,
      'INFO'
    );
  };

  // Simulate owner clicking the approve link
  const handleSimulateOwnerApproval = () => {
    setOwnerApproved(true);
    setStep('approved');

    addAuditEntry(
      'OWNER_CONSENT_GRANTED',
      vehicle.ownerName,
      `Owner approved tracking request via SMS link for vehicle ${vehicle.registrationNumber}`,
      'INFO'
    );
  };

  // Final confirmation to launch tracking
  const handleConfirmTracking = () => {
    setSelectedVehicle(vehicle);

    if (user) {
      startTracking({
        vehicleRegNo: vehicle.registrationNumber,
        initiatedBy: user,
        firNumber: isEmergencyOverride ? (firNumber || 'EMERGENCY-OVERRIDE') : firNumber,
        isEmergencyOverride,
        ownerApproved: isOwner ? true : isEmergencyOverride || ownerApproved,
      });

      if (isOwner) {
        addAuditEntry(
          'OWNER_TRACKING_START',
          vehicle.ownerName,
          `Owner initiated real-time GPS tracking for ${vehicle.registrationNumber}`,
          'INFO'
        );
      } else {
        addAuditEntry(
          isEmergencyOverride ? 'EMERGENCY_OVERRIDE_START' : 'LE_TRACKING_START',
          `${user.name} (${user.badgeId})`,
          `Law Enforcement tracking started under ${isEmergencyOverride ? 'CRPC Sec 92 Override' : firNumber} for ${vehicle.registrationNumber}`,
          isEmergencyOverride ? 'WARNING' : 'INFO'
        );
      }
    }

    onStartTracking(firNumber, isEmergencyOverride);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8">
        
        {/* Accent Top Border */}
        <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <FileSearch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100 tracking-wide">VAHAN RC VERIFICATION</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  MoRTH VAHAN 4.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                National Register e-Services • Verified Central Registry Record
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amber accent line */}
        <div className="h-0.5 bg-gradient-to-r from-amber-500/80 via-amber-400/50 to-transparent w-full" />

        {/* BODY */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* Top Registration Plate & Summary Header */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/70 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Indian License Plate Badge */}
              <div className="inline-flex items-center bg-amber-400 border-2 border-slate-900 rounded-md shadow-md overflow-hidden font-mono">
                <div className="bg-blue-800 text-white px-2 py-1 flex flex-col items-center justify-center border-r border-blue-900 text-[9px] font-bold leading-tight">
                  <span className="text-amber-300 text-[10px]">★</span>
                  <span>IND</span>
                </div>
                <div className="px-3 py-1 text-slate-950 font-black text-lg tracking-widest uppercase">
                  {vehicle.registrationNumber}
                </div>
              </div>

              <div>
                <h4 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  {vehicle.vehicleModel}
                </h4>
                <p className="text-xs text-slate-400">
                  Class: <span className="text-slate-200 font-medium">{vehicle.vehicleClass}</span>
                </p>
              </div>
            </div>

            {/* Telemetry Status Pills */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* AIS-140 Badge */}
              <div
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
                  vehicle.ais140Status === 'ACTIVE'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                    : vehicle.ais140Status === 'TAMPERED'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                    : 'bg-red-500/10 border-red-500/40 text-red-400'
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${vehicle.ais140Status === 'ACTIVE' ? 'animate-pulse' : ''}`} />
                <span>AIS-140: {vehicle.ais140Status}</span>
              </div>

              {/* FASTag Badge */}
              <div
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
                  vehicle.fastagStatus === 'ACTIVE'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/40 text-red-400'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>FASTag: {vehicle.fastagStatus}</span>
              </div>
            </div>
          </div>

          {/* TWO COLUMN GRID DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Col 1: Identity & Ownership */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <h5 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-700/60">
                <Shield className="w-3.5 h-3.5" />
                Ownership & Identification
              </h5>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <span className="text-amber-500">●</span> Registration Number
                  </span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {vehicle.registrationNumber}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400">Registered Owner</span>
                  <span className="font-semibold text-slate-100">{vehicle.ownerName}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> Masked Mobile
                  </span>
                  <span className="font-mono text-slate-200">{vehicle.maskedMobile}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-slate-400" /> Chassis Number
                  </span>
                  <span className="font-mono text-slate-300">{vehicle.maskedChassis}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-slate-400" /> Engine Number
                  </span>
                  <span className="font-mono text-slate-300">{vehicle.engineNumber}</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" /> Registering RTO
                  </span>
                  <span className="text-right text-slate-200 font-medium">{vehicle.stateRTO}</span>
                </div>
              </div>
            </div>

            {/* Col 2: Vehicle Specs & Telemetry */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <h5 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-700/60">
                <Car className="w-3.5 h-3.5" />
                Technical & Hardware Status
              </h5>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400">Vehicle Class</span>
                  <span className="text-slate-200 font-medium">{vehicle.vehicleClass}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400">Fuel Type</span>
                  <span className="text-slate-200 font-semibold">{vehicle.fuelType}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Palette className="w-3 h-3 text-slate-400" /> Body Color
                  </span>
                  <span className="text-slate-200 font-medium">{vehicle.color}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" /> Registration Date
                  </span>
                  <span className="text-slate-300 font-mono">{vehicle.registrationDate}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-slate-400" /> Insurance Expiry
                  </span>
                  <span className="text-slate-300 font-mono">{vehicle.insuranceExpiry}</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">FASTag ID</span>
                  <span className="font-mono text-xs text-slate-300">
                    {vehicle.fastagId ? vehicle.fastagId : 'None Attached'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TELEMETRY HARDWARE STATUS ROW */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-amber-400">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <span>AIS-140 GPS Telemetry Unit</span>
                  {vehicle.ais140Status === 'ACTIVE' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      LIVE TRANSMITTING
                    </span>
                  )}
                  {vehicle.ais140Status === 'TAMPERED' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      TAMPER DETECTED
                    </span>
                  )}
                  {vehicle.ais140Status === 'OFFLINE' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/30">
                      NO ACTIVE HARDWARE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  IMEI:{' '}
                  <span className="font-mono text-slate-300">
                    {vehicle.gpsImei || 'Not Installed / Legacy Vehicle'}
                  </span>
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-400 text-right">
              <div>Network Provider: <span className="text-slate-200">BSNL / eSIM M2M</span></div>
              <div>Location Precision: <span className="text-emerald-400">± 2.5 meters (IRNSS/NavIC)</span></div>
            </div>
          </div>

          {/* SIMULATED SMS NOTIFICATION TOAST (FOR LAW ENFORCEMENT) */}
          {showNotification && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 shadow-lg space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  MHA Simulated SMS Gateway • Netra Push Dispatch
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatTimestamp(new Date())}
                </span>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-700/80 font-mono text-xs text-slate-200 leading-relaxed">
                <div className="text-[10px] text-amber-500 mb-1">
                  Recipient: <span className="text-slate-300">{vehicle.maskedMobile}</span> ({vehicle.ownerName})
                </div>
                {simulatedSmsText}
              </div>

              {/* Status and simulate action button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs">
                  {!ownerApproved ? (
                    <span className="flex items-center gap-2 text-amber-400 font-medium">
                      <Clock className="w-4 h-4 animate-spin text-amber-400" />
                      Awaiting Citizen Authorization (Simulated SMS Sent)...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Citizen Consent Verified & Digitally Signed!
                    </span>
                  )}
                </div>

                {!ownerApproved && (
                  <button
                    type="button"
                    onClick={handleSimulateOwnerApproval}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                    Simulate Owner Approval [Click to Approve]
                  </button>
                )}
              </div>
            </div>
          )}

          {/* EMERGENCY OVERRIDE BANNER */}
          {isEmergencyOverride && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 flex items-start gap-3">
              <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h6 className="text-xs font-bold text-red-400 tracking-wide uppercase">
                  Statutory Emergency Warrant Override (Sec 92 CrPC / BNSS)
                </h6>
                <p className="text-xs text-slate-300 mt-0.5">
                  Emergency protocol engaged. Owner consent requirement bypassed for active threat/chase. Audit log entry will be permanently stamped with Officer ID <span className="font-mono text-amber-300">{isGov ? user.badgeId : 'LE-DEMO'}</span>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER (DEPENDS ON ROLE) */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/95 flex flex-col gap-4">
          
          {/* VEHICLE OWNER ROLE FOOTER */}
          {isOwner && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                {isOwnerMatched ? (
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified Owner ✓
                    </span>
                    <span className="text-xs text-slate-300">
                      Mobile matches VAHAN registry (+91 {user.mobile}).
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-400 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Not the registered owner: Your mobile (+91 {user.mobile}) doesn't match VAHAN record ({vehicle.maskedMobile}).
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmTracking}
                  disabled={!isOwnerMatched}
                  className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-200 ${
                    isOwnerMatched
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <span>Begin Tracking</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* GOVERNMENT / LAW ENFORCEMENT ROLE FOOTER */}
          {(!isOwner || isGov) && (
            <div className="space-y-4">
              
              {/* Controls: FIR input + Emergency toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                
                {/* FIR Number Input */}
                <div className="sm:col-span-7">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    FIR / Crime Docket Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={firNumber}
                      onChange={(e) => {
                        setFirNumber(e.target.value);
                        setFirError('');
                      }}
                      disabled={isEmergencyOverride}
                      placeholder="e.g. FIR-2026-DEL-4091"
                      className={`w-full px-3.5 py-2 text-sm bg-slate-950 border rounded-lg font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                        isEmergencyOverride
                          ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                          : firError
                          ? 'border-red-500 focus:ring-red-500/40'
                          : 'border-slate-700 focus:border-amber-500 focus:ring-amber-500/40'
                      }`}
                    />
                  </div>
                  {firError && (
                    <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {firError}
                    </p>
                  )}
                </div>

                {/* Emergency Override Toggle */}
                <div className="sm:col-span-5 flex items-center sm:justify-end gap-3 pt-3 sm:pt-0">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-200">
                      Emergency Override
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Sec 92 CrPC Warrant Bypass
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={isEmergencyOverride}
                    onClick={() => {
                      const next = !isEmergencyOverride;
                      setIsEmergencyOverride(next);
                      setFirError('');
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isEmergencyOverride ? 'bg-red-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isEmergencyOverride ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <div className="text-xs text-slate-400">
                  {isEmergencyOverride ? (
                    <span className="text-red-400 font-semibold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Emergency Protocol Engaged - Instant Access
                    </span>
                  ) : ownerApproved ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Owner Authorization Verified
                    </span>
                  ) : (
                    <span>Requires FIR docket or Citizen SMS consent to activate</span>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>

                  {/* If Emergency Override is active, directly start */}
                  {isEmergencyOverride ? (
                    <button
                      type="button"
                      onClick={handleConfirmTracking}
                      className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 active:scale-95 transition-all"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Authorize Emergency Tracking</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : step === 'approved' || ownerApproved ? (
                    <button
                      type="button"
                      onClick={handleConfirmTracking}
                      className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Launch Tactical Tracking</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestAuthorization}
                      className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                    >
                      <Send className="w-4 h-4" />
                      <span>Request Tracking Authorization</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default VahanVerificationModal;
