import { apiService } from './api';
import { 
  Delivery, 
  DeliveryFilters,
  TransportModel,
  PackagingType,
  Service,
  Status
} from '../types';

// Получение всех доставок
export const fetchDeliveries = async (filters?: DeliveryFilters): Promise<Delivery[]> => {
  try {
    console.log('DeliveryService: Начало загрузки доставок с фильтрами:', JSON.stringify(filters));
    
    // Формируем параметры запроса
    let params = new URLSearchParams();
    let filterCount = 0;
    
    if (filters) {
      // Проверяем и добавляем только непустые параметры
      if (filters.startDate && filters.startDate !== 'null') {
        try {
          // Конвертируем ISO дату в формат YYYY-MM-DD для API
          const startDate = new Date(filters.startDate);
          const formattedDate = startDate.toISOString().split('T')[0];
          params.append('start_date', formattedDate);
          console.log('DeliveryService: Фильтр по начальной дате:', formattedDate);
          filterCount++;
        } catch (err) {
          console.error('DeliveryService: Ошибка при обработке startDate:', filters.startDate, err);
        }
      }
      
      if (filters.endDate && filters.endDate !== 'null') {
        try {
          // Конвертируем ISO дату в формат YYYY-MM-DD для API
          const endDate = new Date(filters.endDate);
          const formattedDate = endDate.toISOString().split('T')[0];
          params.append('end_date', formattedDate);
          console.log('DeliveryService: Фильтр по конечной дате:', formattedDate);
          filterCount++;
        } catch (err) {
          console.error('DeliveryService: Ошибка при обработке endDate:', filters.endDate, err);
        }
      }
      
      if (filters.service && !isNaN(Number(filters.service))) {
        const serviceId = filters.service.toString();
        params.append('service', serviceId);
        console.log('DeliveryService: Фильтр по услуге:', serviceId);
        filterCount++;
      }
      
      if (filters.transportModel && !isNaN(Number(filters.transportModel))) {
        const modelId = filters.transportModel.toString();
        params.append('transport_model', modelId);
        console.log('DeliveryService: Фильтр по модели транспорта:', modelId);
        filterCount++;
      }
      
      if (filters.packaging && !isNaN(Number(filters.packaging))) {
        const packagingId = filters.packaging.toString();
        params.append('packaging', packagingId);
        console.log('DeliveryService: Фильтр по упаковке:', packagingId);
        filterCount++;
      }
    }
    
    // Создаем URL с параметрами
    const queryString = params.toString();
    const hasFilters = queryString.length > 0;
    const url = `/deliveries/${hasFilters ? `?${queryString}` : ''}`;
    console.log(`DeliveryService: Запрос к API с ${filterCount} фильтрами:`, url);
    
    // Выполняем запрос
    const data = await apiService.get<Delivery[]>(url);
    console.log(`DeliveryService: Получено ${data.length} доставок после применения ${filterCount} фильтров`);
    
    // Выводим пример первых трех доставок для отладки
    if (data.length > 0) {
      console.log('DeliveryService: Примеры полученных доставок:');
      data.slice(0, 3).forEach((delivery, index) => {
        console.log(`Доставка ${index + 1}:`, {
          id: delivery.id,
          transport_model: delivery.transport_model?.name,
          start_time: delivery.start_time,
          service: delivery.services?.map(s => s.name).join(', '),
          packaging: delivery.packaging?.name
        });
      });
      
      // Проверяем наличие данных start_time для отладки
      const withStartTime = data.filter(d => d.start_time).length;
      console.log(`DeliveryService: Доставок с start_time: ${withStartTime}/${data.length}`);
      
      if (data.length > 0 && withStartTime < data.length) {
        console.warn('DeliveryService: Внимание! Есть доставки без start_time, которые не будут отображены на графике');
      }
      
      // Дополнительная проверка соответствия фильтрам после получения данных
      if (filters && Object.keys(filters).length > 0) {
        console.log('DeliveryService: Проверка соответствия полученных данных фильтрам');
        
        // Проверка фильтра по модели транспорта
        if (filters.transportModel) {
          const modelId = Number(filters.transportModel);
          const matchingDeliveries = data.filter(d => d.transport_model?.id === modelId);
          console.log(`DeliveryService: Доставок с выбранной моделью транспорта (ID=${modelId}): ${matchingDeliveries.length}/${data.length}`);
          
          if (matchingDeliveries.length !== data.length) {
            console.warn('DeliveryService: Внимание! Сервер вернул доставки, не соответствующие фильтру по модели транспорта');
          }
        }
        
        // Проверка фильтра по услуге
        if (filters.service) {
          const serviceId = Number(filters.service);
          const matchingDeliveries = data.filter(d => d.services && d.services.some(s => s.id === serviceId));
          console.log(`DeliveryService: Доставок с выбранной услугой (ID=${serviceId}): ${matchingDeliveries.length}/${data.length}`);
          
          if (matchingDeliveries.length !== data.length) {
            console.warn('DeliveryService: Внимание! Сервер вернул доставки, не соответствующие фильтру по услуге');
          }
        }
        
        // Проверка фильтра по упаковке
        if (filters.packaging) {
          const packagingId = Number(filters.packaging);
          const matchingDeliveries = data.filter(d => d.packaging?.id === packagingId);
          console.log(`DeliveryService: Доставок с выбранной упаковкой (ID=${packagingId}): ${matchingDeliveries.length}/${data.length}`);
          
          if (matchingDeliveries.length !== data.length) {
            console.warn('DeliveryService: Внимание! Сервер вернул доставки, не соответствующие фильтру по упаковке');
          }
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error('DeliveryService: Ошибка при получении доставок:', error);
    throw error;
  }
};

// Получение одной доставки
export const fetchDelivery = async (id: number): Promise<Delivery> => {
  try {
    return await apiService.get<Delivery>(`/deliveries/${id}/`);
  } catch (error) {
    console.error(`Ошибка при получении доставки #${id}:`, error);
    throw error;
  }
};

// Получение всех моделей транспорта
export const fetchTransportModels = async (): Promise<TransportModel[]> => {
  try {
    const data = await apiService.get<TransportModel[]>('/transport-models/');
    console.log(`DeliveryService: Получено ${data.length} моделей транспорта`);
    return data;
  } catch (error) {
    console.error('Ошибка при получении моделей транспорта:', error);
    throw error;
  }
};

// Получение всех типов упаковки
export const fetchPackagingTypes = async (): Promise<PackagingType[]> => {
  try {
    const data = await apiService.get<PackagingType[]>('/packaging-types/');
    console.log(`DeliveryService: Получено ${data.length} типов упаковки`);
    return data;
  } catch (error) {
    console.error('Ошибка при получении типов упаковки:', error);
    throw error;
  }
};

// Получение всех услуг
export const fetchServices = async (): Promise<Service[]> => {
  try {
    const data = await apiService.get<Service[]>('/services/');
    console.log(`DeliveryService: Получено ${data.length} услуг`);
    return data;
  } catch (error) {
    console.error('Ошибка при получении услуг:', error);
    throw error;
  }
};

// Получение всех статусов
export const fetchStatuses = async (): Promise<Status[]> => {
  try {
    const data = await apiService.get<Status[]>('/statuses/');
    console.log(`DeliveryService: Получено ${data.length} статусов`);
    return data;
  } catch (error) {
    console.error('Ошибка при получении статусов:', error);
    throw error;
  }
};