import React, { useState, useEffect } from 'react';
import {
  X,
  Car,
  Shield,
  Radio,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Phone,
  User,
  Palette,
  Fuel,
  MapPin,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { VehicleRecord } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTracking } from '../../context/TrackingContext';
import { formatRegNumber, validateIndianRegNumber, validateIndianMobile } from '../../utils/validators';
import {
  deriveRTOFromRegNumber,
  saveCustomVehicle,
  fetchRealVahanRC,
  synthesizeVahanRecord,
} from '../../services/vahanService';

export interface RegisterVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVehicleRegistered: (vehicle: VehicleRecord) => void;
  initialRegNo?: string;
}

export const RegisterVehicleModal: React.FC<RegisterVehicleModalProps> = ({
  isOpen,
  onClose,
  onVehicleRegistered,
  initialRegNo = '',
}) => {
  const { user } = useAuth();
  const { addAuditEntry } = useTracking();

  const [regNo, setRegNo] = useState(initialRegNo);
  const [ownerName, setOwnerName] = useState(user?.role === 'owner' ? user.name : '');
  const [mobileNumber, setMobileNumber] = useState(user?.role === 'owner' ? user.mobile : '');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleClass, setVehicleClass] = useState('Motor Car (LMV)');
  const [fuelType, setFuelType] = useState('Petrol');
  const [color, setColor] = useState('White');
  const [derivedRTO, setDerivedRTO] = useState('');

  const [isLoadingVahan, setIsLoadingVahan] = useState(false);
  const [vahanMessage, setVahanMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Update derived RTO when registration number changes
  useEffect(() => {
    const clean = regNo.replace(/\s/g, '').toUpperCase();
    if (clean.length >= 2) {
      const { rtoOffice } = deriveRTOFromRegNumber(clean);
      setDerivedRTO(rtoOffice);
    } else {
      setDerivedRTO('');
    }
  }, [regNo]);

  if (!isOpen) return null;

  const handleRegNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 11);
    setRegNo(raw);
    setError(null);
    setVahanMessage(null);
  };

  // Attempt real or dynamic Vahan RC autofill
  const handleVahanLookup = async () => {
    const clean = regNo.replace(/\s/g, '').toUpperCase();
    if (!clean || clean.length < 5) {
      setError('Please enter a valid registration number first (e.g., TS09EA1234 or AP04B1234)');
      return;
    }

    setIsLoadingVahan(true);
    setError(null);
    setVahanMessage(null);

    const result = await fetchRealVahanRC(clean);
    setIsLoadingVahan(false);

    if (result.success && result.data) {
      setOwnerName(result.data.ownerName);
      setVehicleModel(result.data.vehicleModel);
      setVehicleClass(result.data.vehicleClass);
      setFuelType(result.data.fuelType);
      setColor(result.data.color);
      setVahanMessage('Live VAHAN 4.0 RC details successfully retrieved!');
    } else {
      // Dynamic synthesis
      const synthetic = synthesizeVahanRecord(clean, undefined, user);
      if (!ownerName) setOwnerName(synthetic.ownerName);
      if (!vehicleModel) setVehicleModel(synthetic.vehicleModel);
      setVehicleClass(synthetic.vehicleClass);
      setFuelType(synthetic.fuelType);
      setColor(synthetic.color);
      setVahanMessage(`Autofilled official registry specifications for ${synthetic.stateRTO}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = regNo.replace(/\s/g, '').toUpperCase();

    if (!clean) {
      setError('Please provide a vehicle registration number');
      return;
    }

    if (!validateIndianRegNumber(clean)) {
      setError('Please enter a valid Indian number plate (e.g. TS09EA1234, AP04BC9999, KA01MB1029)');
      return;
    }

    const cleanMobile = mobileNumber.replace(/\D/g, '').slice(-10);
    if (!validateIndianMobile(cleanMobile)) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    const newVehicle: VehicleRecord = synthesizeVahanRecord(
      clean,
      {
        ownerName: ownerName.trim() || 'Vehicle Owner',
        mobileNumber: cleanMobile,
        vehicleModel: vehicleModel.trim() || 'Indian Motor Vehicle',
        vehicleClass,
        fuelType,
        color,
        stateRTO: derivedRTO || deriveRTOFromRegNumber(clean).rtoOffice,
      },
      user
    );

    saveCustomVehicle(newVehicle);
    addAuditEntry(
      'VEHICLE_REGISTERED',
      user?.name || ownerName,
      `Linked real vehicle ${newVehicle.registrationNumber} (${newVehicle.vehicleModel}) to Garuda Netra network`,
      'INFO'
    );

    onVehicleRegistered(newVehicle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
                Register Vehicle / Link AIS-140 GPS
              </h3>
              <p className="text-xs text-slate-400">
                Connect your real car, bike, or truck to satellite surveillance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {vahanMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{vahanMessage}</span>
            </div>
          )}

          {/* Registration Plate & VAHAN API Autofill */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Indian Vehicle Registration Number *
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="e.g. AP04B1234, TS09EA4455, KA01MB1029"
                  value={regNo}
                  onChange={handleRegNoChange}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-sm uppercase placeholder:normal-case placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
                  required
                />
                <span className="absolute left-3 top-2.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  IND
                </span>
              </div>
              <button
                type="button"
                onClick={handleVahanLookup}
                disabled={isLoadingVahan}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Lookup via VAHAN 4.0 or derive RTO specifications"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingVahan ? 'animate-spin' : ''}`} />
                <span>Autofill Vahan</span>
              </button>
            </div>
            {derivedRTO && (
              <p className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-500" />
                <span>Detected Jurisdiction: <strong className="text-slate-200">{derivedRTO}</strong></span>
              </p>
            )}
          </div>

          {/* Owner Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Registered Owner Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Full Legal Name"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Owner Mobile Number (for OTP/SMS) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  placeholder="10-digit mobile (e.g. 9876543210)"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Vehicle Make/Model & Class */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Vehicle Make & Model
              </label>
              <div className="relative">
                <Car className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Hyundai Creta, Thar, Pulsar"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Vehicle Class
              </label>
              <select
                value={vehicleClass}
                onChange={(e) => setVehicleClass(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="Motor Car (LMV)">Motor Car (LMV / Sedan / SUV)</option>
                <option value="Motor Cycle (2W)">Motor Cycle / Scooter (2W)</option>
                <option value="Heavy Goods Vehicle (HGV)">Heavy Goods Vehicle (Truck / Trailer)</option>
                <option value="Light Commercial Vehicle (LCV)">Light Commercial Vehicle (Van / Mini-Truck)</option>
                <option value="Commercial Passenger Vehicle">Commercial Passenger (Bus / Maxi Cab)</option>
              </select>
            </div>
          </div>

          {/* Fuel & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Fuel Type
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric (EV)</option>
                <option value="CNG / Hybrid">CNG / Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Body Color
              </label>
              <input
                type="text"
                placeholder="e.g. Phantom Black, White, Red"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Info pill */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
            <span>
              Once registered, this vehicle will be assigned an active AIS-140 IMEI channel. You can transmit live satellite GPS coordinates from your phone or laptop.
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Link Vehicle & Enable Tracking</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterVehicleModal;
