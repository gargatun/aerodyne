import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_URL, STORAGE_KEYS, ERROR_MESSAGES } from '../constants';
import { API_CONFIG } from '../config';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  offline?: boolean;
}

interface QueuedRequest {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  timestamp: string;
}

interface TokenResponse {
  access: string;
  refresh: string;
}

class ApiService {
  private baseUrl: string;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;

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

  // Обновление токена
  async refreshToken(): Promise<boolean> {
    if (this.isRefreshing) {
      // Если обновление уже выполняется, возвращаем промис текущего обновления
      return this.refreshPromise!;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        console.log('Обновление токена...');
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        
        if (!refreshToken) {
          console.log('Refresh токен не найден');
          return false;
        }
        
        const response = await fetch(`${this.baseUrl}${API_CONFIG.endpoints.auth.refresh}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });
        
        if (!response.ok) {
          console.error('Не удалось обновить токен:', response.status);
          return false;
        }
        
        const data = await response.json() as TokenResponse;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, data.access);
        
        if (data.refresh) {
          await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh);
        }
        
        console.log('Токен успешно обновлен');
        return true;
      } catch (error) {
        console.error('Ошибка при обновлении токена:', error);
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();
    
    return this.refreshPromise;
  }

  // Проверка и обработка ответа с ошибкой 401
  private async handleUnauthorizedResponse<T>(endpoint: string, options: RequestInit, retryCount: number = 0): Promise<ApiResponse<T>> {
    if (retryCount > 0) {
      console.log('Превышено количество попыток авторизации');
      return { error: 'Не удалось авторизоваться после обновления токена' };
    }
    
    const refreshSuccessful = await this.refreshToken();
    
    if (!refreshSuccessful) {
      // Если не удалось обновить токен, очищаем данные авторизации
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      return { error: ERROR_MESSAGES.AUTH_REQUIRED };
    }
    
    // Повторяем запрос с новым токеном
    options.headers = await this.getHeaders();
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      
      if (response.status === 401) {
        // Если после обновления токена все еще 401, возможно, проблема с сервером или токен невалиден
        return this.handleUnauthorizedResponse<T>(endpoint, options, retryCount + 1);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! Status: ${response.status}, Body:`, errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      return { data: data as T };
    } catch (error) {
      console.error('Ошибка повторного запроса:', error);
      return { error: (error as Error).message };
    }
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
      const options: RequestInit = {
        method: 'GET',
        headers,
      };
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);

      console.log(`Ответ от сервера: ${response.status}`);
      
      if (response.status === 401) {
        return this.handleUnauthorizedResponse<T>(endpoint, options);
      }
      
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
        await this.addRequestToQueue({
          id: Date.now().toString(),
          endpoint,
          method: 'POST',
          body,
          timestamp: new Date().toISOString(),
        });
        return { error: ERROR_MESSAGES.OFFLINE_MODE, offline: true };
      }

      console.log(`Отправка POST запроса на: ${this.baseUrl}${endpoint}`);
      console.log('Тело запроса:', body);

      const headers = await this.getHeaders();
      const options: RequestInit = {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      };
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);

      console.log(`Ответ от сервера: ${response.status}`);
      
      if (response.status === 401 && !endpoint.includes('token')) {
        // Не пытаемся обновить токен для запросов авторизации, чтобы избежать бесконечной рекурсии
        return this.handleUnauthorizedResponse<T>(endpoint, options);
      }
      
      if (!response.ok) {
        let errorText;
        
        try {
          errorText = await response.text();
          console.error(`HTTP error! Status: ${response.status}, Body:`, errorText);
          
          // Подробная обработка ошибок 400 (Bad Request)
          if (response.status === 400) {
            try {
              const errorData = JSON.parse(errorText);
              let errorDetails = '';
              
              // Формируем подробное сообщение об ошибке
              if (typeof errorData === 'object') {
                Object.keys(errorData).forEach(key => {
                  const value = errorData[key];
                  if (Array.isArray(value)) {
                    errorDetails += `${key}: ${value.join(', ')}; `;
                  } else {
                    errorDetails += `${key}: ${value}; `;
                  }
                });
              }
              
              return { error: `HTTP error 400 Bad Request. ${errorDetails}\nBody: ${errorText}` };
            } catch (jsonError) {
              // Если не удалось распарсить JSON, возвращаем оригинальный текст ошибки
            }
          }
        } catch (textError) {
          errorText = 'Не удалось получить текст ошибки';
        }
        
        throw new Error(`HTTP error! Status: ${response.status}, Body: ${errorText}`);
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
        await this.addRequestToQueue({
          id: Date.now().toString(),
          endpoint,
          method: 'PUT',
          body,
          timestamp: new Date().toISOString(),
        });
        return { error: ERROR_MESSAGES.OFFLINE_MODE, offline: true };
      }

      console.log(`Отправка PUT запроса на: ${this.baseUrl}${endpoint}`);
      console.log('Тело запроса:', body);

      const headers = await this.getHeaders();
      const options: RequestInit = {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      };
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);

      console.log(`Ответ от сервера: ${response.status}`);
      
      if (response.status === 401) {
        // Обработка ошибки авторизации
        return this.handleUnauthorizedResponse<T>(endpoint, options);
      }
      
      if (!response.ok) {
        let errorText;
        
        try {
          errorText = await response.text();
          console.error(`HTTP error! Status: ${response.status}, Body:`, errorText);
          
          // Подробная обработка ошибок 400 (Bad Request)
          if (response.status === 400) {
            try {
              const errorData = JSON.parse(errorText);
              let errorDetails = '';
              
              // Формируем подробное сообщение об ошибке
              if (typeof errorData === 'object') {
                Object.keys(errorData).forEach(key => {
                  const value = errorData[key];
                  if (Array.isArray(value)) {
                    errorDetails += `${key}: ${value.join(', ')}; `;
                  } else {
                    errorDetails += `${key}: ${value}; `;
                  }
                });
              }
              
              return { error: `HTTP error 400 Bad Request. ${errorDetails}\nBody: ${errorText}` };
            } catch (jsonError) {
              // Если не удалось распарсить JSON, возвращаем оригинальный текст ошибки
            }
          }
        } catch (textError) {
          errorText = 'Не удалось получить текст ошибки';
        }
        
        throw new Error(`HTTP error! Status: ${response.status}, Body: ${errorText}`);
      }

      const data = await response.json();
      console.log('Данные ответа:', data);
      return { data };
    } catch (error) {
      console.error('Ошибка API запроса:', error);
      return { error: (error as Error).message };
    }
  }

  async patch<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const isConnected = await this.isConnected();
      
      if (!isConnected) {
        // Сохраняем запрос для отправки позже
        await this.addRequestToQueue({
          id: Date.now().toString(),
          endpoint,
          method: 'PATCH',
          body,
          timestamp: new Date().toISOString(),
        });
        return { error: ERROR_MESSAGES.OFFLINE_MODE, offline: true };
      }

      console.log(`Отправка PATCH запроса на: ${this.baseUrl}${endpoint}`);
      console.log('Тело запроса:', JSON.stringify(body));

      const headers = await this.getHeaders();
      console.log('Заголовки запроса:', Object.fromEntries(headers.entries()));

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      });

      console.log(`Ответ от сервера: ${response.status}`);
      
      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
          console.error(`HTTP error! Status: ${response.status}, Body:`, errorText);
          
          // Подробная обработка ошибок 400 (Bad Request)
          if (response.status === 400) {
            try {
              const errorData = JSON.parse(errorText);
              let errorDetails = '';
              
              // Формируем подробное сообщение об ошибке
              if (typeof errorData === 'object') {
                Object.keys(errorData).forEach(key => {
                  const value = errorData[key];
                  if (Array.isArray(value)) {
                    errorDetails += `${key}: ${value.join(', ')}; `;
                  } else {
                    errorDetails += `${key}: ${value}; `;
                  }
                });
              }
              
              return { error: `HTTP error 400 Bad Request. ${errorDetails}\nBody: ${errorText}` };
            } catch (jsonError) {
              // Если не удалось распарсить JSON, возвращаем оригинальный текст ошибки
              console.error('Ошибка парсинга JSON ответа:', jsonError);
            }
          }
        } catch (textError) {
          errorText = 'Не удалось получить текст ошибки';
          console.error('Ошибка получения текста ответа:', textError);
        }
        
        return { error: `HTTP error! Status: ${response.status}, Body: ${errorText}` };
      }

      const data = await response.json();
      console.log('Данные ответа PATCH:', data);
      return { data };
    } catch (error) {
      console.error('Ошибка API запроса (PATCH):', error);
      return { error: (error as Error).message };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const isConnected = await this.isConnected();
      
      if (!isConnected) {
        // Сохраняем запрос для отправки позже
        await this.addRequestToQueue({
          id: Date.now().toString(),
          endpoint,
          method: 'DELETE',
          timestamp: new Date().toISOString(),
        });
        return { error: ERROR_MESSAGES.OFFLINE_MODE, offline: true };
      }

      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! Status: ${response.status}, Body:`, errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  // Добавление запроса в очередь для отправки в офлайн-режиме
  private async addRequestToQueue(request: QueuedRequest): Promise<void> {
    try {
      const queueString = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_REQUESTS) || '[]';
      const queue: QueuedRequest[] = JSON.parse(queueString);
      
      // Добавляем новый запрос в очередь
      queue.push(request);
      
      // Сохраняем обновленную очередь
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_REQUESTS, JSON.stringify(queue));
      
      console.log(`Запрос добавлен в очередь: ${request.method} ${request.endpoint}`);
    } catch (error) {
      console.error('Ошибка при добавлении запроса в очередь:', error);
    }
  }

  // Метод для синхронизации офлайн данных
  async syncOfflineRequests(): Promise<{ success: boolean; syncedCount: number; failedCount: number }> {
    try {
      const isConnected = await this.isConnected();
      
      if (!isConnected) {
        return {
          success: false,
          syncedCount: 0,
          failedCount: 0
        };
      }

      const queueString = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_REQUESTS) || '[]';
      const queue: QueuedRequest[] = JSON.parse(queueString);

      if (queue.length === 0) {
        return {
          success: true,
          syncedCount: 0,
          failedCount: 0
        };
      }

      console.log(`Начало синхронизации ${queue.length} офлайн-запросов`);
      
      const headers = await this.getHeaders();
      const failedRequests: QueuedRequest[] = [];
      let syncedCount = 0;

      // Создаем массив изменений для отправки на эндпоинт синхронизации
      const deliveryChanges = queue
        .filter(req => req.endpoint.includes('/deliveries/') && ['PUT', 'POST', 'PATCH'].includes(req.method))
        .map(req => {
          let action = 'update';
          if (req.method === 'POST') {
            action = 'create';
          }
          
          const id = req.endpoint.split('/').pop();
          
          return {
            id: req.id,
            action,
            data: {
              ...(id && !isNaN(Number(id)) ? { id: Number(id) } : {}),
              ...req.body
            }
          };
        });

      // Если есть изменения для синхронизации
      if (deliveryChanges.length > 0) {
        try {
          // Отправляем запрос на синхронизацию
          const syncResponse = await fetch(`${this.baseUrl}/deliveries/sync/`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ changes: deliveryChanges }),
          });
          
          if (syncResponse.ok) {
            // Удаляем синхронизированные запросы из очереди
            const newQueue = queue.filter(req => 
              !deliveryChanges.some(change => change.id === req.id)
            );
            
            // Обновляем очередь в хранилище
            await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_REQUESTS, JSON.stringify(newQueue));
            
            syncedCount += deliveryChanges.length;
          } else {
            // Если ошибка - оставляем запросы в очереди
            failedRequests.push(...queue.filter(req => 
              deliveryChanges.some(change => change.id === req.id)
            ));
          }
        } catch (error) {
          console.error('Ошибка синхронизации доставок:', error);
          // Если ошибка - оставляем запросы в очереди
          failedRequests.push(...queue.filter(req => 
            deliveryChanges.some(change => change.id === req.id)
          ));
        }
      }

      // Обрабатываем оставшиеся запросы по одному
      for (const request of queue) {
        // Пропускаем запросы, которые уже обработаны через синхронизацию
        if (deliveryChanges.some(change => change.id === request.id)) {
          continue;
        }
        
        try {
          const response = await fetch(`${this.baseUrl}${request.endpoint}`, {
            method: request.method,
            headers,
            body: request.body ? JSON.stringify(request.body) : undefined,
          });

          if (response.ok) {
            syncedCount++;
          } else {
            failedRequests.push(request);
          }
        } catch (error) {
          console.error('Ошибка синхронизации запроса:', error);
          failedRequests.push(request);
        }
      }

      // Сохраняем неудачные запросы обратно в очередь
      if (failedRequests.length > 0) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.OFFLINE_REQUESTS,
          JSON.stringify(failedRequests)
        );
      } else {
        // Если все запросы успешны, очищаем очередь
        await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_REQUESTS);
      }
      
      console.log(`Синхронизация завершена: успешно ${syncedCount}, ошибок ${failedRequests.length}`);

      return {
        success: true,
        syncedCount,
        failedCount: failedRequests.length
      };
    } catch (error) {
      console.error('Ошибка при синхронизации данных:', error);
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0
      };
    }
  }

  // Проверка наличия ожидающих запросов
  async hasOfflineRequests(): Promise<boolean> {
    try {
      const queueString = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_REQUESTS) || '[]';
      const queue: QueuedRequest[] = JSON.parse(queueString);
      return queue.length > 0;
    } catch (error) {
      console.error('Ошибка при проверке офлайн-запросов:', error);
      return false;
    }
  }

  // Получение количества ожидающих запросов
  async getOfflineRequestsCount(): Promise<number> {
    try {
      const queueString = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_REQUESTS) || '[]';
      const queue: QueuedRequest[] = JSON.parse(queueString);
      return queue.length;
    } catch (error) {
      console.error('Ошибка при получении количества офлайн-запросов:', error);
      return 0;
    }
  }
}

export const apiService = new ApiService(API_URL); 