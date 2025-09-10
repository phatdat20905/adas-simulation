import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  login: (user: User, tokens?: { accessToken?: string; refreshToken?: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (newUser: User, tokens?: { accessToken?: string; refreshToken?: string }) => {
    localStorage.setItem("user", JSON.stringify(newUser));
    if (tokens?.accessToken) localStorage.setItem("token", tokens.accessToken);
    if (tokens?.refreshToken) localStorage.setItem("refreshToken", tokens.refreshToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
