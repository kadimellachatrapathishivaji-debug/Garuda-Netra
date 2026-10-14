import React, { useState } from 'react';
import { 
  ArrowLeft, 
  BadgeCheck, 
  ShieldAlert, 
  Mail, 
  Lock, 
  User, 
  Building2, 
  Award, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  Sparkles,
  Shield
} from 'lucide-react';
import { validateGovEmail } from '../../utils/validators';
import { statePoliceDepartments } from '../../data/mockPoliceStations';

export interface GovLoginProps {
  onLogin: (data: {
    email: string;
    badgeId: string;
    department: string;
    state: string;
    rank: string;
    name: string;
  }) => void;
  onBack: () => void;
}

const POLICE_RANKS = [
  'Constable',
  'Head Constable',
  'Sub Inspector',
  'Inspector',
  'DSP',
  'SP',
  'SSP',
  'DIG',
  'IG',
  'DGP',
] as const;

// Helper to deduce state name from department string
function deriveStateFromDepartment(dept: string): string {
  if (dept.includes('Police')) {
    return dept.replace(' Police', '').trim();
  }
  if (dept.includes('CBI')) {
    return 'Central Bureau of Investigation (HQ Delhi)';
  }
  if (dept.includes('NIA')) {
    return 'National Investigation Agency (HQ Delhi)';
  }
  return dept;
}

const GovLogin: React.FC<GovLoginProps> = ({ onLogin, onBack }) => {
  // Form fields
  const [email, setEmail] = useState('');
  const [badgeId, setBadgeId] = useState('');
  const [department, setDepartment] = useState(statePoliceDepartments[0] || 'Delhi Police');
  const [state, setState] = useState(deriveStateFromDepartment(statePoliceDepartments[0] || 'Delhi Police'));
  const [rank, setRank] = useState<string>(POLICE_RANKS[3]); // Default 'Inspector'
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Department change automatically updates the corresponding State
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDept = e.target.value;
    setDepartment(selectedDept);
    setState(deriveStateFromDepartment(selectedDept));
    setError(null);
  };

  const isEmailValid = validateGovEmail(email);

  // Pre-fill demo officer credentials
  const handleQuickFillDemo = () => {
    setEmail('rajesh.kumar@delhipolice.gov.in');
    setBadgeId('DL-POL-4402');
    setDepartment('Delhi Police');
    setState('Delhi');
    setRank('Inspector');
    setName('Inspector Rajesh Kumar');
    setPassword('Surveillance@2026');
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation checks
    if (!name.trim()) {
      setError('Please provide your Full Official Name.');
      return;
    }

    if (!email.trim()) {
      setError('Official government email address is required.');
      return;
    }

    if (!isEmailValid) {
      setError('Invalid official email domain. Must be @gov.in, @police.gov.in, @nic.in, or @ias.in');
      return;
    }

    if (!badgeId.trim()) {
      setError('Please enter your Police Badge ID or Service Number.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your official portal password.');
      return;
    }

    setIsSubmitting(true);

    // Simulate authentication handshake
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        onLogin({
          email: email.trim(),
          badgeId: badgeId.trim().toUpperCase(),
          department,
          state,
          rank,
          name: name.trim(),
        });
      }, 700);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 relative overflow-hidden select-none">
      {/* Tactical Background Grid */}
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
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-10 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors text-sm font-medium py-1 px-3 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portals</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span className="font-mono font-bold tracking-wider text-emerald-400 text-lg">
            GARUDA NETRA
          </span>
        </div>

        <div className="text-xs font-mono text-slate-500 hidden sm:block">
          SURVEILLANCE GRID // MHA / NATGRID
        </div>
      </header>

      {/* Main Login Form Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-xl">
          {/* Card Container */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
            {/* Top Emerald Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

            {/* Portal Badge */}
            <div className="flex items-center justify-between mb-5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>LAW ENFORCEMENT & POLICE AUTHENTICATION</span>
              </div>
              <button
                type="button"
                onClick={handleQuickFillDemo}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-700/70 hover:bg-slate-700 text-emerald-300 text-xs font-mono border border-slate-600 transition-colors"
                title="Populate demo officer credentials"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Fill Demo</span>
              </button>
            </div>

            <h2 className="text-2xl font-bold text-slate-100 mb-1">
              Law Enforcement Command Portal
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Authorized access for Police Officers and Investigators to track stolen vehicles, dispatch intercept alerts, and view ANPR/FASTag logs.
            </p>

            {/* Demo Hint Banner */}
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-xs text-emerald-300">
              <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold text-emerald-200">Demo Credential Hint:</span> Use any <strong className="font-mono text-emerald-300 bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-500/30">@gov.in</strong> or <strong className="font-mono text-emerald-300 bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-500/30">@police.gov.in</strong> email. Any password works.
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name & Badge ID Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    FULL OFFICER NAME <span className="text-emerald-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError(null);
                      }}
                      placeholder="e.g. Inspector Rajesh Kumar"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-colors"
                    />
                  </div>
                </div>

                {/* Badge ID */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    BADGE / SERVICE ID <span className="text-emerald-500">*</span>
                  </label>
                  <div className="relative">
                    <BadgeCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={badgeId}
                      onChange={(e) => {
                        setBadgeId(e.target.value.toUpperCase());
                        setError(null);
                      }}
                      placeholder="e.g. DL-POL-4402"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 uppercase transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Official Email */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>OFFICIAL EMAIL ADDRESS <span className="text-emerald-500">*</span></span>
                  <span className="text-[10px] text-slate-500 font-sans">
                    Allowed: @gov.in, @police.gov.in, @nic.in
                  </span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="officer.name@police.gov.in"
                    className={`w-full pl-9 pr-10 py-2.5 bg-slate-900 border rounded-xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
                      email.length > 0
                        ? isEmailValid
                          ? 'border-emerald-500/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40'
                          : 'border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500/40'
                        : 'border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40'
                    }`}
                  />
                  {email.length > 0 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isEmailValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Department & Rank Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* State Police Department */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    POLICE DEPARTMENT <span className="text-emerald-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={department}
                      onChange={handleDepartmentChange}
                      className="w-full pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-colors appearance-none cursor-pointer"
                    >
                      {statePoliceDepartments.map((dept) => (
                        <option key={dept} value={dept} className="bg-slate-900 text-slate-100">
                          {dept}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Rank Dropdown */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    RANK / DESIGNATION <span className="text-emerald-500">*</span>
                  </label>
                  <div className="relative">
                    <Award className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={rank}
                      onChange={(e) => {
                        setRank(e.target.value);
                        setError(null);
                      }}
                      className="w-full pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-colors appearance-none cursor-pointer"
                    >
                      {POLICE_RANKS.map((r) => (
                        <option key={r} value={r} className="bg-slate-900 text-slate-100">
                          {r}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">
                      ▼
                    </div>
                  </div>
                </div>
              </div>

              {/* State Field (Display & sync) */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>STATE / JURISDICTION</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Auto-Derived</span>
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Jurisdiction State"
                  className="w-full px-3.5 py-2 bg-slate-900/60 border border-slate-700/80 rounded-xl text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  OFFICIAL PASSWORD <span className="text-emerald-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter portal password (any demo password)"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isSuccess}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 mt-5 shadow-lg ${
                  isSuccess
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : isSubmitting
                    ? 'bg-emerald-700/80 text-white cursor-wait'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 hover:shadow-emerald-600/30 cursor-pointer'
                }`}
              >
                {isSuccess ? (
                  <>
                    <div className="w-5 h-5 rounded-full bg-white text-emerald-600 flex items-center justify-center animate-bounce">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="font-mono tracking-wider">OFFICER AUTHORIZED // LOADING GRID...</span>
                  </>
                ) : isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials with NATGRID...</span>
                  </>
                ) : (
                  <>
                    <BadgeCheck className="w-4 h-4" />
                    <span>Authorize & Access Command Center</span>
                  </>
                )}
              </button>
            </form>

            {/* Back link */}
            <div className="mt-6 pt-4 border-t border-slate-700/60 text-center">
              <button
                type="button"
                onClick={onBack}
                className="text-xs text-slate-400 hover:text-slate-300 transition-colors font-mono"
              >
                ← Return to Role Selection Gate
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-800/80 bg-slate-950/90 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
        <span>Garuda Netra Law Enforcement Command Portal</span>
        <span className="font-mono">Section 66 IT Act Protected System</span>
      </footer>
    </div>
  );
};

export default GovLogin;
