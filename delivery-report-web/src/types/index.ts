export interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface TransportModel {
  id: number;
  name: string;
}

export interface PackagingType {
  id: number;
  name: string;
}

export interface Service {
  id: number;
  name: string;
}

export interface Status {
  id: number;
  name: string;
  color: string;
}

export interface Delivery {
  id: number;
  transport_model: TransportModel;
  transport_number: string;
  start_time: string;
  end_time: string;
  distance: number;
  media_file: string | null;
  services: Service[];
  packaging: PackagingType;
  status: Status;
  technical_condition: string;
  courier: User | null;
  source_address: string;
  destination_address: string;
  source_lat: number | null;
  source_lon: number | null;
  dest_lat: number | null;
  dest_lon: number | null;
}

export interface DeliveryFilters {
  startDate?: string | null;
  endDate?: string | null;
  service?: number | null;
  transportModel?: number | null;
  packaging?: number | null;
}

export interface AuthResponse {
  access: string;  // JWT access token
  refresh: string; // JWT refresh token
  user: User;      // Информация о пользователе
}

export interface LoginCredentials {
  username: string;
  password: string;
} 