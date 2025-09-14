import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import type { User } from "../types";
import * as api from "../services/api";

interface AuthContextType {
  user: User | null;
  login: (user: User, tokens?: { accessToken?: string; refreshToken?: string }) => void;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const login = (
    newUser: User,
    tokens?: { accessToken?: string; refreshToken?: string }
  ) => {
    localStorage.setItem("user", JSON.stringify(newUser));
    if (tokens?.accessToken) localStorage.setItem("token", tokens.accessToken);
    if (tokens?.refreshToken) localStorage.setItem("refreshToken", tokens.refreshToken);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      localStorage.clear();
      setUser(null);
    }
  };

  // ✅ dùng useCallback để giữ reference ổn định
  const updateUser = useCallback((updatedUser: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const newUser = { ...prev, ...updatedUser };
      localStorage.setItem("user", JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
