import { API_CONFIG } from '../config';

// API URLs
export const API_URL = API_CONFIG.baseURL;

// Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  USER_DATA: 'userData',
  OFFLINE_DELIVERIES: 'offlineDeliveries',
};

// Navigation Names
export const SCREENS = {
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  DELIVERIES: 'Deliveries',
  MY_DELIVERIES: 'MyDeliveries',
  MAP: 'Map',
  PROFILE: 'Profile',
  DELIVERY_DETAILS: 'DeliveryDetails',
};

// Tab Icons
export const TAB_ICONS = {
  DELIVERIES: 'local-shipping',
  MY_DELIVERIES: 'assignment',
  MAP: 'map',
  PROFILE: 'person',
  LOGIN: 'login',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету.',
  LOGIN_FAILED: 'Не удалось войти. Проверьте логин и пароль.',
  SERVER_ERROR: 'Ошибка сервера. Попробуйте позже.',
  OFFLINE_MODE: 'Вы работаете в автономном режиме.',
}; 