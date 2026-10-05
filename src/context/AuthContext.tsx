import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemo: (role: 'admin' | 'staff') => Promise<void>;
  register: (data: { name: string; email: string; phone?: string; password: string; confirmPassword?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('smartstock_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.getCurrentUser();
        setUser(res.user);
      } catch (err) {
        console.warn('Session expired, clearing token');
        localStorage.removeItem('smartstock_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    localStorage.setItem('smartstock_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const loginAsDemo = async (role: 'admin' | 'staff') => {
    const email = role === 'admin' ? 'admin@smartstock.io' : 'staff@smartstock.io';
    const password = role === 'admin' ? 'admin123' : 'staff123';
    await login(email, password);
  };

  const register = async (data: { name: string; email: string; phone?: string; password: string; confirmPassword?: string }) => {
    const res = await api.register(data);
    localStorage.setItem('smartstock_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('smartstock_token');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff' || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        isStaff,
        login,
        loginAsDemo,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
