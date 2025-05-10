import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, Snackbar, ProgressBar, Chip, Menu, Divider, HelperText } from 'react-native-paper';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useNavigation } from '@react-navigation/native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { apiService } from '../services/api';
import { API_CONFIG } from '../config';

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

interface Status {
  id: number;
  name: string;
  color: string;
}

const technicalConditionOptions = [
  { label: 'Исправно', value: 'Исправно' },
  { label: 'Неисправно', value: 'Неисправно' },
];

const CreateDeliveryScreen = () => {
  const navigation = useNavigation();
  const { isOffline } = useNetworkStatus();

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Состояния для справочников
  const [transportModels, setTransportModels] = useState<TransportModel[]>([]);
  const [packagingTypes, setPackagingTypes] = useState<PackagingType[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  
  // Состояния для выпадающих меню
  const [transportMenuVisible, setTransportMenuVisible] = useState(false);
  const [packagingMenuVisible, setPackagingMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [serviceMenuVisible, setServiceMenuVisible] = useState(false);
  const [technicalConditionMenuVisible, setTechnicalConditionMenuVisible] = useState(false);
  
  // Состояния для значений формы
  const [selectedTransportModel, setSelectedTransportModel] = useState<TransportModel | null>(null);
  const [selectedPackaging, setSelectedPackaging] = useState<PackagingType | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [transportNumber, setTransportNumber] = useState('');
  const [sourceAddress, setSourceAddress] = useState('');
  const [destAddress, setDestAddress] = useState('');
  const [sourceLat, setSourceLat] = useState('');
  const [sourceLon, setSourceLon] = useState('');
  const [destLat, setDestLat] = useState('');
  const [destLon, setDestLon] = useState('');
  const [distance, setDistance] = useState('');
  const [technicalCondition, setTechnicalCondition] = useState('');
  
  // Состояния для выбора даты и времени
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // По умолчанию +1 день
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    setLoading(true);
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
        apiService.get<Status[]>('/statuses/'),
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
        setStatuses(statusesResponse.data);
        // По умолчанию выбираем статус "В ожидании"
        const pendingStatus = statusesResponse.data.find(s => s.name === 'В ожидании');
        if (pendingStatus) {
          setSelectedStatus(pendingStatus);
        }
      }
    } catch (err) {
      setError('Ошибка загрузки справочных данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDelivery = async () => {
    // Проверка обязательных полей
    if (!selectedTransportModel) {
      setError('Выберите модель транспорта');
      return;
    }
    
    if (!selectedPackaging) {
      setError('Выберите тип упаковки');
      return;
    }
    
    if (!selectedStatus) {
      setError('Выберите статус');
      return;
    }
    
    if (!transportNumber) {
      setError('Введите номер транспорта');
      return;
    }
    
    if (!distance) {
      setError('Введите расстояние');
      return;
    }
    
    if (!technicalCondition) {
      setError('Выберите техническое состояние');
      return;
    }
    
    setCreating(true);
    setError('');
    
    try {
      // Подготовка данных для создания доставки - используем только идентификаторы
      const deliveryData = {
        transport_model_id: selectedTransportModel.id,
        packaging_id: selectedPackaging.id,
        status_id: selectedStatus.id,
        service_ids: selectedServices.map(service => service.id),
        transport_number: transportNumber,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        distance: parseFloat(distance),
        source_address: sourceAddress || '',
        destination_address: destAddress || '',
        source_lat: sourceLat ? parseFloat(sourceLat) : null,
        source_lon: sourceLon ? parseFloat(sourceLon) : null,
        dest_lat: destLat ? parseFloat(destLat) : null,
        dest_lon: destLon ? parseFloat(destLon) : null,
        technical_condition: technicalCondition,
        courier_id: null // Null для создания доставки без назначенного курьера
      };
      
      console.log('Отправляемые данные доставки:', deliveryData);
      
      // Отправка запроса на создание доставки
      const response = await apiService.post('/deliveries/', deliveryData);
      
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
      
      setSuccessMessage('Доставка успешно создана');
      
      // Очищаем форму
      setTransportNumber('');
      setSourceAddress('');
      setDestAddress('');
      setSourceLat('');
      setSourceLon('');
      setDestLat('');
      setDestLon('');
      setDistance('');
      setTechnicalCondition('');
      setSelectedServices([]);
      
      // Переходим на экран списка доставок через 2 секунды
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (err) {
      setError('Ошибка при создании доставки');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  // Обработчики для выбора даты
  const handleStartDateConfirm = (selectedDate: Date) => {
    setShowStartDatePicker(false);
    setStartDate(selectedDate);
  };

  const handleEndDateConfirm = (selectedDate: Date) => {
    setShowEndDatePicker(false);
    setEndDate(selectedDate);
  };

  // Функция для добавления/удаления услуги из списка выбранных
  const toggleService = (service: Service) => {
    const isSelected = selectedServices.some(s => s.id === service.id);
    
    if (isSelected) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
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

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Создание новой доставки" />
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
              {packagingTypes.map(type => (
                <Menu.Item
                  key={type.id}
                  onPress={() => {
                    setSelectedPackaging(type);
                    setPackagingMenuVisible(false);
                  }}
                  title={type.name}
                />
              ))}
            </Menu>
          </View>
          
          <View style={styles.formGroup}>
            <Text>Статус:</Text>
            <Menu
              visible={statusMenuVisible}
              onDismiss={() => setStatusMenuVisible(false)}
              anchor={
                <Chip 
                  onPress={() => setStatusMenuVisible(true)} 
                  style={styles.chip}
                >
                  {selectedStatus?.name || 'Выберите статус'}
                </Chip>
              }
            >
              {statuses.map(status => (
                <Menu.Item
                  key={status.id}
                  onPress={() => {
                    setSelectedStatus(status);
                    setStatusMenuVisible(false);
                  }}
                  title={status.name}
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
                  style={styles.chip}
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
          
          <Text style={styles.sectionTitle}>Услуги</Text>
          
          <View style={styles.servicesContainer}>
            {services.map(service => (
              <Chip
                key={service.id}
                selected={selectedServices.some(s => s.id === service.id)}
                onPress={() => toggleService(service)}
                style={styles.serviceChip}
                mode="outlined"
              >
                {service.name}
              </Chip>
            ))}
          </View>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Время и расстояние</Text>
          
          <View style={styles.formGroup}>
            <Text>Время начала:</Text>
            <Button 
              mode="outlined" 
              onPress={() => setShowStartDatePicker(true)} 
              style={styles.dateButton}
            >
              {startDate.toLocaleString()}
            </Button>
          </View>
          
          <DateTimePickerModal
            isVisible={showStartDatePicker}
            mode="datetime"
            onConfirm={handleStartDateConfirm}
            onCancel={() => setShowStartDatePicker(false)}
            date={startDate}
          />
          
          <View style={styles.formGroup}>
            <Text>Время окончания:</Text>
            <Button 
              mode="outlined" 
              onPress={() => setShowEndDatePicker(true)} 
              style={styles.dateButton}
            >
              {endDate.toLocaleString()}
            </Button>
          </View>
          
          <DateTimePickerModal
            isVisible={showEndDatePicker}
            mode="datetime"
            onConfirm={handleEndDateConfirm}
            onCancel={() => setShowEndDatePicker(false)}
            date={endDate}
          />
          
          <TextInput
            label="Расстояние (км)"
            value={distance}
            onChangeText={setDistance}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Адреса и координаты</Text>
          
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
          
          <Button 
            mode="contained" 
            onPress={handleCreateDelivery}
            loading={creating}
            disabled={creating || isOffline}
            style={styles.createButton}
          >
            Создать доставку
          </Button>
          
          {isOffline && (
            <HelperText type="error">
              Вы находитесь в офлайн-режиме. Создание доставки будет выполнено при подключении к интернету.
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
  formGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  chip: {
    marginLeft: 8,
  },
  serviceChip: {
    margin: 4,
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
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  createButton: {
    marginTop: 16,
  },
  dateButton: {
    marginLeft: 8,
    flex: 1,
  },
});

export default CreateDeliveryScreen; 