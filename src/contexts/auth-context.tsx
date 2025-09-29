"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, AuthResponse } from "@/types";
import { api } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isHydrated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Log de mudanças de estado importantes
  useEffect(() => {
    console.log("🔄 AUTH STATE:", {
      user: user ? { name: user.name, role: user.role } : null,
      loading,
      isHydrated
    });
  }, [user, loading, isHydrated]);

  // Validar autenticação ao iniciar - SEMPRE com backend
  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      
      // Aguardar um tick para garantir que os estados sejam atualizados
      setTimeout(() => {
        setIsHydrated(true);
      }, 0);
    };
    
    initAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    console.log("🔍 AuthContext - Iniciando checkAuth...");
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log("❌ AuthContext - Nenhum token encontrado");
      setUser(null);
      setLoading(false);
      return;
    }

    console.log("🔑 AuthContext - Token encontrado, fazendo requisição para /api/auth/me");

    try {
      const response = await api.getMe();
      console.log("📡 AuthContext - Resposta da API:", response);
      
      if (response.error) {
        console.log("❌ AuthContext - Token inválido, removendo...", response.error);
        localStorage.removeItem('token');
        setUser(null);
        setLoading(false);
        return;
      }

      if (response.data) {
        console.log("✅ AuthContext - Usuário autenticado:", { 
          email: response.data.data.email, 
          role: response.data.data.role,
          name: response.data.data.name,
          id: response.data.data.id 
        });
        setUser(response.data.data);
      } else {
        console.log("❌ AuthContext - Resposta sem dados do usuário");
        localStorage.removeItem('token');
        setUser(null);
      }
      
      console.log("🏁 AuthContext - checkAuth finalizado, loading=false");
      setLoading(false);
    } catch (error) {
      console.error('❌ AuthContext - Erro ao verificar autenticação:', error);
      localStorage.removeItem('token');
      setUser(null);
      console.log("🏁 AuthContext - checkAuth finalizado, loading=false");
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      
      if (response.error) {
        return { success: false, error: response.error };
      }

      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      setUser(userData);
      
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao fazer login' 
      };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await api.register(name, email, password);

      if (response.error) {
        return { success: false, error: response.error };
      }

      const authData = response.data as AuthResponse;

      localStorage.setItem("token", authData.token);
      document.cookie = `token=${authData.token}; path=/; max-age=${
        7 * 24 * 60 * 60
      }`;

      setUser(authData.user);

      return { success: true };
    } catch (error) {
      return { success: false, error: "Erro interno do servidor" };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    setUser(null);
  };

  // Inicializar autenticação quando o componente monta
  useEffect(() => {
    console.log("🚀 AuthContext - Inicializando...");
    checkAuth();
  }, [checkAuth]);

  // Marcar como hidratado após o primeiro render
  useEffect(() => {
    console.log("💧 AuthContext - Marcando como hidratado");
    setIsHydrated(true);
  }, []);

  // Inicializar autenticação quando o componente monta
  useEffect(() => {
    console.log("🚀 AuthContext - Inicializando...");
    checkAuth();
  }, [checkAuth]);

  // Marcar como hidratado após o primeiro render
  useEffect(() => {
    console.log("💧 AuthContext - Marcando como hidratado");
    setIsHydrated(true);
  }, []);

  const value = {
    user,
    loading,
    checkAuth,
    isHydrated,
    login,
    register,
    logout,
    isAuthenticated: !!user && isHydrated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
