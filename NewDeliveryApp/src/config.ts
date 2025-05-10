import { Platform } from 'react-native';

// Конфигурация API
export const API_CONFIG = {
  // Для разработки на эмуляторе Android используйте IP-адрес вашего компьютера
  // Для разработки на iOS используйте localhost
  baseURL: Platform.select({
    android: 'http://10.0.2.2:8000/api', // Специальный IP для Android эмулятора
    ios: 'http://127.0.0.1:8000/api',
    default: 'http://127.0.0.1:8000/api',
  }),
  // Эндпоинты API
  endpoints: {
    auth: {
      login: '/token/',
      refresh: '/token/refresh/',
      me: '/users/me/',
    },
    deliveries: {
      available: '/deliveries/available/',
      my: '/deliveries/my/active/',
      details: (id: number) => `/deliveries/${id}/`,
      accept: (id: number) => `/deliveries/${id}/accept/`,
      status: (id: number) => `/deliveries/${id}/status/`,
    }
  }
};

// Настройки приложения
export const APP_CONFIG = {
  // Версия приложения
  version: '0.1.0',
  
  // Настройки кэширования
  cache: {
    // Время жизни кэша в миллисекундах (24 часа)
    ttl: 24 * 60 * 60 * 1000,
  },
}; 