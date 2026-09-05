import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { RoleName } from '../../shared/types.ts';

export interface UserProfile {
  id: number;
  uuid: string;
  name: string;
  email: string;
  role: RoleName;
  roleId: number;
  unitId?: number | null;
  unit?: { id: number; code: string; name: string } | null;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  switchUser: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_PERSONAS = [
  {
    role: 'ADMIN' as RoleName,
    name: 'Ahmad Fauzi',
    email: 'admin@bankfinancial.com',
    desc: 'System Administrator (Full Configuration & Audit Access)'
  },
  {
    role: 'RISK_MANAGEMENT' as RoleName,
    name: 'Siti Rahmawati',
    email: 'risk.mgmt@bankfinancial.com',
    desc: 'Risk Management Directorate (Reviewer & Approver)'
  },
  {
    role: 'RISK_OWNER' as RoleName,
    name: 'Budi Santoso',
    email: 'risk.owner@bankfinancial.com',
    desc: 'Head of Business Dev (Risk Assessor & Action Plan Owner)'
  },
  {
    role: 'MANAGEMENT' as RoleName,
    name: 'Hendra Kusuma',
    email: 'management@bankfinancial.com',
    desc: 'Director of Risk & Strategy (C-Level Executive Oversight)'
  },
  {
    role: 'AUDITOR' as RoleName,
    name: 'Dewi Lestari',
    email: 'auditor@bankfinancial.com',
    desc: 'Internal Audit Lead (Independent Inspection & Audit Trail)'
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('rcsa_token'));
  const [loading, setLoading] = useState(true);

  const loginWithEmail = async (email: string) => {
    try {
      setLoading(true);
      const res = await api.login(email);
      localStorage.setItem('rcsa_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem('rcsa_token');
        if (savedToken) {
          const profile = await api.getMe();
          setUser(profile);
        } else {
          // Default to Risk Management persona for preview inspection
          await loginWithEmail('risk.mgmt@bankfinancial.com');
        }
      } catch (err) {
        console.warn('Session expired, logging in as demo Risk Management...', err);
        try {
          await loginWithEmail('risk.mgmt@bankfinancial.com');
        } catch {
          // ignore
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem('rcsa_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login: loginWithEmail,
        switchUser: loginWithEmail,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
