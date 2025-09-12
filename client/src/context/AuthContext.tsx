import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User } from "../types";
import * as api from "../services/api"; // 👉 import api

interface AuthContextType {
  user: User | null;
  login: (user: User, tokens?: { accessToken?: string; refreshToken?: string }) => void;
  logout: () => Promise<void>; // 👉 trả về Promise
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
      // 👉 Gọi API logout để server xóa refresh token hoặc session
      await api.logout();
    } catch (error) {
      console.error("Logout API error:", error);
      // vẫn tiếp tục xóa local storage để đảm bảo client thoát
    } finally {
      localStorage.clear();
      setUser(null);
    }
  };

  const updateUser = (updatedUser: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const newUser = { ...prev, ...updatedUser };
      localStorage.setItem("user", JSON.stringify(newUser));
      return newUser;
    });
  };

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
