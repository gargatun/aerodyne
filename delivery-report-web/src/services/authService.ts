import { apiService } from './api';
import { AuthResponse, LoginCredentials, User } from '../types';

export const login = async (credentials: LoginCredentials): Promise<User> => {
  try {
    // Отправляем запрос на авторизацию
    const response = await apiService.post<AuthResponse>('/token/', credentials);
    
    // Сохраняем токен и данные пользователя
    localStorage.setItem('token', response.access);
    localStorage.setItem('refresh', response.refresh);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    return response.user;
  } catch (error) {
    console.error('Ошибка при авторизации:', error);
    throw error;
  }
};

export const logout = (): void => {
  // Удаляем все данные сессии
  localStorage.removeItem('token');
  localStorage.removeItem('refresh');
  localStorage.removeItem('user');
  
  // Перенаправляем на страницу входа
  window.location.href = '/login';
};

export const getCurrentUser = (): User | null => {
  // Получаем данные текущего пользователя из localStorage
  const userStr = localStorage.getItem('user');
  
  if (userStr) {
    try {
      return JSON.parse(userStr) as User;
    } catch (error) {
      console.error('Ошибка при разборе данных пользователя:', error);
      logout(); // Если ошибка, выходим из системы
      return null;
    }
  }
  
  return null;
};

export const isAuthenticated = (): boolean => {
  // Проверяем наличие токена и пользователя
  return Boolean(localStorage.getItem('token') && getCurrentUser());
}; 