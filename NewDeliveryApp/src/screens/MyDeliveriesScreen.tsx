import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Animated, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Chip, Text, Snackbar, Badge, ProgressBar, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Delivery, DeliveryStatus } from '../types';
import { ERROR_MESSAGES } from '../constants';
import { apiService } from '../services/api';
import { API_CONFIG } from '../config';

const Tab = React.forwardRef(({ children, active, onPress }: { children: React.ReactNode, active: boolean, onPress: () => void }, ref) => {
  const theme = useTheme();
  return (
    <TouchableOpacity 
      style={[styles.tab, active && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
      onPress={onPress}
      ref={ref as any}
    >
      <Text style={[styles.tabText, active && { color: theme.colors.primary }]}>{children}</Text>
    </TouchableOpacity>
  );
});

const MyDeliveriesScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState(0);
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([]);
  const [historyDeliveries, setHistoryDeliveries] = useState<Delivery[]>([]);
  const [loadingActive, setLoadingActive] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { isOffline } = useNetworkStatus();
  
  // Для анимации вкладок
  const [translateX] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchActiveDeliveries();
    fetchHistoryDeliveries();
  }, []);
  
  useEffect(() => {
    Animated.timing(translateX, {
      toValue: activeTab * 50,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const fetchActiveDeliveries = async () => {
    setLoadingActive(true);
    setError('');
    
    try {
      const response = await apiService.get<any[]>(API_CONFIG.endpoints.deliveries.my.active);
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      if (response.data) {
        // Преобразуем данные API в формат Delivery
        const mappedDeliveries = mapApiDataToDeliveries(response.data);
        setActiveDeliveries(mappedDeliveries);
      }
      
      if (response.offline) {
        setError(ERROR_MESSAGES.OFFLINE_MODE);
      }
    } catch (err) {
      setError('Ошибка загрузки активных доставок');
      console.error(err);
    } finally {
      setLoadingActive(false);
    }
  };
  
  const fetchHistoryDeliveries = async () => {
    setLoadingHistory(true);
    setError('');
    
    try {
      const response = await apiService.get<any[]>(API_CONFIG.endpoints.deliveries.my.history);
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      if (response.data) {
        // Преобразуем данные API в формат Delivery
        const mappedDeliveries = mapApiDataToDeliveries(response.data);
        setHistoryDeliveries(mappedDeliveries);
      }
      
      if (response.offline) {
        setError(ERROR_MESSAGES.OFFLINE_MODE);
      }
    } catch (err) {
      setError('Ошибка загрузки истории доставок');
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };
  
  const mapApiDataToDeliveries = (apiData: any[]): Delivery[] => {
    return apiData.map(apiDelivery => {
      // Маппинг статуса API в DeliveryStatus на основе ID статуса
      let status: DeliveryStatus;
      const statusId = apiDelivery.status.id;
      
      if (statusId === 3) {
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
        client: 0,
        courier: apiDelivery.courier?.id,
        price: apiDelivery.distance * 100,
        weight: 0,
        estimatedDeliveryTime: apiDelivery.end_time,
      };
    });
  };

  const handleUnassignDelivery = async (id: number) => {
    try {
      const response = await apiService.patch(`/deliveries/${id}/unassign/`, {});
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      setSuccessMessage('Доставка успешно снята');
      
      // Обновляем список активных доставок
      setActiveDeliveries(activeDeliveries.filter(delivery => delivery.id !== id));
    } catch (err) {
      setError('Ошибка при снятии доставки');
      console.error(err);
    }
  };

  const navigateToDeliveryDetails = (deliveryId: number) => {
    navigation.navigate('DeliveryDetails', { 
      deliveryId,
      onStatusChange: () => {
        // Обновляем оба списка при изменении статуса
        fetchActiveDeliveries();
        fetchHistoryDeliveries();
      }
    });
  };

  const getStatusName = (status: DeliveryStatus): string => {
    switch (status) {
      case DeliveryStatus.PENDING:
        return 'Ожидает';
      case DeliveryStatus.DELIVERED:
        return 'Доставлена';
      default:
        return 'Ожидает';
    }
  };

  const getStatusColor = (status: DeliveryStatus): string => {
    switch (status) {
      case DeliveryStatus.PENDING:
        return '#FFA000';
      case DeliveryStatus.DELIVERED:
        return '#388E3C';
      default:
        return '#FFA000';
    }
  };

  const renderDeliveryItem = ({ item }: { item: Delivery }) => (
    <Card 
      style={styles.card} 
      onPress={() => navigateToDeliveryDetails(item.id)}
    >
      <Card.Content>
        <Title>{item.title}</Title>
        <Paragraph>{item.description}</Paragraph>
        <Paragraph>От: {item.fromAddress}</Paragraph>
        <Paragraph>До: {item.toAddress}</Paragraph>
        <Chip 
          style={{ backgroundColor: getStatusColor(item.status), alignSelf: 'flex-start', marginVertical: 8 }}
          textStyle={{ color: 'white' }}
        >
          {getStatusName(item.status)}
        </Chip>
        <Paragraph>Расстояние: {item.price / 100} км</Paragraph>
        
        {activeTab === 0 && item.status !== DeliveryStatus.DELIVERED && (
          <TouchableOpacity 
            style={styles.unassignButton} 
            onPress={() => handleUnassignDelivery(item.id)}
            disabled={isOffline}
          >
            <Text style={[styles.unassignText, isOffline && styles.disabledText]}>
              Отказаться от доставки
            </Text>
          </TouchableOpacity>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <Tab active={activeTab === 0} onPress={() => setActiveTab(0)}>
          Активные
          {activeDeliveries.length > 0 && <Badge style={styles.badge}>{activeDeliveries.length}</Badge>}
        </Tab>
        <Tab active={activeTab === 1} onPress={() => setActiveTab(1)}>
          История
          {historyDeliveries.length > 0 && <Badge style={styles.badge}>{historyDeliveries.length}</Badge>}
        </Tab>
        <Animated.View 
          style={[
            styles.indicator, 
            { 
              transform: [{ translateX }],
              width: `${100 / 2}%` 
            }
          ]} 
        />
      </View>
      
      {(activeTab === 0 && loadingActive) || (activeTab === 1 && loadingHistory) ? (
        <View style={styles.loadingContainer}>
          <ProgressBar indeterminate style={styles.progressBar} />
          <Text>Загрузка данных...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 0 ? activeDeliveries : historyDeliveries}
          renderItem={renderDeliveryItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={(activeTab === 0 && loadingActive) || (activeTab === 1 && loadingHistory)}
          onRefresh={() => activeTab === 0 ? fetchActiveDeliveries() : fetchHistoryDeliveries()}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Title style={styles.emptyTitle}>
                  {activeTab === 0 ? 'Нет активных доставок' : 'История доставок пуста'}
                </Title>
                <Paragraph>
                  {activeTab === 0 
                    ? 'Посетите экран "Доставки", чтобы найти доступные заказы' 
                    : 'Завершите хотя бы одну доставку, чтобы увидеть её в истории'
                  }
                </Paragraph>
              </Card.Content>
            </Card>
          }
        />
      )}
      
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 4,
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  indicator: {
    position: 'absolute',
    height: 2,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
  listContainer: {
    padding: 8,
  },
  card: {
    margin: 8,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: -20,
  },
  unassignButton: {
    marginTop: 8,
    padding: 8,
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  unassignText: {
    color: '#f44336',
  },
  disabledText: {
    color: '#9e9e9e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  progressBar: {
    width: '80%',
    marginBottom: 20,
  },
  emptyCard: {
    margin: 16,
    padding: 16,
    alignItems: 'center',
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default MyDeliveriesScreen; 