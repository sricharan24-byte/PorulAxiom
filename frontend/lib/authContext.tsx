"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ApiClient, User } from "./api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: { username_or_email: string; password: string }) => Promise<void>;
  register: (data: { email: string; username: string; password: string }) => Promise<void>;
  demoLogin: (type: "admin" | "trader") => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const savedToken = localStorage.getItem("porulaxiom_token");
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      setToken(savedToken);
      const me = await ApiClient.getMe();
      setUser(me);
    } catch {
      localStorage.removeItem("porulaxiom_token");
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: { username_or_email: string; password: string }) => {
    const res = await ApiClient.login(credentials);
    localStorage.setItem("porulaxiom_token", res.access_token);
    setToken(res.access_token);
    await refreshUser();
  };

  const register = async (data: { email: string; username: string; password: string }) => {
    const res = await ApiClient.register(data);
    localStorage.setItem("porulaxiom_token", res.access_token);
    setToken(res.access_token);
    await refreshUser();
  };

  const demoLogin = async (type: "admin" | "trader") => {
    const res = await ApiClient.demoLogin(type);
    localStorage.setItem("porulaxiom_token", res.access_token);
    setToken(res.access_token);
    await refreshUser();
  };

  const logout = () => {
    localStorage.removeItem("porulaxiom_token");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, demoLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
