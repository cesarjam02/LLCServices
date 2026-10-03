/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type AdminUser } from '@/services/api';

interface AuthValue {
  user: AdminUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);
  async function login(username: string, password: string) {
    const result = await api.login(username, password);
    setUser(result.user);
  }
  async function logout() {
    await api.logout();
    setUser(null);
  }
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider no está disponible');
  return value;
}
