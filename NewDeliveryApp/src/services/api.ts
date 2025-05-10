import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_URL, STORAGE_KEYS, ERROR_MESSAGES } from '../constants';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  offline?: boolean;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getHeaders(): Promise<Headers> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    if (token) {
      console.log('Добавляем токен в заголовки:', token.substring(0, 10) + '...');
      headers.append('Authorization', `Bearer ${token}`);
    } else {
      console.log('Токен не найден в AsyncStorage');
    }

    return headers;
  }

  private async isConnected(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected === true;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const isConnected = await this.isConnected();
      
      if (!isConnected) {
        const cachedData = await AsyncStorage.getItem(`${endpoint}_cache`);
        if (cachedData) {
          return { 
            data: JSON.parse(cachedData) as T,
            offline: true 
          };
        }
        return { error: ERROR_MESSAGES.OFFLINE_MODE, offline: true };
      }

      console.log(`Отправка GET запроса на: ${this.baseUrl}${endpoint}`);
      
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
      });

      console.log(`Ответ от сервера: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! Status: ${response.status}, Body:`, errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Данные ответа:', data);
      
      // Кэшируем данные для офлайн режима
      await AsyncStorage.setItem(`${endpoint}_cache`, JSON.stringify(data));
      
      return { data };
    } catch (error) {
      console.error('Ошибка GET запроса:', error);
      return { error: (error as Error).message };
    }
  }

  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const isConnected = await this.isConnected();
      
      if (!isConnected) {
        // Сохраняем запрос для отправки позже
        const pendingRequests = JSON.parse(
          await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_DELIVERIES) || '[]'
        );
        pendingRequests.push({
          endpoint,
          method: 'POST',
          body,
          timestamp: new Date().toISOString(),
        });
        await AsyncStorage.setItem(
          STORAGE_KEYS.OFFLINE_DELIVERIES,
          JSON.stringify(pendingRequests)
        );
        return { error: ERROR_MESSAGES.OFFLINE_MODE, offline: true };
      }

      console.log(`Отправка POST запроса на: ${this.baseUrl}${endpoint}`);
      console.log('Тело запроса:', body);

      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      console.log(`Ответ от сервера: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! Status: ${response.status}, Body:`, errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Данные ответа:', data);
      return { data };
    } catch (error) {
      console.error('Ошибка API запроса:', error);
      return { error: (error as Error).message };
    }
  }

  async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const isConnected = await this.isConnected();
      
      if (!isConnected) {
        // Сохраняем запрос для отправки позже
        const pendingRequests = JSON.parse(
          await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_DELIVERIES) || '[]'
        );
        pendingRequests.push({
          endpoint,
          method: 'PUT',
          body,
          timestamp: new Date().toISOString(),
        });
        await AsyncStorage.setItem(
          STORAGE_KEYS.OFFLINE_DELIVERIES,
          JSON.stringify(pendingRequests)
        );
        return { error: ERROR_MESSAGES.OFFLINE_MODE, offline: true };
      }

      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const isConnected = await this.isConnected();
      
      if (!isConnected) {
        return { error: ERROR_MESSAGES.OFFLINE_MODE, offline: true };
      }

      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  // Метод для синхронизации офлайн данных
  async syncOfflineData(): Promise<void> {
    try {
      const isConnected = await this.isConnected();
      
      if (!isConnected) {
        return;
      }

      const pendingRequests = JSON.parse(
        await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_DELIVERIES) || '[]'
      );

      if (pendingRequests.length === 0) {
        return;
      }

      const headers = await this.getHeaders();
      const failedRequests = [];

      for (const request of pendingRequests) {
        try {
          const response = await fetch(`${this.baseUrl}${request.endpoint}`, {
            method: request.method,
            headers,
            body: request.body ? JSON.stringify(request.body) : undefined,
          });

          if (!response.ok) {
            failedRequests.push(request);
          }
        } catch (error) {
          failedRequests.push(request);
        }
      }

      // Сохраняем неудачные запросы обратно
      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_DELIVERIES,
        JSON.stringify(failedRequests)
      );
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  }
}

export const apiService = new ApiService(API_URL); 