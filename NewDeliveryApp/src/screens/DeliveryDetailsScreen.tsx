import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, TextInput, Button, Card, Snackbar, ProgressBar, Chip, HelperText, Menu, Divider } from 'react-native-paper';
import { launchImageLibrary } from 'react-native-image-picker';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { DeliveryStatus } from '../types';
import { deliveryService } from '../services/deliveryService';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { apiService } from '../services/api';
import { API_CONFIG } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

type DeliveryDetailsParams = {
  deliveryId: number;
  onStatusChange?: () => void;
};

type DeliveryDetailsScreenRouteProp = RouteProp<{ DeliveryDetails: DeliveryDetailsParams }, 'DeliveryDetails'>;

// Добавляем интерфейс для ответа API с детальной информацией о доставке
interface DeliveryDetailsResponse {
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
  source_lat?: number;
  source_lon?: number;
  dest_lat?: number;
  dest_lon?: number;
}

// Добавляем интерфейсы для справочных данных
interface TransportModel {
  id: number;
  name: string;
}

interface PackagingType {
  id: number;
  name: string;
}

interface Service {
  id: number;
  name: string;
}

interface StatusOption {
  id: number;
  name: string;
  color: string;
}

const statusOptions = [
  { label: 'В ожидании', value: '1' },
  { label: 'Доставлена', value: '3' }
];

const technicalConditionOptions = [
  { label: 'Исправно', value: 'Исправно' },
  { label: 'Неисправно', value: 'Неисправно' },
];

const DeliveryDetailsScreen = () => {
  const route = useRoute<DeliveryDetailsScreenRouteProp>();
  const navigation = useNavigation();
  const { isOffline } = useNetworkStatus();
  const { deliveryId, onStatusChange } = route.params;

  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Состояния для справочных данных
  const [transportModels, setTransportModels] = useState<TransportModel[]>([]);
  const [packagingTypes, setPackagingTypes] = useState<PackagingType[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [statusesFromApi, setStatusesFromApi] = useState<StatusOption[]>([]);
  
  // Состояния для редактируемых полей
  const [selectedTransportModel, setSelectedTransportModel] = useState<TransportModel | null>(null);
  const [selectedPackaging, setSelectedPackaging] = useState<PackagingType | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [transportNumber, setTransportNumber] = useState('');
  const [distance, setDistance] = useState('');
  const [sourceAddress, setSourceAddress] = useState('');
  const [destAddress, setDestAddress] = useState('');
  const [sourceLat, setSourceLat] = useState('');
  const [sourceLon, setSourceLon] = useState('');
  const [destLat, setDestLat] = useState('');
  const [destLon, setDestLon] = useState('');
  const [status, setStatus] = useState('');
  const [technicalCondition, setTechnicalCondition] = useState('');
  
  // Состояния для выбора даты и времени
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  // Состояние для выпадающих меню
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [technicalConditionMenuVisible, setTechnicalConditionMenuVisible] = useState(false);
  const [transportMenuVisible, setTransportMenuVisible] = useState(false);
  const [packagingMenuVisible, setPackagingMenuVisible] = useState(false);
  const [serviceMenuVisible, setServiceMenuVisible] = useState(false);

  // Добавим переменную состояния для отладки
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    fetchDeliveryDetails();
    loadReferenceData();
  }, [deliveryId]);

  const loadReferenceData = async () => {
    try {
      // Загружаем все справочные данные параллельно
      const [
        transportModelsResponse,
        packagingTypesResponse,
        servicesResponse,
        statusesResponse
      ] = await Promise.all([
        apiService.get<TransportModel[]>('/transport-models/'),
        apiService.get<PackagingType[]>('/packaging-types/'),
        apiService.get<Service[]>('/services/'),
        apiService.get<StatusOption[]>('/statuses/'),
      ]);
      
      if (transportModelsResponse.data) {
        setTransportModels(transportModelsResponse.data);
      }
      
      if (packagingTypesResponse.data) {
        setPackagingTypes(packagingTypesResponse.data);
      }
      
      if (servicesResponse.data) {
        setServices(servicesResponse.data);
      }
      
      if (statusesResponse.data) {
        setStatusesFromApi(statusesResponse.data);
      }
    } catch (err) {
      setError('Ошибка загрузки справочных данных');
      console.error(err);
    }
  };

  const fetchDeliveryDetails = async () => {
    setLoading(true);
    try {
      const response = await deliveryService.getDeliveryById(deliveryId);
      
      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.delivery) {
        setDelivery(response.delivery);
        
        // Установка начальных значений для полей формы
        setSourceAddress(response.delivery.fromAddress || '');
        setDestAddress(response.delivery.toAddress || '');
        
        // Получаем дополнительные данные через API для полей, которых нет в текущем маппинге deliveryService
        const detailsResponse = await apiService.get<DeliveryDetailsResponse>(`/deliveries/${deliveryId}/`);
        if (detailsResponse.data) {
          const apiDelivery = detailsResponse.data;
          
          // Устанавливаем значения полей из ответа API
          setStatus(apiDelivery.status?.id?.toString() || '');
          setTechnicalCondition(apiDelivery.technical_condition || '');
          setSourceLat(apiDelivery.source_lat?.toString() || '');
          setSourceLon(apiDelivery.source_lon?.toString() || '');
          setDestLat(apiDelivery.dest_lat?.toString() || '');
          setDestLon(apiDelivery.dest_lon?.toString() || '');
          setTransportNumber(apiDelivery.transport_number || '');
          setDistance(apiDelivery.distance?.toString() || '');
          
          // Установка дат
          if (apiDelivery.start_time) {
            setStartDate(new Date(apiDelivery.start_time));
          }
          if (apiDelivery.end_time) {
            setEndDate(new Date(apiDelivery.end_time));
          }
          
          // Установка модели транспорта
          if (apiDelivery.transport_model) {
            setSelectedTransportModel(apiDelivery.transport_model);
          }
          
          // Установка упаковки
          if (apiDelivery.packaging) {
            setSelectedPackaging(apiDelivery.packaging);
          }
          
          // Установка услуг
          if (apiDelivery.services) {
            setSelectedServices(apiDelivery.services);
          }
        }
      }
    } catch (err) {
      setError('Ошибка загрузки данных доставки');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartDateConfirm = (selectedDate: Date) => {
    setShowStartDatePicker(false);
    setStartDate(selectedDate);
  };

  const handleEndDateConfirm = (selectedDate: Date) => {
    setShowEndDatePicker(false);
    setEndDate(selectedDate);
  };

  const toggleService = (service: Service) => {
    const isSelected = selectedServices.some(s => s.id === service.id);
    if (isSelected) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
    setServiceMenuVisible(false);
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setError('');
    setDebugInfo('');
    
    try {
      // Проверяем наличие данных о доставке
      if (!delivery) {
        setError('Данные о доставке не загружены');
        setSaving(false);
        return;
      }
      
      // Проверка обязательных полей
      if (!selectedTransportModel) {
        setError('Выберите модель транспорта');
        setSaving(false);
        return;
      }
      
      if (!selectedPackaging) {
        setError('Выберите тип упаковки');
        setSaving(false);
        return;
      }
      
      if (!transportNumber) {
        setError('Введите номер транспорта');
        setSaving(false);
        return;
      }
      
      if (!distance) {
        setError('Введите расстояние');
        setSaving(false);
        return;
      }
      
      // Получаем ID статуса
      const statusId = typeof status === 'string' ? parseInt(status) : status;

      // Получаем текущее состояние доставки для сравнения
      const detailsResponse = await apiService.get<DeliveryDetailsResponse>(`/deliveries/${deliveryId}/`);
      
      if (detailsResponse.error) {
        setError(`Ошибка получения деталей доставки: ${detailsResponse.error}`);
        setSaving(false);
        return;
      }
      
      if (!detailsResponse.data) {
        setError('Не удалось получить полные данные о доставке');
        setSaving(false);
        return;
      }
      
      const apiDelivery = detailsResponse.data;
      setDebugInfo(`Текущие данные доставки: ID=${apiDelivery.id}, статус=${apiDelivery.status.id}`);
      
      // Проверяем обязательно наличие всех объектов перед отправкой
      if (!selectedTransportModel || !selectedPackaging) {
        setError('Не все обязательные данные заполнены');
        setSaving(false);
        return;
      }
      
      // Собираем все данные в один объект для обновления с явным приведением типов
      const updateData: Record<string, any> = {
        id: Number(deliveryId),
        transport_model_id: Number(selectedTransportModel.id),
        transport_number: String(transportNumber),
        start_time: startDate.toISOString().split('.')[0] + 'Z',
        end_time: endDate.toISOString().split('.')[0] + 'Z',
        distance: Number(parseFloat(distance)),
        service_ids: selectedServices.map(service => Number(service.id)),
        packaging_id: Number(selectedPackaging.id),
        courier_id: apiDelivery.courier?.id ? Number(apiDelivery.courier.id) : null,
        source_address: String(sourceAddress || ''),
        destination_address: String(destAddress || ''),
        source_lat: sourceLat ? Number(parseFloat(sourceLat)) : null,
        source_lon: sourceLon ? Number(parseFloat(sourceLon)) : null,
        dest_lat: destLat ? Number(parseFloat(destLat)) : null,
        dest_lon: destLon ? Number(parseFloat(destLon)) : null,
        technical_condition: technicalCondition ? String(technicalCondition) : String(apiDelivery.technical_condition || 'Исправно')
      };
      
      // Подробное логирование всех отправляемых параметров
      setDebugInfo(prev => prev + `
\nОтправляемые параметры:
- Модель транспорта ID: ${updateData.transport_model_id}
- Тип упаковки ID: ${updateData.packaging_id}
- Услуги IDs: ${JSON.stringify(updateData.service_ids)}
- Техническое состояние: ${updateData.technical_condition}
- Номер транспорта: ${updateData.transport_number}
- Расстояние: ${updateData.distance}
- Адрес отправления: ${updateData.source_address}
- Адрес назначения: ${updateData.destination_address}
      `);
      
      // Отправляем запрос на обновление через PATCH
      console.log('Отправляемые данные доставки:', JSON.stringify(updateData));
      
      // Прямой вызов fetch для обновления
      setDebugInfo(prev => prev + '\nИспользуем прямой вызов fetch для PATCH запроса');
      
      try {
        const headers = new Headers({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN)}`
        });
        
        // Используем новый эндпоинт update-all для обновления всех полей одновременно
        setDebugInfo(prev => prev + '\nИспользуем специальный эндпоинт update-all для обновления всех параметров');
        
        const response = await fetch(`${API_CONFIG.baseURL}/deliveries/${deliveryId}/update-all/`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(updateData)
        });
        
        const responseText = await response.text();
        console.log('Ответ от сервера (текст):', responseText);
        
        if (!response.ok) {
          setError(`Ошибка обновления данных: ${response.status} ${responseText}`);
          setDebugInfo(prev => prev + `\nОшибка обновления: ${response.status} ${responseText}`);
          setSaving(false);
          return;
        }
        
        let responseData;
        try {
          responseData = JSON.parse(responseText);
          console.log('Распарсенные данные ответа:', responseData);
        } catch (e) {
          console.error('Ошибка парсинга JSON ответа:', e);
          responseData = { message: 'Данные обновлены, но не удалось распарсить ответ' };
        }
        
        setDebugInfo(prev => prev + `\nДанные успешно обновлены. Ответ: ${JSON.stringify(responseData).substring(0, 150)}...`);
      } catch (error) {
        console.error('Ошибка отправки PATCH запроса:', error);
        setError(`Ошибка отправки запроса: ${(error as Error).message}`);
        setDebugInfo(prev => prev + `\nОшибка отправки запроса: ${(error as Error).message}`);
        setSaving(false);
        return;
      }
      
      // Обновляем статус отдельным запросом, если он изменился
      const currentStatusId = apiDelivery.status.id;
      if (statusId && statusId !== currentStatusId) {
        setDebugInfo(prev => prev + `\nТекущий статус: ${currentStatusId}, новый статус: ${statusId}`);
        
        const statusUpdateData = { status_id: statusId };
        
        try {
          const headers = new Headers({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN)}`
          });
          
          setDebugInfo(prev => prev + `\nОтправка запроса на обновление статуса...`);
          
          const statusResponse = await fetch(`${API_CONFIG.baseURL}/deliveries/${deliveryId}/update-status/`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(statusUpdateData)
          });
          
          const statusResponseText = await statusResponse.text();
          console.log('Ответ на запрос обновления статуса (текст):', statusResponseText);
          
          if (!statusResponse.ok) {
            setError(`Данные обновлены, но не удалось обновить статус: ${statusResponse.status} ${statusResponseText}`);
            setDebugInfo(prev => prev + `\nОшибка обновления статуса: ${statusResponse.status} ${statusResponseText}`);
            setSaving(false);
            return;
          }
          
          let statusResponseData;
          try {
            statusResponseData = JSON.parse(statusResponseText);
            console.log('Распарсенные данные ответа статуса:', statusResponseData);
          } catch (e) {
            console.error('Ошибка парсинга JSON ответа статуса:', e);
            statusResponseData = { message: 'Статус обновлен, но не удалось распарсить ответ' };
          }
          
          setDebugInfo(prev => prev + `\nСтатус успешно обновлен на ${statusId}. Ответ: ${JSON.stringify(statusResponseData).substring(0, 100)}...`);
        } catch (error) {
          console.error('Ошибка отправки запроса обновления статуса:', error);
          setError(`Данные обновлены, но ошибка обновления статуса: ${(error as Error).message}`);
          setDebugInfo(prev => prev + `\nОшибка отправки запроса статуса: ${(error as Error).message}`);
          setSaving(false);
          return;
        }
      }
      
      setSuccessMessage('Доставка успешно обновлена');
      
      // Перезагружаем данные
      await fetchDeliveryDetails();
      
      // Вызываем колбэк для обновления списков
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (err) {
      setError(`Ошибка при сохранении изменений: ${(err as Error).message}`);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadMedia = async () => {
    try {
      // Вызываем библиотеку для выбора изображения
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        includeBase64: false,
        maxHeight: 1200,
        maxWidth: 1200,
      });
      
      if (!result.didCancel && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Убедимся, что URI существует
        if (!asset.uri) {
          throw new Error('Не удалось получить URI изображения');
        }
        
        // Создаем FormData для отправки файла
        const formData = new FormData();
        
        const fileUri = Platform.OS === 'ios' 
          ? asset.uri.replace('file://', '') 
          : asset.uri;
          
        const fileName = fileUri.split('/').pop() || 'file';
        const fileType = asset.type || 'image/jpeg';
        
        formData.append('media_file', {
          uri: fileUri,
          name: fileName,
          type: fileType,
        } as any);
        
        // Отправляем файл
        const response = await fetch(`${API_CONFIG.baseURL}/deliveries/${deliveryId}/media/`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Ошибка загрузки: ${response.status}`);
        }
        
        setSuccessMessage('Файл успешно загружен');
        fetchDeliveryDetails(); // Перезагружаем данные
      }
    } catch (err) {
      setError('Ошибка при загрузке файла');
      console.error(err);
    }
  };

  const handleMarkAsDelivered = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      setDebugInfo('Пытаемся пометить доставку как "Доставлено"...');
      
      // Используем новый метод для прямого обновления статуса
      const result = await deliveryService.directUpdateStatus(deliveryId, 3);
      
      if (result.success && result.data) {
        setSuccessMessage('Доставка успешно отмечена как "Доставлено"');
        setDebugInfo(prev => prev + `\nОбновление успешно. Новый статус: ${result.data?.status?.id || 'неизвестно'} (${result.data?.status?.name || 'неизвестно'})`);
        
        // Обновляем статус на экране
        setStatus('3');
        
        // Перезагружаем данные
        await fetchDeliveryDetails();
        
        // Вызываем колбэк для обновления списков
        if (onStatusChange) {
          onStatusChange();
        }
      } else {
        setError(result.error || 'Не удалось обновить статус');
        setDebugInfo(prev => prev + `\nОшибка обновления: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(`Ошибка: ${errorMessage}`);
      setDebugInfo(prev => prev + `\nИсключение: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Загрузка данных...</Text>
        <ProgressBar indeterminate style={styles.progressBar} />
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={styles.errorContainer}>
        <Text>Доставка не найдена</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Вернуться назад
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title={`Доставка #${deliveryId}`} />
        <Card.Content>
          <Text style={styles.sectionTitle}>Основная информация</Text>
          
          <View style={styles.formGroup}>
            <Text>Модель транспорта:</Text>
            <Menu
              visible={transportMenuVisible}
              onDismiss={() => setTransportMenuVisible(false)}
              anchor={
                <Chip 
                  onPress={() => setTransportMenuVisible(true)} 
                  style={styles.chip}
                >
                  {selectedTransportModel?.name || 'Выберите модель транспорта'}
                </Chip>
              }
            >
              {transportModels.map(model => (
                <Menu.Item
                  key={model.id}
                  onPress={() => {
                    setSelectedTransportModel(model);
                    setTransportMenuVisible(false);
                  }}
                  title={model.name}
                />
              ))}
            </Menu>
          </View>
          
          <TextInput
            label="Номер транспорта"
            value={transportNumber}
            onChangeText={setTransportNumber}
            mode="outlined"
            style={styles.input}
          />
          
          <View style={styles.formGroup}>
            <Text>Тип упаковки:</Text>
            <Menu
              visible={packagingMenuVisible}
              onDismiss={() => setPackagingMenuVisible(false)}
              anchor={
                <Chip 
                  onPress={() => setPackagingMenuVisible(true)} 
                  style={styles.chip}
                >
                  {selectedPackaging?.name || 'Выберите тип упаковки'}
                </Chip>
              }
            >
              {packagingTypes.map(packaging => (
                <Menu.Item
                  key={packaging.id}
                  onPress={() => {
                    setSelectedPackaging(packaging);
                    setPackagingMenuVisible(false);
                  }}
                  title={packaging.name}
                />
              ))}
            </Menu>
          </View>
          
          <View style={styles.formGroup}>
            <Text>Услуги:</Text>
            <Menu
              visible={serviceMenuVisible}
              onDismiss={() => setServiceMenuVisible(false)}
              anchor={
                <Chip 
                  onPress={() => setServiceMenuVisible(true)} 
                  style={styles.chip}
                >
                  {selectedServices.length > 0 
                    ? `Выбрано услуг: ${selectedServices.length}` 
                    : 'Выберите услуги'}
                </Chip>
              }
            >
              {services.map(service => {
                const isSelected = selectedServices.some(s => s.id === service.id);
                return (
                  <Menu.Item
                    key={service.id}
                    onPress={() => toggleService(service)}
                    title={`${service.name} ${isSelected ? '✓' : ''}`}
                  />
                );
              })}
            </Menu>
          </View>
          
          <TextInput
            label="Расстояние (км)"
            value={distance}
            onChangeText={setDistance}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
          />
          
          <View style={styles.formGroup}>
            <Text>Время начала:</Text>
            <Chip 
              onPress={() => setShowStartDatePicker(true)} 
              style={styles.chip}
            >
              {startDate.toLocaleString()}
            </Chip>
            <DateTimePickerModal
              isVisible={showStartDatePicker}
              mode="datetime"
              onConfirm={handleStartDateConfirm}
              onCancel={() => setShowStartDatePicker(false)}
              date={startDate}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text>Время окончания:</Text>
            <Chip 
              onPress={() => setShowEndDatePicker(true)} 
              style={styles.chip}
            >
              {endDate.toLocaleString()}
            </Chip>
            <DateTimePickerModal
              isVisible={showEndDatePicker}
              mode="datetime"
              onConfirm={handleEndDateConfirm}
              onCancel={() => setShowEndDatePicker(false)}
              date={endDate}
            />
          </View>
          
          <View style={styles.statusContainer}>
            <Text>Статус:</Text>
            <Menu
              visible={statusMenuVisible}
              onDismiss={() => setStatusMenuVisible(false)}
              anchor={
                <Chip 
                  onPress={() => setStatusMenuVisible(true)} 
                  style={styles.statusChip}
                >
                  {statusesFromApi.find(s => s.id === Number(status))?.name || 'Выберите статус'}
                </Chip>
              }
            >
              {statusesFromApi
                .filter(statusObj => statusObj.id === 1 || statusObj.id === 3)
                .map(statusObj => (
                  <Menu.Item
                    key={statusObj.id}
                    onPress={() => {
                      setStatus(statusObj.id.toString());
                      setStatusMenuVisible(false);
                    }}
                    title={statusObj.name}
                  />
                ))}
            </Menu>
          </View>
          
          <View style={styles.formGroup}>
            <Text>Техническое состояние:</Text>
            <Menu
              visible={technicalConditionMenuVisible}
              onDismiss={() => setTechnicalConditionMenuVisible(false)}
              anchor={
                <Chip 
                  onPress={() => setTechnicalConditionMenuVisible(true)} 
                  style={styles.statusChip}
                >
                  {technicalCondition || 'Выберите состояние'}
                </Chip>
              }
            >
              {technicalConditionOptions.map(option => (
                <Menu.Item
                  key={option.value}
                  onPress={() => {
                    setTechnicalCondition(option.value);
                    setTechnicalConditionMenuVisible(false);
                  }}
                  title={option.label}
                />
              ))}
            </Menu>
          </View>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Адреса</Text>
          
          <TextInput
            label="Адрес отправления"
            value={sourceAddress}
            onChangeText={setSourceAddress}
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Адрес назначения"
            value={destAddress}
            onChangeText={setDestAddress}
            mode="outlined"
            style={styles.input}
          />
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Координаты</Text>
          
          <View style={styles.coordinatesContainer}>
            <TextInput
              label="Широта отправления"
              value={sourceLat}
              onChangeText={setSourceLat}
              mode="outlined"
              style={styles.coordinateInput}
              keyboardType="numeric"
            />
            <TextInput
              label="Долгота отправления"
              value={sourceLon}
              onChangeText={setSourceLon}
              mode="outlined"
              style={styles.coordinateInput}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.coordinatesContainer}>
            <TextInput
              label="Широта назначения"
              value={destLat}
              onChangeText={setDestLat}
              mode="outlined"
              style={styles.coordinateInput}
              keyboardType="numeric"
            />
            <TextInput
              label="Долгота назначения"
              value={destLon}
              onChangeText={setDestLon}
              mode="outlined"
              style={styles.coordinateInput}
              keyboardType="numeric"
            />
          </View>
          
          <HelperText type="info">
            Координаты используются для отображения на карте и расчета маршрута
          </HelperText>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Медиафайлы</Text>
          
          {delivery.media_file && (
            <Text style={styles.mediaInfo}>
              Загружен файл: {delivery.media_file.split('/').pop()}
            </Text>
          )}
          
          <Button 
            mode="outlined" 
            icon="upload" 
            onPress={handleUploadMedia}
            style={styles.uploadButton}
            disabled={isOffline}
          >
            Загрузить медиафайл
          </Button>
          
          <Divider style={styles.divider} />
          
          <Button 
            mode="contained" 
            onPress={handleSaveChanges}
            loading={saving}
            disabled={saving || isOffline}
            style={styles.saveButton}
          >
            Сохранить изменения
          </Button>
          
          <Button 
            mode="contained" 
            onPress={handleMarkAsDelivered}
            loading={loading}
            disabled={loading || isOffline}
            style={[styles.saveButton, { marginTop: 10, backgroundColor: '#388E3C' }]}
          >
            Пометить как доставлено
          </Button>
          
          {isOffline && (
            <HelperText type="error">
              Вы находитесь в офлайн-режиме. Изменения будут сохранены при подключении к интернету.
            </HelperText>
          )}
        </Card.Content>
      </Card>
      
      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        action={{
          label: 'ОК',
          onPress: () => setError(''),
        }}
      >
        {error}
      </Snackbar>
      
      <Snackbar
        visible={!!successMessage}
        onDismiss={() => setSuccessMessage('')}
        action={{
          label: 'ОК',
          onPress: () => setSuccessMessage(''),
        }}
      >
        {successMessage}
      </Snackbar>

      {/* Добавляем отладочную информацию */}
      {debugInfo && (
        <Card style={{ marginTop: 16, backgroundColor: '#f5f5f5' }}>
          <Card.Content>
            <Text style={{ fontFamily: 'monospace' }}>{debugInfo}</Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  progressBar: {
    width: '80%',
    marginTop: 20,
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  input: {
    marginBottom: 12,
  },
  divider: {
    marginVertical: 16,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coordinateInput: {
    flex: 1,
    marginRight: 8,
    marginBottom: 12,
  },
  uploadButton: {
    marginTop: 8,
  },
  saveButton: {
    marginTop: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  statusChip: {
    marginLeft: 8,
  },
  formGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  mediaInfo: {
    marginBottom: 8,
    fontStyle: 'italic',
  },
  chip: {
    marginLeft: 8,
  },
});

export default DeliveryDetailsScreen; 