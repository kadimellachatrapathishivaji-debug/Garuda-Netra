import React, { useState, useEffect } from 'react';
import { Shield, Smartphone, CheckCircle2, AlertTriangle, ShieldAlert, Clock, X } from 'lucide-react';

export interface OwnerApprovalModalProps {
  isOpen: boolean;
  vehicleRegNo: string;
  officerName: string;
  officerBadge: string;
  officerDepartment: string;
  firNumber: string;
  ownerMaskedMobile: string;
  onApprove: () => void;
  onOverride: () => void;
  onClose: () => void;
}

export default function OwnerApprovalModal({
  isOpen,
  vehicleRegNo,
  officerName,
  officerBadge,
  officerDepartment,
  firNumber,
  ownerMaskedMobile,
  onApprove,
  onOverride,
  onClose,
}: OwnerApprovalModalProps) {
  const [waitTime, setWaitTime] = useState(0);
  const [showOverrideConfirm, setShowOverrideConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setWaitTime(0);
      setShowOverrideConfirm(false);
      return;
    }
    const interval = setInterval(() => setWaitTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const smsMessage = `GARUDA NETRA ALERT: ${officerDepartment || 'Law Enforcement'} (Badge #${officerBadge || 'OFFICER'}) has initiated live GPS tracking for your vehicle ${vehicleRegNo} under FIR #${firNumber || 'PENDING'}. Click to Approve or Report Issue.`;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Shield className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                Owner Authorization Required
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                SMS dispatched to {ownerMaskedMobile}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Officer Context Badge */}
        <div className="px-5 pt-4 pb-1">
          <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700/60 rounded-lg px-3.5 py-2 text-xs">
            <span className="text-slate-400">Requesting Officer:</span>
            <span className="text-slate-200 font-medium">{officerName} ({officerBadge})</span>
          </div>
        </div>

        {/* Simulated Phone Screen */}
        <div className="p-5">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-inner">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400 pb-2 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span className="font-mono">SMS to {ownerMaskedMobile}</span>
              </div>
              <span className="text-emerald-400 font-mono text-[10px] uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded">
                Carrier Delivered
              </span>
            </div>
            <div className="bg-slate-900/90 rounded-lg p-4 border border-slate-700/70">
              <div className="text-[11px] font-mono text-amber-400/80 mb-1">GOVT_GARUDA_ALERT:</div>
              <p className="text-sm text-slate-200 leading-relaxed font-sans">{smsMessage}</p>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Waiting for owner response... <span className="font-mono text-amber-400 font-semibold">{waitTime}s</span></span>
              <span className="animate-pulse text-amber-400 font-bold tracking-widest ml-1">● ● ●</span>
            </div>
          </div>
        </div>

        {/* Simulate Owner Response Actions */}
        <div className="px-5 pb-2">
          <p className="text-xs text-slate-500 mb-3 text-center uppercase tracking-wider font-mono">
            — Simulate Owner Response —
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onApprove}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-100" />
              <span>Approve Tracking</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium transition-colors border border-red-500/30 active:scale-[0.98]"
            >
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span>Report Issue</span>
            </button>
          </div>
        </div>

        {/* Emergency Warrant Override Section */}
        <div className="p-5 border-t border-slate-800 mt-3 bg-slate-950/40">
          {!showOverrideConfirm ? (
            <button
              onClick={() => setShowOverrideConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700/80 text-amber-400 rounded-xl text-sm font-medium transition-colors border border-slate-700 hover:border-amber-500/40"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Emergency Warrant Override (Police Only)</span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5">
                <p className="text-xs text-amber-300/90 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 inline mr-1 text-amber-400 align-text-bottom" />
                  <strong>LEGAL NOTICE:</strong> This emergency bypass bypasses owner consent under CrPC Sec 91/IT Act Sec 69 and will be logged in the immutable audit trail. Requires post-facto judicial review within 24 hours.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowOverrideConfirm(false)}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={onOverride}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-amber-900/30"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Confirm Emergency Override</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
