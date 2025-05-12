import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials } from '../types';
import { login as loginService, logout as logoutService, getCurrentUser } from '../services/authService';

// Определяем тип контекста
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

// Создаем контекст с начальными значениями
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  login: async () => {},
  logout: () => {},
});

// Хук для использования контекста
export const useAuth = () => useContext(AuthContext);

// Свойства провайдера
interface AuthProviderProps {
  children: ReactNode;
}

// Компонент провайдер
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Проверка авторизации при загрузке
  useEffect(() => {
    const checkAuth = () => {
      try {
        const currentUser = getCurrentUser();
        setUser(currentUser);
        setLoading(false);
      } catch (err) {
        setUser(null);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Функция для входа
  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);

    try {
      const loggedInUser = await loginService(credentials);
      setUser(loggedInUser);
    } catch (err) {
      setError('Ошибка при авторизации. Проверьте логин и пароль.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Функция для выхода
  const logout = () => {
    logoutService();
    setUser(null);
  };

  // Предоставляем значения контекста
  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 