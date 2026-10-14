import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  ShieldCheck, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Lock,
  User,
  Eye,
  Check
} from 'lucide-react';
import { validateIndianMobile } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';

export interface OwnerLoginProps {
  onLogin: (mobile: string, name: string) => void;
  onBack: () => void;
}

type Step = 'mobile' | 'otp';

const OwnerLogin: React.FC<OwnerLoginProps> = ({ onLogin, onBack }) => {
  const { verifyOwnerOTP } = useAuth();

  // Component state
  const [step, setStep] = useState<Step>('mobile');
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // References for 6 OTP input boxes
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown effect for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  // Focus first OTP input when step changes to 'otp'
  useEffect(() => {
    if (step === 'otp' && otpInputsRef.current[0]) {
      otpInputsRef.current[0]?.focus();
    }
  }, [step]);

  // Clean mobile digits
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, ''); // digits only
    if (rawValue.length <= 10) {
      setMobile(rawValue);
      setError(null);
    }
  };

  const isMobileValid = validateIndianMobile(mobile);

  // Send OTP handler
  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isMobileValid) {
      setError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }
    setError(null);
    setOtpSent(true);
    setTimer(30);
    setStep('otp');
    setOtp(['', '', '', '', '', '']);
  };

  // Resend OTP handler
  const handleResendOtp = () => {
    if (timer > 0) return;
    setTimer(30);
    setError(null);
    setOtp(['', '', '', '', '', '']);
    if (otpInputsRef.current[0]) {
      otpInputsRef.current[0]?.focus();
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, value: string) => {
    setError(null);
    const cleaned = value.replace(/\D/g, '');

    // Support copy-paste of entire OTP (e.g. "123456")
    if (cleaned.length > 1) {
      const pastedDigits = cleaned.slice(0, 6).split('');
      const updated = [...otp];
      pastedDigits.forEach((digit, i) => {
        if (i < 6) updated[i] = digit;
      });
      setOtp(updated);
      const nextFocus = Math.min(pastedDigits.length, 5);
      otpInputsRef.current[nextFocus]?.focus();

      if (updated.every((d) => d !== '')) {
        verifyOtpSubmission(updated.join(''));
      }
      return;
    }

    const updated = [...otp];
    updated[index] = cleaned;
    setOtp(updated);

    // Auto advance focus to next input
    if (cleaned && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto verify when all 6 digits entered
    if (cleaned && index === 5 && updated.every((d) => d !== '')) {
      verifyOtpSubmission(updated.join(''));
    }
  };

  // Handle OTP backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Verify OTP submission logic
  const verifyOtpSubmission = (otpCode: string) => {
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of the OTP.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    setTimeout(() => {
      // Validate OTP using AuthContext helper or demo code "123456"
      const isValid = verifyOwnerOTP ? verifyOwnerOTP(otpCode) : otpCode === '123456';

      if (isValid) {
        setIsSuccess(true);
        setTimeout(() => {
          const finalName = name.trim() || 'Vehicle Owner';
          onLogin(mobile, finalName);
        }, 800);
      } else {
        setIsVerifying(false);
        setError('Invalid OTP. Please enter the demo code: 123456');
      }
    }, 400);
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyOtpSubmission(otp.join(''));
  };

  const maskedDisplayMobile = mobile.length === 10
    ? `+91 ${mobile.slice(0, 2)}••••••${mobile.slice(8)}`
    : `+91 ${mobile}`;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 relative overflow-hidden select-none">
      {/* Background Tactical Grid */}
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
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-10 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors text-sm font-medium py-1 px-3 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portals</span>
        </button>

        <div className="flex items-center gap-3">
          <Eye className="w-6 h-6 text-amber-500" />
          <span className="font-mono font-bold tracking-wider text-amber-500 text-lg">
            GARUDA NETRA
          </span>
        </div>

        <div className="text-xs font-mono text-slate-500 hidden sm:block">
          SECURE CHANNEL // AIS-140
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
            {/* Top Amber Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

            {/* Portal Badge */}
            <div className="flex items-center justify-between mb-6">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-400">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>VEHICLE OWNER AUTHENTICATION</span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                STEP {step === 'mobile' ? '1 OF 2' : '2 OF 2'}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-slate-100 mb-1">
              {step === 'mobile' ? 'Owner Telematics Login' : 'Enter 6-Digit Verification Code'}
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              {step === 'mobile' 
                ? 'Authenticate via the Indian mobile number linked to your VAHAN registration.' 
                : `A 6-digit one-time password has been dispatched to ${maskedDisplayMobile}`}
            </p>

            {/* Demo Hint Banner */}
            <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-300">
              <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold text-amber-200">Demo Credential Hint:</span> Use any valid 10-digit mobile number. OTP: <strong className="font-mono text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">123456</strong>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: MOBILE ENTRY */}
            {step === 'mobile' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                {/* Optional Full Name Input */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>OWNER NAME <span className="text-slate-500">(OPTIONAL)</span></span>
                    <span className="text-[10px] text-slate-500 font-sans">Defaults to "Vehicle Owner"</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Vikram Sharma"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-colors"
                    />
                  </div>
                </div>

                {/* Mobile Number Input */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    REGISTERED MOBILE NUMBER <span className="text-amber-500">*</span>
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-700 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/40 transition-colors">
                    {/* Prefix +91 Display */}
                    <div className="flex items-center gap-1.5 bg-slate-900/90 border-r border-slate-700 px-3.5 text-sm font-mono text-slate-300 select-none">
                      <span className="text-amber-500 font-bold">🇮🇳 +91</span>
                    </div>
                    {/* 10-Digit Input */}
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={mobile}
                      onChange={handleMobileChange}
                      placeholder="9876543210"
                      maxLength={10}
                      autoFocus
                      className="w-full px-3.5 py-3 bg-slate-900 text-sm font-mono tracking-wider text-slate-100 placeholder-slate-500 focus:outline-none"
                    />
                    {isMobileValid && (
                      <div className="flex items-center px-3 bg-slate-900 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 font-mono">
                    <span>Format: 10 digits starting with 6-9</span>
                    <span>{mobile.length}/10</span>
                  </div>
                </div>

                {/* Quick Fill Demo Helper */}
                <div className="pt-1 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Quick Test:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMobile('9876543210');
                      setName('Vikram Sharma');
                      setError(null);
                    }}
                    className="text-amber-400 hover:text-amber-300 underline font-mono text-xs"
                  >
                    Fill Demo (9876543210)
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!isMobileValid}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 mt-4 shadow-lg ${
                    isMobileValid
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 hover:shadow-amber-500/30 cursor-pointer'
                      : 'bg-slate-700/60 text-slate-400 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  <span>Send OTP</span>
                </button>
              </form>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {step === 'otp' && (
              <form onSubmit={handleVerifySubmit} className="space-y-5">
                {/* Mobile Preview & Switch */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-mono font-medium">{maskedDisplayMobile}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('mobile');
                      setError(null);
                    }}
                    className="text-amber-400 hover:text-amber-300 text-[11px] font-mono hover:underline"
                  >
                    Change Number
                  </button>
                </div>

                {/* 6 Digit Inputs */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-2 text-center">
                    ENTER 6-DIGIT SECURITY CODE
                  </label>
                  <div className="flex justify-between gap-2 max-w-xs mx-auto">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpInputsRef.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className={`w-11 h-12 text-center text-xl font-mono font-bold rounded-lg bg-slate-900 border text-slate-100 transition-all ${
                          digit
                            ? 'border-amber-500 ring-1 ring-amber-500/50 bg-slate-900/90'
                            : 'border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Quick Auto-fill Demo OTP */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      const demoDigits = ['1', '2', '3', '4', '5', '6'];
                      setOtp(demoDigits);
                      setError(null);
                      verifyOtpSubmission('123456');
                    }}
                    className="text-[11px] font-mono text-amber-400/80 hover:text-amber-300 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full transition-colors flex items-center gap-1.5"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Auto-fill OTP (123456)</span>
                  </button>
                </div>

                {/* Timer Countdown & Resend */}
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
                  <span>Didn't receive the OTP?</span>
                  {timer > 0 ? (
                    <span className="font-mono text-amber-400/90 font-medium">
                      Resend in {timer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Resend OTP</span>
                    </button>
                  )}
                </div>

                {/* Verify Submit Button with Success State */}
                <button
                  type="submit"
                  disabled={isVerifying || isSuccess}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
                    isSuccess
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                      : isVerifying
                      ? 'bg-amber-600/70 text-slate-950 cursor-wait'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 hover:shadow-amber-500/30'
                  }`}
                >
                  {isSuccess ? (
                    <>
                      <div className="w-5 h-5 rounded-full bg-white text-emerald-600 flex items-center justify-center animate-bounce">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="font-mono tracking-wider">VERIFIED // REDIRECTING...</span>
                    </>
                  ) : isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Verify & Access Grid</span>
                    </>
                  )}
                </button>
              </form>
            )}

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
        <span>Garuda Netra Citizen Portal</span>
        <span className="font-mono">End-to-End Encrypted Telematics Session</span>
      </footer>
    </div>
  );
};

export default OwnerLogin;
