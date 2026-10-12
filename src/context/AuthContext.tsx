import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organization, UserRole } from '../types';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../services/api';
import { auth, signInWithGoogle, firebaseSignOut } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: { organizationName: string; industry: string; country: string; fullName: string; email: string; password: string; title: string }) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  setOrganization: (org: Organization) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadAuth() {
      const token = getStoredToken();
      const savedUserStr = localStorage.getItem('carbonflow_user');

      if (token && savedUserStr) {
        try {
          const parsedUser: User = JSON.parse(savedUserStr);
          setUser(parsedUser);
          const org = await api.getOrganization();
          setOrganization(org);
        } catch {
          clearStoredToken();
        }
      }
      setIsLoading(false);
    }
    loadAuth();

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const token = await fbUser.getIdToken();
        setStoredToken(token);
        const appUser: User = {
          id: fbUser.uid,
          email: fbUser.email || 'user@carbonflow.io',
          fullName: fbUser.displayName || 'Google User',
          title: 'Sustainability Officer',
          role: fbUser.email === 'maddineharish@gmail.com' ? 'COMPANY_ADMIN' : 'SUSTAINABILITY_MANAGER',
          status: 'ACTIVE',
          active: true,
          createdAt: new Date().toISOString()
        };
        setUser(appUser);
        localStorage.setItem('carbonflow_user', JSON.stringify(appUser));
        try {
          const org = await api.getOrganization();
          setOrganization(org);
        } catch {
          // Keep existing organization or default
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      setUser(res.user);
      setOrganization(res.organization);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const res = await signInWithGoogle();
      const token = await res.firebaseUser.getIdToken();
      setStoredToken(token);
      setUser(res.appUser);
      setOrganization(res.organization);
      localStorage.setItem('carbonflow_user', JSON.stringify(res.appUser));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { organizationName: string; industry: string; country: string; fullName: string; email: string; password: string; title: string }) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      setUser(res.user);
      setOrganization(res.organization);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearStoredToken();
    firebaseSignOut().catch(() => {});
    setUser(null);
    setOrganization(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const namesByRole: Record<UserRole, { name: string; title: string; email: string }> = {
      COMPANY_ADMIN: { name: 'Sarah Chen', title: 'Chief Operations & Governance Officer', email: 'admin@carbonflow.io' },
      SUSTAINABILITY_MANAGER: { name: 'Marcus Vance', title: 'Head of ESG & Sustainability Auditing', email: 'sustainability@carbonflow.io' },
      ANALYST: { name: 'Elena Rostova', title: 'Senior Carbon Accounting Analyst', email: 'analyst@carbonflow.io' },
      EMPLOYEE: { name: 'David Kim', title: 'Facilities Operations Specialist', email: 'employee@carbonflow.io' }
    };

    const updatedUser: User = {
      ...user,
      role: newRole,
      fullName: namesByRole[newRole].name,
      title: namesByRole[newRole].title,
      email: namesByRole[newRole].email
    };
    setUser(updatedUser);
    localStorage.setItem('carbonflow_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        switchRole,
        setOrganization
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
