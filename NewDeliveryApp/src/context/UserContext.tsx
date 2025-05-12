import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { API_CONFIG } from '../config';
import { User } from '../types';

// Интерфейсы данных профиля
interface UserProfile {
  user: User;
  phone: string;
  email: string;
}

interface UserStats {
  total_deliveries: number;
  successful_deliveries: number;
  total_delivery_time_seconds: number;
  total_delivery_time_hours: number;
}

// Интерфейс контекста
interface UserContextType {
  userProfile: UserProfile | null;
  userStats: UserStats | null;
  loading: boolean;
  refreshing: boolean;
  refreshUserData: () => Promise<void>;
}

// Создаем контекст
const UserContext = createContext<UserContextType | undefined>(undefined);

// Хук для использования контекста
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Провайдер контекста
export const UserProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Функция для загрузки данных пользователя
  const refreshUserData = useCallback(async () => {
    try {
      setRefreshing(true);
      
      const response = await apiService.get<UserProfile & UserStats>(API_CONFIG.endpoints.profile.get);
      
      if (response.error) {
        console.error('Error loading user data:', response.error);
        return;
      }
      
      if (response.data) {
        const { user, phone, email, ...stats } = response.data;
        setUserProfile({ user, phone, email });
        setUserStats(stats as unknown as UserStats);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  // Первоначальная загрузка данных
  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  // Значение контекста
  const value = {
    userProfile,
    userStats,
    loading,
    refreshing,
    refreshUserData
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserContext; 