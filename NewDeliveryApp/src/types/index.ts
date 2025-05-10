// Типы пользователя
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
}

// Типы доставки
export interface Delivery {
  id: number;
  title: string;
  description: string;
  fromAddress: string;
  toAddress: string;
  status: DeliveryStatus;
  createdAt: string;
  updatedAt: string;
  client: number;
  courier?: number;
  price: number;
  weight?: number;
  dimensions?: string;
  estimatedDeliveryTime?: string;
  coordinates?: {
    fromLat: number;
    fromLng: number;
    toLat: number;
    toLng: number;
  };
}

// Статусы доставки
export enum DeliveryStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

// Типы для авторизации
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user?: User;
}

// Типы для офлайн режима
export interface PendingRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  timestamp: string;
}

// Типы для уведомлений
export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: NotificationType;
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
} 