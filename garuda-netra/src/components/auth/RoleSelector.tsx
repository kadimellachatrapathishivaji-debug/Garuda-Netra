import React from 'react';
import { Eye, Shield, Car, BadgeCheck, ShieldAlert, ArrowRight, CheckCircle2, Lock, Radio } from 'lucide-react';
import { UserRole } from '../../types';

export interface RoleSelectorProps {
  onSelectRole: (role: UserRole) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 relative overflow-hidden select-none">
      {/* Background Grid Pattern & Tactical Glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(148, 163, 184, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Radial ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <Eye className="w-7 h-7 text-amber-500 animate-pulse-slow" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-wider text-amber-500 font-mono">
                GARUDA NETRA
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 tracking-wider">
                v2.4 SECURE
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 font-sans tracking-wide">
              Eagle Eye | National Missing Vehicle Tracking System
            </p>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="hidden sm:flex items-center gap-3 bg-slate-900/90 border border-slate-700/60 rounded-full px-4 py-1.5 text-xs text-slate-300">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="font-mono text-slate-400">STATUS:</span>
          <span className="font-semibold text-emerald-400">SURVEILLANCE GRID ACTIVE</span>
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse ml-1" />
        </div>
      </header>

      {/* Main Two-Panel Role Gate */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="max-w-6xl w-full">
          {/* Tactical Gate Notice */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-300 uppercase tracking-widest mb-3">
              <Lock className="w-3 h-3 text-amber-400" /> Authorized Access Portals
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-100">
              Select Your Operational Role to Authenticate
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto mt-1">
              Choose between citizen telematics access and law enforcement command surveillance protocols.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* LEFT PANEL: Vehicle Owner Portal */}
            <div 
              onClick={() => onSelectRole('owner')}
              className="group relative cursor-pointer bg-slate-800/70 hover:bg-slate-800/95 border border-slate-700/80 hover:border-amber-500/60 rounded-2xl p-7 md:p-9 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col justify-between backdrop-blur-sm transform hover:-translate-y-1"
            >
              {/* Corner Tactical Accent */}
              <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-2xl pointer-events-none">
                <div className="absolute top-2 right-2 w-2 h-2 bg-amber-500/40 rounded-full" />
                <div className="w-full h-full border-t-2 border-r-2 border-amber-500/40" />
              </div>

              <div>
                {/* Access Level Tag */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[11px] font-mono font-bold tracking-widest text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded">
                    ACCESS TIER: CITIZEN
                  </span>
                  <span className="text-xs text-slate-500 font-mono">PORTAL ID: VO-01</span>
                </div>

                {/* Icons: Shield + Car */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 group-hover:scale-105 transition-all duration-300">
                    <Shield className="w-7 h-7" />
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-slate-700/40 border border-slate-600/50 flex items-center justify-center text-amber-400/80 group-hover:text-amber-400 group-hover:bg-amber-500/10 transition-all duration-300">
                    <Car className="w-7 h-7" />
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-2xl font-bold text-slate-100 group-hover:text-amber-400 transition-colors mb-3">
                  Vehicle Owner Portal
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Track your registered vehicle, verify ownership, and monitor real-time location with encrypted telematics.
                </p>

                {/* Bullet Points */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>OTP-based verification via registered mobile</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Real-time GPS tracking & telematics stream</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>FASTag & ANPR toll camera sighting history</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                className="w-full py-3.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm tracking-wide transition-all duration-200 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 group-hover:shadow-amber-500/30"
              >
                <span>Enter as Vehicle Owner</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* RIGHT PANEL: Government / Law Enforcement */}
            <div 
              onClick={() => onSelectRole('government')}
              className="group relative cursor-pointer bg-slate-800/70 hover:bg-slate-800/95 border border-slate-700/80 hover:border-emerald-500/60 rounded-2xl p-7 md:p-9 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col justify-between backdrop-blur-sm transform hover:-translate-y-1"
            >
              {/* Corner Tactical Accent */}
              <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-2xl pointer-events-none">
                <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500/40 rounded-full" />
                <div className="w-full h-full border-t-2 border-r-2 border-emerald-500/40" />
              </div>

              <div>
                {/* Access Level Tag */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
                    ACCESS TIER: LAW ENFORCEMENT
                  </span>
                  <span className="text-xs text-slate-500 font-mono">PORTAL ID: LE-09</span>
                </div>

                {/* Icons: BadgeCheck + ShieldAlert */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-105 transition-all duration-300">
                    <BadgeCheck className="w-7 h-7" />
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-slate-700/40 border border-slate-600/50 flex items-center justify-center text-emerald-400/80 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all duration-300">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-2xl font-bold text-slate-100 group-hover:text-emerald-400 transition-colors mb-3">
                  Law Enforcement Portal
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Official access for police and government agencies to track missing/stolen vehicles across India.
                </p>

                {/* Bullet Points */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>FIR-linked tracking with verified audit logging</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Emergency override access & geo-fence breach locks</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Intercept alert dispatch to nearest PCR vans & checkposts</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                className="w-full py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm tracking-wide transition-all duration-200 shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 group-hover:shadow-emerald-600/30"
              >
                <span>Enter as Law Enforcement</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-800/80 bg-slate-950/90 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          <span>Ministry of Road Transport & Highways | Government of India</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
          <span>CCTNS INTEGRATED</span>
          <span>•</span>
          <span>AIS-140 COMPLIANT</span>
          <span>•</span>
          <span>256-BIT ENCRYPTION</span>
        </div>
      </footer>
    </div>
  );
};

export default RoleSelector;
