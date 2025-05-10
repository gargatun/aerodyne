import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, TextInput, Button, Card, Snackbar, ProgressBar, Chip, HelperText, Menu, Divider } from 'react-native-paper';
import { launchImageLibrary } from 'react-native-image-picker';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { DeliveryStatus } from '../types';
import { deliveryService } from '../services/deliveryService';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { apiService } from '../services/api';
import { API_CONFIG } from '../config';

type DeliveryDetailsParams = {
  deliveryId: number;
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

const statusOptions = [
  { label: 'В ожидании', value: '1' },
  { label: 'Назначена', value: '2' },
  { label: 'В пути', value: '3' },
  { label: 'Доставлена', value: '4' },
  { label: 'Отменена', value: '5' },
];

const technicalConditionOptions = [
  { label: 'Исправно', value: 'Исправно' },
  { label: 'Неисправно', value: 'Неисправно' },
];

const DeliveryDetailsScreen = () => {
  const route = useRoute<DeliveryDetailsScreenRouteProp>();
  const navigation = useNavigation();
  const { isOffline } = useNetworkStatus();
  const { deliveryId } = route.params;

  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Состояния для редактируемых полей
  const [sourceAddress, setSourceAddress] = useState('');
  const [destAddress, setDestAddress] = useState('');
  const [sourceLat, setSourceLat] = useState('');
  const [sourceLon, setSourceLon] = useState('');
  const [destLat, setDestLat] = useState('');
  const [destLon, setDestLon] = useState('');
  const [status, setStatus] = useState('');
  const [technicalCondition, setTechnicalCondition] = useState('');
  
  // Состояние для выпадающих меню
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [technicalConditionMenuVisible, setTechnicalConditionMenuVisible] = useState(false);

  useEffect(() => {
    fetchDeliveryDetails();
  }, [deliveryId]);

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
          // Устанавливаем статус как ID, а не строковое значение
          setStatus(detailsResponse.data.status?.id?.toString() || '');
          setTechnicalCondition(detailsResponse.data.technical_condition || '');
          setSourceLat(detailsResponse.data.source_lat?.toString() || '');
          setSourceLon(detailsResponse.data.source_lon?.toString() || '');
          setDestLat(detailsResponse.data.dest_lat?.toString() || '');
          setDestLon(detailsResponse.data.dest_lon?.toString() || '');
        }
      }
    } catch (err) {
      setError('Ошибка загрузки данных доставки');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setError('');
    
    try {
      // Проверяем наличие данных о доставке
      if (!delivery) {
        setError('Данные о доставке не загружены');
        setSaving(false);
        return;
      }
      
      // Получаем дополнительные данные о доставке напрямую через API
      const detailsResponse = await apiService.get<DeliveryDetailsResponse>(`/deliveries/${deliveryId}/`);
      
      if (detailsResponse.error) {
        setError(`Ошибка получения деталей доставки: ${detailsResponse.error}`);
        setSaving(false);
        return;
      }
      
      // Проверяем наличие необходимых данных в полном ответе API
      if (!detailsResponse.data) {
        setError('Не удалось получить полные данные о доставке');
        setSaving(false);
        return;
      }
      
      const apiDelivery = detailsResponse.data;
      
      // Проверяем поле transport_model_id
      if (!apiDelivery.transport_model || !apiDelivery.transport_model.id) {
        setError('Отсутствуют данные о модели транспорта');
        setSaving(false);
        return;
      }
      
      // Получаем ID статуса
      const statusId = typeof status === 'string' ? parseInt(status) || apiDelivery.status?.id : status;
      
      // При обновлении отправляем только идентификаторы объектов, чтобы избежать ошибок уникальности
      const updateData = {
        id: deliveryId,
        transport_model_id: apiDelivery.transport_model.id,
        transport_number: apiDelivery.transport_number,
        start_time: apiDelivery.start_time,
        end_time: apiDelivery.end_time,
        distance: apiDelivery.distance,
        service_ids: apiDelivery.services ? apiDelivery.services.map((service: {id: number}) => service.id) : [],
        packaging_id: apiDelivery.packaging?.id,
        status_id: statusId,
        courier_id: apiDelivery.courier?.id || null,
        source_address: sourceAddress || '',
        destination_address: destAddress || '',
        source_lat: sourceLat ? parseFloat(sourceLat) : null,
        source_lon: sourceLon ? parseFloat(sourceLon) : null,
        dest_lat: destLat ? parseFloat(destLat) : null,
        dest_lon: destLon ? parseFloat(destLon) : null,
        technical_condition: technicalCondition || apiDelivery.technical_condition
      };
      
      console.log('Отправляемые данные доставки:', updateData);
      
      // Отправляем запрос на обновление
      const response = await apiService.put(`/deliveries/${deliveryId}/`, updateData);
      
      if (response.error) {
        // Если ошибка содержит детали о требуемых полях, выводим более подробную информацию
        if (response.error.includes('400') || response.error.includes('Bad Request')) {
          try {
            const errorData = JSON.parse(response.error.split('Body:')[1].trim());
            let errorMessage = 'Ошибка: ';
            
            // Проверяем все поля с ошибками
            Object.keys(errorData).forEach(key => {
              errorMessage += `${key}: ${errorData[key].join(', ')}; `;
            });
            
            setError(errorMessage);
          } catch (parseError) {
            setError(`Ошибка валидации: ${response.error}`);
          }
        } else {
          setError(response.error);
        }
        return;
      }
      
      setSuccessMessage('Доставка успешно обновлена');
      fetchDeliveryDetails(); // Перезагружаем данные
    } catch (err) {
      setError('Ошибка при сохранении изменений');
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
                  {statusOptions.find(option => option.value === status)?.label || 'Выберите статус'}
                </Chip>
              }
            >
              {statusOptions.map(option => (
                <Menu.Item
                  key={option.value}
                  onPress={() => {
                    setStatus(option.value);
                    setStatusMenuVisible(false);
                  }}
                  title={option.label}
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
});

export default DeliveryDetailsScreen; 