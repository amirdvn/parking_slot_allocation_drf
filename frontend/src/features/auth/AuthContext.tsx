import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../../lib/api';
import type { UserProfile, AuthTokens } from '../../types/auth';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: AuthTokens) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // در زمان لود اولیه، چک می‌کنیم ببینیم کاربر توکن داره یا نه
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('access_token');

      if (accessToken) {
        try {
          // گرفتن پروفایل کاربر با توکنی که داریم
          const response = await api.get<UserProfile>('/api/profile/me/');
          setUser(response.data);
        } catch (error) {
          console.error("Failed to fetch user profile", error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (tokens: AuthTokens) => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);

    // بعد از گرفتن توکن، پروفایل رو می‌گیریم
    const response = await api.get<UserProfile>('/api/profile/me/');
    setUser(response.data);
  };

  const logout = async () => {
    const refresh = localStorage.getItem('refresh_token');

    if (refresh) {
      try {
        // باطل کردن توکن در بک‌اند
        await api.post('/api/auth/logout/', { refresh });
      } catch (error) {
        console.error("Logout failed in backend", error);
      }
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    window.location.href = '/login'; // هدایت به صفحه ورود
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
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