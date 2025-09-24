"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthResponse } from '@/types';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.getMe();
      if (response.data && response.data.user) {
        setUser(response.data.user);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      
      if (response.error) {
        return { success: false, error: response.error };
      }

      const authData = response.data as AuthResponse;
      localStorage.setItem('token', authData.token);
      setUser(authData.user);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro interno do servidor' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await api.register(name, email, password);
      
      if (response.error) {
        return { success: false, error: response.error };
      }

      const authData = response.data as AuthResponse;
      localStorage.setItem('token', authData.token);
      setUser(authData.user);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro interno do servidor' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}