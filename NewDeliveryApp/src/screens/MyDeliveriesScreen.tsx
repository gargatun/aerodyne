import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { Card, Title, Paragraph, Button, Snackbar, Chip, ActivityIndicator } from 'react-native-paper';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { deliveryService } from '../services/deliveryService';
import { Delivery, DeliveryStatus } from '../types';
import { ERROR_MESSAGES } from '../constants';

const MyDeliveriesScreen = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { isOffline } = useNetworkStatus();

  const fetchDeliveries = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('Загрузка моих доставок...');
      const response = await deliveryService.getMyDeliveries();
      
      console.log('Ответ от API:', response);
      
      if (response.error) {
        console.error('Ошибка при загрузке доставок:', response.error);
        setError(response.error);
        return;
      }

      if (response.deliveries) {
        console.log(`Получено ${response.deliveries.length} доставок`);
        setDeliveries(response.deliveries);
      } else {
        console.log('Список доставок пуст или не определен');
        setDeliveries([]);
      }

      if (response.offline) {
        setError(ERROR_MESSAGES.OFFLINE_MODE);
      }
    } catch (err) {
      console.error('Исключение при загрузке доставок:', err);
      setError('Ошибка загрузки доставок');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleUpdateStatus = async (id: number, status: DeliveryStatus) => {
    try {
      const response = await deliveryService.updateDeliveryStatus(id, status);
      
      if (response.success) {
        // Обновляем список после изменения статуса
        fetchDeliveries();
      } else {
        setError(response.error || 'Ошибка при обновлении статуса');
      }
    } catch (err) {
      setError('Ошибка при обновлении статуса');
    }
  };

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case DeliveryStatus.PENDING:
        return '#FFA000';
      case DeliveryStatus.ASSIGNED:
        return '#2196F3';
      case DeliveryStatus.IN_PROGRESS:
        return '#7B1FA2';
      case DeliveryStatus.DELIVERED:
        return '#388E3C';
      case DeliveryStatus.CANCELLED:
        return '#D32F2F';
      default:
        return '#757575';
    }
  };

  const getStatusName = (status: DeliveryStatus) => {
    switch (status) {
      case DeliveryStatus.PENDING:
        return 'Ожидает';
      case DeliveryStatus.ASSIGNED:
        return 'Назначена';
      case DeliveryStatus.IN_PROGRESS:
        return 'В пути';
      case DeliveryStatus.DELIVERED:
        return 'Доставлена';
      case DeliveryStatus.CANCELLED:
        return 'Отменена';
      default:
        return 'Неизвестно';
    }
  };

  const renderDelivery = ({ item }: { item: Delivery }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{item.title}</Title>
        <Paragraph>{item.description}</Paragraph>
        <View style={styles.addressContainer}>
          <Paragraph>От: {item.fromAddress}</Paragraph>
          <Paragraph>До: {item.toAddress}</Paragraph>
        </View>
        <Chip 
          style={{ backgroundColor: getStatusColor(item.status), alignSelf: 'flex-start', marginVertical: 8 }}
          textStyle={{ color: 'white' }}
        >
          {getStatusName(item.status)}
        </Chip>
        <Paragraph>Цена: {item.price} ₽</Paragraph>
      </Card.Content>
      <Card.Actions style={styles.actions}>
        {item.status === DeliveryStatus.ASSIGNED && (
          <Button 
            mode="contained" 
            onPress={() => handleUpdateStatus(item.id, DeliveryStatus.IN_PROGRESS)} 
            disabled={loading || isOffline}
            style={styles.button}
          >
            Начать доставку
          </Button>
        )}
        {item.status === DeliveryStatus.IN_PROGRESS && (
          <Button 
            mode="contained" 
            onPress={() => handleUpdateStatus(item.id, DeliveryStatus.DELIVERED)} 
            disabled={loading || isOffline}
            style={styles.button}
          >
            Завершить
          </Button>
        )}
      </Card.Actions>
    </Card>
  );

  const renderEmptyList = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.emptyText}>Загрузка доставок...</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>У вас пока нет доставок</Text>
        <Button 
          mode="contained" 
          onPress={fetchDeliveries}
          style={styles.refreshButton}
        >
          Обновить
        </Button>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={deliveries}
        renderItem={renderDelivery}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={fetchDeliveries}
        ListEmptyComponent={renderEmptyList}
      />
      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={3000}
      >
        {error}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 8,
  },
  card: {
    margin: 8,
    elevation: 2,
  },
  addressContainer: {
    marginVertical: 8,
  },
  actions: {
    justifyContent: 'flex-end',
  },
  button: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#757575',
    marginVertical: 20,
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: 20,
  }
});

export default MyDeliveriesScreen; 