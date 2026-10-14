import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { User, OwnerUser, GovUser } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loginAsOwner: (mobile: string, name: string) => void;
  loginAsGov: (data: Omit<GovUser, 'role'>) => void;
  logout: () => void;
  verifyOwnerOTP: (otp: string) => boolean;
  pendingOTP: boolean;
  setPendingOTP: (v: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pendingOTP, setPendingOTP] = useState(false);

  const isAuthenticated = user !== null;

  const loginAsOwner = useCallback((mobile: string, name: string) => {
    const ownerUser: OwnerUser = {
      role: 'owner',
      mobile: mobile.replace(/\s/g, '').replace(/^\+91/, ''),
      name,
      isVerified: true,
    };
    setUser(ownerUser);
  }, []);

  const loginAsGov = useCallback((data: Omit<GovUser, 'role'>) => {
    const govUser: GovUser = {
      role: 'government',
      ...data,
    };
    setUser(govUser);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setPendingOTP(false);
  }, []);

  const verifyOwnerOTP = useCallback((otp: string): boolean => {
    return otp === '123456';
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loginAsOwner,
        loginAsGov,
        logout,
        verifyOwnerOTP,
        pendingOTP,
        setPendingOTP,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthProvider;
