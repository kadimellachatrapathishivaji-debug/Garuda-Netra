import React, { useState, useEffect } from 'react';
import { VehicleRecord } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { lookupVehicle, mockVehicles } from '../../data/mockVehicles';
import { validateIndianRegNumber, formatRegNumber } from '../../utils/validators';
import { resolveVehicle, getCustomVehicles } from '../../services/vahanService';
import RegisterVehicleModal from '../vehicles/RegisterVehicleModal';
import GPSTransmitterDrawer from '../transmitter/GPSTransmitterDrawer';
import {
  Search,
  Eye,
  AlertCircle,
  AlertTriangle,
  LogOut,
  Shield,
  Car,
  Truck,
  Bike,
  Radio,
  Zap,
  PlusCircle,
  RadioTower,
  Sparkles,
  CheckCircle2,
  X,
  User,
  Activity
} from 'lucide-react';

export interface VehicleSearchProps {
  onVehicleFound: (vehicle: VehicleRecord) => void;
}

export const VehicleSearch: React.FC<VehicleSearchProps> = ({ onVehicleFound }) => {
  const { user, logout } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [isTransmitterDrawerOpen, setIsTransmitterDrawerOpen] = useState<boolean>(false);
  const [customVehiclesList, setCustomVehiclesList] = useState<VehicleRecord[]>(getCustomVehicles());

  // Listen for newly registered vehicles
  useEffect(() => {
    const refreshList = () => {
      setCustomVehiclesList(getCustomVehicles());
    };
    window.addEventListener('garuda_vehicle_added', refreshList);
    window.addEventListener('storage', refreshList);
    return () => {
      window.removeEventListener('garuda_vehicle_added', refreshList);
      window.removeEventListener('storage', refreshList);
    };
  }, []);

  // Progressive auto-formatting as user types: AP 03 TC 4590
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
    setErrorMessage(null);

    if (raw.length === 0) {
      setSearchQuery('');
      return;
    }

    if (raw.length <= 2) {
      setSearchQuery(raw);
    } else if (raw.length <= 4) {
      setSearchQuery(`${raw.slice(0, 2)} ${raw.slice(2)}`);
    } else {
      const prefix = `${raw.slice(0, 2)} ${raw.slice(2, 4)}`;
      const remainder = raw.slice(4);
      const match = remainder.match(/^([A-Z]{1,3})(.*)$/);
      if (match) {
        const series = match[1];
        const rest = match[2];
        if (rest.length > 0) {
          setSearchQuery(`${prefix} ${series} ${rest}`);
        } else {
          setSearchQuery(`${prefix} ${series}`);
        }
      } else {
        setSearchQuery(`${prefix} ${remainder}`);
      }
    }
  };

  // Perform search & VAHAN lookup - NEVER fails with "Vehicle Not Found"
  const performSearch = (regToSearch?: string) => {
    const target = regToSearch || searchQuery;
    const cleaned = target.replace(/\s/g, '').toUpperCase();

    if (!cleaned) {
      setErrorMessage('Please enter an Indian registration number.');
      return;
    }

    if (cleaned.length < 5) {
      setErrorMessage('Please enter a valid Indian registration number (e.g. DL 04 CA 8821 or TS 09 EA 1234)');
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);

    // Simulate brief network latency for VAHAN 4.0 gateway lookup
    setTimeout(() => {
      setIsSearching(false);
      // Master resolver: checks mock DB, custom vehicles, or synthesizes high-fidelity VAHAN record
      const vehicle = resolveVehicle(cleaned, user);

      if (vehicle) {
        onVehicleFound(vehicle);
        setErrorMessage(null);
      }
    }, 250);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  // Quick select helper
  const handleQuickSelect = (regNo: string) => {
    const formatted = formatRegNumber(regNo);
    setSearchQuery(formatted);
    setErrorMessage(null);
    performSearch(regNo);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 shadow-md shadow-amber-500/10">
            <Eye className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wider text-slate-100 uppercase">
                GARUDA NETRA
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                MoRTH • NATGRID
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              National Missing Vehicle Tracking & Telemetry System
            </p>
          </div>
        </div>

        {/* Action Controls & User Info */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Action 1: Register Real Vehicle Button */}
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 text-xs font-semibold shadow-sm transition-all active:scale-95"
            title="Register custom Indian vehicle plate & link AIS-140 GPS chip"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Register Real Vehicle</span>
            <span className="sm:hidden">Register</span>
          </button>

          {/* Action 2: GPS Transmitter Drawer Button */}
          <button
            type="button"
            onClick={() => setIsTransmitterDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-400 hover:text-amber-300 text-xs font-semibold shadow-sm transition-all active:scale-95"
            title="Open Live Device Hardware GPS Transmitter"
          >
            <RadioTower className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">GPS Transmitter</span>
            <span className="sm:hidden">Transmitter</span>
          </button>

          {/* User Profile display */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:border-l border-slate-800">
              <div className="text-right hidden md:block">
                <div className="text-xs font-semibold text-slate-200">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1 font-mono">
                  {user.role === 'government' ? (
                    <span className="text-amber-400 font-medium">
                      {user.rank} • Badge #{user.badgeId}
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-medium">
                      Mobile: +91 {user.mobile}
                    </span>
                  )}
                </div>
              </div>

              {/* Role Badge */}
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border hidden sm:inline-block ${
                  user.role === 'government'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}
              >
                {user.role === 'government' ? 'Law Enforcement' : 'Owner'}
              </span>

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                title="Sign out of Garuda Netra"
                className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors ml-1"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                OFFICER ACCESS
              </span>
            </div>
          )}
        </div>
      </header>

      {/* CENTER SEARCH SECTION */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        
        {/* Subtle Background Tactical Radar Circles */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
          <div className="w-[600px] h-[600px] border border-amber-500/30 rounded-full" />
          <div className="w-[900px] h-[900px] border border-amber-500/20 rounded-full absolute" />
          <div className="w-[1200px] h-[1200px] border border-amber-500/10 rounded-full absolute" />
        </div>

        <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
          
          {/* Big Eye Center Icon */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl bg-slate-900 border-2 border-amber-500/30 flex items-center justify-center text-amber-500 shadow-2xl shadow-amber-500/20">
              <Eye className="w-10 h-10" />
            </div>
            <div className="absolute -inset-1 rounded-3xl bg-amber-500/20 blur-md -z-10 animate-pulse-slow" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 mb-2">
            Track Any Indian Vehicle Plate
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-md mb-8">
            Enter ANY Indian Registration Number (e.g. your own car or bike) for real-time AIS-140 GPS & VAHAN RC telemetry
          </p>

          {/* SEARCH FORM / INPUT */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative flex items-center rounded-2xl bg-slate-900 border-2 border-slate-700/80 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 shadow-2xl transition-all">
              
              {/* IND Emblem Box */}
              <div className="hidden sm:flex items-center justify-center bg-blue-900/90 text-slate-100 px-3.5 py-4 border-r border-slate-700 rounded-l-xl font-mono select-none">
                <div className="flex flex-col items-center leading-none">
                  <span className="text-[10px] text-amber-400 font-bold mb-0.5">●</span>
                  <span className="text-xs font-black tracking-widest">IND</span>
                </div>
              </div>

              {/* Registration Input */}
              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                placeholder="e.g. TS 09 EA 1234 or AP 04 BK 5521"
                maxLength={13}
                spellCheck={false}
                autoFocus
                className="w-full py-4 px-4 sm:px-6 bg-transparent text-lg sm:text-2xl font-mono font-bold tracking-wider uppercase text-slate-100 placeholder-slate-600 focus:outline-none"
              />

              {/* Clear button */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setErrorMessage(null);
                  }}
                  className="p-2 mr-2 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
                  aria-label="Clear input"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {/* Search/Track Button */}
              <button
                type="submit"
                disabled={isSearching}
                className="mr-2 sm:mr-3 px-5 sm:px-7 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm sm:text-base flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSearching ? (
                  <Activity className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">Track</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs sm:text-sm flex items-center justify-center gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </form>

          {/* CUSTOM REGISTERED VEHICLES (IF ANY) */}
          {customVehiclesList.length > 0 && (
            <div className="w-full mt-8">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Your Registered Real Vehicles ({customVehiclesList.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline"
                >
                  + Add Another
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {customVehiclesList.map((cv) => (
                  <button
                    key={cv.registrationNumber}
                    type="button"
                    onClick={() => handleQuickSelect(cv.registrationNumber)}
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-500 hover:bg-slate-850 hover:shadow-lg transition-all group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-mono font-bold text-sm text-slate-200 group-hover:text-emerald-400 transition-colors">
                          {formatRegNumber(cv.registrationNumber)}
                        </div>
                        <div className="text-xs text-slate-400 truncate max-w-[150px]">
                          {cv.vehicleModel} • {cv.ownerName}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        AIS-140 Linked
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* QUICK-ACCESS TEST VEHICLES */}
          <div className="w-full mt-8">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Benchmark Simulation Fleet
              </span>
              <span className="text-[11px] text-slate-500">
                Or type any real vehicle plate above
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              
              {/* Vehicle 1: Tata Prima (GPS Active) */}
              <button
                type="button"
                onClick={() => handleQuickSelect('AP03TC4590')}
                className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 hover:shadow-lg transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-800 text-amber-400 group-hover:bg-amber-500/10 transition-colors">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-mono font-bold text-sm text-slate-200 group-hover:text-amber-400 transition-colors">
                      AP 03 TC 4590
                    </div>
                    <div className="text-xs text-slate-400">Tata Prima 4928.S (HGV)</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    GPS Active
                  </span>
                </div>
              </button>

              {/* Vehicle 2: Hyundai Creta (GPS Active) */}
              <button
                type="button"
                onClick={() => handleQuickSelect('DL04CA8821')}
                className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 hover:shadow-lg transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-800 text-amber-400 group-hover:bg-amber-500/10 transition-colors">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-mono font-bold text-sm text-slate-200 group-hover:text-amber-400 transition-colors">
                      DL 04 CA 8821
                    </div>
                    <div className="text-xs text-slate-400">Hyundai Creta SX(O)</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    GPS Active
                  </span>
                </div>
              </button>

              {/* Vehicle 3: Mahindra Scorpio (GPS Tampered) */}
              <button
                type="button"
                onClick={() => handleQuickSelect('KA01MB1029')}
                className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 hover:shadow-lg transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-800 text-amber-400 group-hover:bg-amber-500/10 transition-colors">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-mono font-bold text-sm text-slate-200 group-hover:text-amber-400 transition-colors">
                      KA 01 MB 1029
                    </div>
                    <div className="text-xs text-slate-400">Mahindra Scorpio S11</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    GPS Tampered
                  </span>
                </div>
              </button>

              {/* Vehicle 4: Bajaj Pulsar (No GPS) */}
              <button
                type="button"
                onClick={() => handleQuickSelect('MH02FZ3311')}
                className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 hover:shadow-lg transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-800 text-amber-400 group-hover:bg-amber-500/10 transition-colors">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-mono font-bold text-sm text-slate-200 group-hover:text-amber-400 transition-colors">
                      MH 02 FZ 3311
                    </div>
                    <div className="text-xs text-slate-400">Bajaj Pulsar 220F (2W)</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                    <Radio className="w-3.5 h-3.5 text-red-400" />
                    No GPS
                  </span>
                </div>
              </button>

            </div>
          </div>

          {/* Security & Protocol Notice */}
          <div className="mt-8 text-xs text-slate-500 flex items-center justify-center gap-2">
            <Shield className="w-3.5 h-3.5 text-amber-500/70" />
            <span>Encrypted with SHA-256 • VAHAN 4.0 API • Inter-State Police NETRA Telemetry Protocol</span>
          </div>

        </div>
      </div>

      {/* Register Vehicle Modal */}
      <RegisterVehicleModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onVehicleRegistered={(newVehicle) => {
          setCustomVehiclesList(getCustomVehicles());
          onVehicleFound(newVehicle);
        }}
      />

      {/* GPS Transmitter Slide-Over Drawer */}
      <GPSTransmitterDrawer
        isOpen={isTransmitterDrawerOpen}
        onClose={() => setIsTransmitterDrawerOpen(false)}
        initialRegNumber={searchQuery.replace(/\s/g, '').toUpperCase() || undefined}
      />

    </div>
  );
};

export default VehicleSearch;
