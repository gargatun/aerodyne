import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Базовый URL API из Django бэкенда
const API_URL = 'http://localhost:8000/api';

// Класс для взаимодействия с API
class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      // Устанавливаем таймаут в 30 секунд
      timeout: 30000,
    });

    // Перехватчик для добавления токена авторизации
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Улучшаем логирование параметров запроса
        console.log(`API запрос: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
          params: config.params ? JSON.stringify(config.params) : 'нет',
          hasQueryParams: config.url?.includes('?') ? 'да' : 'нет',
          contentType: config.headers?.['Content-Type']
        });
        
        return config;
      },
      (error) => {
        console.error('Ошибка запроса API:', error);
        return Promise.reject(error);
      }
    );

    // Перехватчик для обработки ответов
    this.api.interceptors.response.use(
      (response) => {
        console.log(`API ответ (${response.status}): ${response.config.method?.toUpperCase()} ${response.config.url}`, {
          data: response.data ? (Array.isArray(response.data) ? `Массив (${response.data.length} элементов)` : 'Объект') : 'Нет данных',
          timing: response.headers['x-response-time'] || 'не указано'
        });
        return response;
      },
      (error) => {
        // Улучшенная обработка ошибок
        if (error.response) {
          console.error('API ошибка ответа:', {
            status: error.response.status,
            url: error.config?.url,
            data: error.response.data,
            message: error.message
          });
          
          // Если 401 Unauthorized - выход из системы
          if (error.response.status === 401) {
            console.warn('API: Получен статус 401, выполняется выход из системы');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
          
          // Если 429 Too Many Requests - сообщаем о превышении лимита запросов
          if (error.response.status === 429) {
            console.warn('API: Превышен лимит запросов, повторите позже');
          }
        } else if (error.request) {
          console.error('API: Нет ответа от сервера (возможно проблемы с соединением):', {
            url: error.config?.url,
            method: error.config?.method,
            message: error.message
          });
        } else {
          console.error('API: Ошибка при настройке запроса:', error.message);
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Метод для выполнения GET-запросов
  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      console.log(`API get запрос: ${endpoint}`, { config });
      const response: AxiosResponse<T> = await this.api.get<T>(endpoint, config);
      
      // Более детальное логирование результата для отладки
      if (Array.isArray(response.data)) {
        console.log(`API get ответ: получено ${response.data.length} элементов`);
      } else {
        console.log(`API get ответ: получен объект`, { 
          hasData: !!response.data, 
          type: response.data ? typeof response.data : 'undefined'
        });
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Метод для выполнения POST-запросов
  async post<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      console.log(`API post запрос: ${endpoint}`, { dataSize: data ? 'есть данные' : 'нет данных' });
      const response: AxiosResponse<T> = await this.api.post<T>(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Метод для выполнения PUT-запросов
  async put<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.put<T>(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Метод для выполнения DELETE-запросов
  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.delete<T>(endpoint, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Обработка ошибок
  private handleError(error: any): Error {
    if (error.response) {
      // Сервер вернул ошибку
      const errorMessage = error.response.data.message || error.response.data.error || 'Ошибка сервера';
      console.error('Ошибка API:', errorMessage);
      return new Error(errorMessage);
    } else if (error.request) {
      // Запрос был сделан, но не получил ответа
      console.error('Нет ответа от сервера:', error.request);
      return new Error('Не удалось соединиться с сервером. Проверьте подключение к интернету.');
    } else {
      // Что-то другое вызвало ошибку
      console.error('Ошибка:', error.message);
      return new Error('Произошла ошибка при выполнении запроса: ' + error.message);
    }
  }
}

// Экспортируем экземпляр API сервиса
export const apiService = new ApiService(); 