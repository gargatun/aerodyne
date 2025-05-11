import { apiService } from './api';
import { Delivery, DeliveryStatus } from '../types';
import { API_CONFIG } from '../config';

// Интерфейс для данных доставки, возвращаемых API
interface ApiDelivery {
  id: number;
  transport_model: { id: number; name: string };
  transport_number: string;
  start_time: string;
  end_time: string;
  distance: number;
  media_file: string | null;
  services: Array<{ id: number; name: string }>;
  packaging: { id: number; name: string };
  status: { id: number; name: string; color: string };
  technical_condition: string;
  courier: { id: number; username: string; first_name: string; last_name: string } | null;
  source_address: string;
  destination_address: string;
}

class DeliveryService {
  // Преобразует данные API в формат Delivery
  private mapApiDeliveryToDelivery(apiDelivery: ApiDelivery): Delivery {
    // Маппинг статуса API в DeliveryStatus
    let status: DeliveryStatus;
    if (apiDelivery.status.id === 3) {
      status = DeliveryStatus.DELIVERED;
    } else {
      status = DeliveryStatus.PENDING;
    }

    return {
      id: apiDelivery.id,
      title: `Доставка ${apiDelivery.transport_number}`,
      description: `${apiDelivery.transport_model.name}, ${apiDelivery.packaging.name}`,
      fromAddress: apiDelivery.source_address || 'Не указан',
      toAddress: apiDelivery.destination_address || 'Не указан',
      status: status,
      createdAt: apiDelivery.start_time,
      updatedAt: apiDelivery.end_time,
      client: 0, // Нет данных в API
      courier: apiDelivery.courier?.id,
      price: apiDelivery.distance * 100, // Примерный расчет цены
      weight: 0, // Нет данных в API
      estimatedDeliveryTime: apiDelivery.end_time,
    };
  }

  async getAvailableDeliveries(): Promise<{ deliveries?: Delivery[]; error?: string; offline?: boolean }> {
    try {
      const response = await apiService.get<ApiDelivery[]>(API_CONFIG.endpoints.deliveries.available);
      
      return {
        deliveries: response.data?.map(item => this.mapApiDeliveryToDelivery(item)),
        error: response.error,
        offline: response.offline
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async getMyDeliveries(): Promise<{ deliveries?: Delivery[]; error?: string; offline?: boolean }> {
    try {
      const response = await apiService.get<ApiDelivery[]>(API_CONFIG.endpoints.deliveries.my.active);
      
      return {
        deliveries: response.data?.map(item => this.mapApiDeliveryToDelivery(item)),
        error: response.error,
        offline: response.offline
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async getDeliveryById(id: number): Promise<{ delivery?: Delivery; error?: string; offline?: boolean }> {
    try {
      const response = await apiService.get<ApiDelivery>(API_CONFIG.endpoints.deliveries.details(id));
      
      return {
        delivery: response.data ? this.mapApiDeliveryToDelivery(response.data) : undefined,
        error: response.error,
        offline: response.offline
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async acceptDelivery(id: number): Promise<{ success: boolean; error?: string; offline?: boolean }> {
    try {
      const response = await apiService.put<ApiDelivery>(API_CONFIG.endpoints.deliveries.assign(id), {});
      
      return {
        success: !response.error,
        error: response.error,
        offline: response.offline
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async updateDeliveryStatus(id: number, status: DeliveryStatus): Promise<{ success: boolean; error?: string; offline?: boolean }> {
    try {
      // Преобразуем DeliveryStatus в status_id для API в соответствии с базой данных
      let statusId: number;
      if (status === DeliveryStatus.DELIVERED) {
        statusId = 3; // ID для статуса "Доставлена"
      } else {
        statusId = 1; // ID для статуса "В ожидании"
      }
      
      // Используем новый эндпоинт для обновления статуса
      const response = await apiService.patch<ApiDelivery>(`/deliveries/${id}/update-status/`, { status_id: statusId });
      
      return {
        success: !response.error,
        error: response.error,
        offline: response.offline
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Добавляем новый метод для прямого обновления статуса
  async directUpdateStatus(id: number, statusId: number): Promise<{ success: boolean; error?: string; data?: ApiDelivery; offline?: boolean }> {
    try {
      console.log(`Прямое обновление статуса доставки ${id} на статус ${statusId}`);
      
      // Используем специальный эндпоинт для обновления статуса
      const response = await apiService.patch<ApiDelivery>(`/deliveries/${id}/update-status/`, { status_id: statusId });
      
      if (response.data) {
        console.log(`Статус после обновления: ${response.data.status.id} (${response.data.status.name})`);
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: !response.error,
        error: response.error,
        offline: response.offline
      };
    } catch (error) {
      console.error('Ошибка прямого обновления статуса:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

export const deliveryService = new DeliveryService(); 