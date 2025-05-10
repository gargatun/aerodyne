import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';
import { LoginCredentials, AuthResponse, User } from '../types';
import { STORAGE_KEYS } from '../constants';
import { API_CONFIG } from '../config';

class AuthService {
  async login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiService.post<AuthResponse>(API_CONFIG.endpoints.auth.login, credentials);

      if (response.error || !response.data) {
        console.log('Ошибка авторизации:', response.error);
        return { success: false, error: response.error || 'Ошибка авторизации' };
      }

      const { access, refresh } = response.data;

      await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, access);
      
      if (refresh) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
      }

      if (response.data.user) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
      } else {
        const userData = await this.refreshUserData();
        
        if (!userData) {
          const tempUser: User = {
            id: 0,
            username: credentials.username,
            email: `${credentials.username}@example.com`,
            firstName: credentials.username,
            lastName: ''
          };
          
          console.log('Создан временный пользователь:', tempUser);
          await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(tempUser));
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Ошибка при входе:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (!userData) return null;
      return JSON.parse(userData) as User;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    
    if (!token) {
      return false;
    }
    
    // Попытка обновить токен, если он есть
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (refreshToken) {
      try {
        // Проверяем работоспособность токена
        const testResponse = await apiService.get(API_CONFIG.endpoints.auth.me);
        if (testResponse.error) {
          // Если ошибка, пробуем обновить токен
          const refreshSuccessful = await apiService.refreshToken();
          console.log('Результат обновления токена:', refreshSuccessful);
          return refreshSuccessful;
        }
        return true;
      } catch (error) {
        console.error('Ошибка при проверке токена:', error);
        return false;
      }
    }
    
    return true;
  }

  async refreshUserData(): Promise<User | null> {
    try {
      console.log('Обновление данных пользователя...');
      const response = await apiService.get<User>(API_CONFIG.endpoints.auth.me);
      
      if (response.error || !response.data) {
        console.log('Не удалось получить данные пользователя:', response.error);
        return null;
      }

      console.log('Получены данные пользователя:', response.data);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return null;
    }
  }
}

export const authService = new AuthService(); 