import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button, Snackbar, Chip } from 'react-native-paper';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { deliveryService } from '../services/deliveryService';
import { Delivery, DeliveryStatus } from '../types';
import { ERROR_MESSAGES } from '../constants';

const DeliveriesScreen = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isOffline } = useNetworkStatus();

  const fetchDeliveries = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await deliveryService.getAvailableDeliveries();
      
      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.deliveries) {
        setDeliveries(response.deliveries);
      }

      if (response.offline) {
        setError(ERROR_MESSAGES.OFFLINE_MODE);
      }
    } catch (err) {
      setError('Ошибка загрузки доставок');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleAcceptDelivery = async (id: number) => {
    try {
      const response = await deliveryService.acceptDelivery(id);
      
      if (response.success) {
        // Обновляем список после принятия доставки
        fetchDeliveries();
      } else {
        setError(response.error || 'Ошибка при принятии доставки');
      }
    } catch (err) {
      setError('Ошибка при принятии доставки');
    }
  };

  const getStatusName = (status: DeliveryStatus): string => {
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

  const getStatusColor = (status: DeliveryStatus): string => {
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

  const renderDelivery = ({ item }: { item: Delivery }) => (
    <Card style={styles.card}>
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
        <Paragraph>Цена: {item.price} ₽</Paragraph>
      </Card.Content>
      <Card.Actions>
        <Button 
          mode="contained" 
          onPress={() => handleAcceptDelivery(item.id)} 
          disabled={loading || isOffline}
        >
          Принять
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={deliveries}
        renderItem={renderDelivery}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={fetchDeliveries}
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
});

export default DeliveriesScreen;
