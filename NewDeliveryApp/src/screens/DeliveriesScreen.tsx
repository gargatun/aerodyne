import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Title, Paragraph, Button, Snackbar, Chip, FAB, TextInput, Menu, Divider, List, useTheme, Card } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { deliveryService } from '../services/deliveryService';
import { Delivery, DeliveryStatus } from '../types';
import { ERROR_MESSAGES } from '../constants';
import { apiService } from '../services/api';
import Icon from '../components/Icon';
import { MaterialCard } from '../components';
import { useUser } from '../context/UserContext';

// Добавляем интерфейс для фильтров
interface DeliveryFilters {
  maxDistance?: string;
  sortBy?: string;
}

const DeliveriesScreen = () => {
  const navigation = useNavigation<any>();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { isOffline } = useNetworkStatus();
  const theme = useTheme();
  const { refreshUserData } = useUser();
  
  // Состояния для фильтрации
  const [maxDistance, setMaxDistance] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);

  const sortOptions = [
    { label: 'По расстоянию (возр.)', value: 'distance' },
    { label: 'По расстоянию (убыв.)', value: '-distance' },
    { label: 'По времени начала (возр.)', value: 'start_time' },
    { label: 'По времени начала (убыв.)', value: '-start_time' },
  ];

  const fetchDeliveries = async (filters: DeliveryFilters = {}) => {
    setLoading(true);
    setError('');

    try {
      let queryParams = new URLSearchParams();
      
      if (filters.maxDistance) {
        queryParams.append('max_distance', filters.maxDistance);
      }
      
      if (filters.sortBy) {
        queryParams.append('sort_by', filters.sortBy);
      }
      
      const queryString = queryParams.toString();
      const endpoint = `/deliveries/available/${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiService.get<any[]>(endpoint);
      
      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data) {
        // Преобразуем данные API в формат Delivery
        const mappedDeliveries = response.data.map(apiDelivery => {
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
        
        setDeliveries(mappedDeliveries);
      }

      if (response.offline) {
        setError(ERROR_MESSAGES.OFFLINE_MODE);
      }
    } catch (err) {
      setError('Ошибка загрузки доставок');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  // Обновляем данные профиля при каждом переходе на этот экран
  useFocusEffect(
    useCallback(() => {
      refreshUserData();
    }, [refreshUserData])
  );

  const handleAssignDelivery = async (id: number) => {
    try {
      const response = await apiService.patch(`/deliveries/${id}/assign/`, {});
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      // Обновляем список доставок после успешного назначения
      setSuccessMessage('Доставка успешно назначена');
      
      // Удаляем назначенную доставку из списка
      setDeliveries(deliveries.filter(delivery => delivery.id !== id));
    } catch (err) {
      setError('Ошибка при назначении доставки');
      console.error(err);
    }
  };

  const handleApplyFilters = () => {
    setFiltersApplied(!!maxDistance || !!sortBy);
    fetchDeliveries({
      maxDistance: maxDistance || undefined,
      sortBy: sortBy || undefined,
    });
    setFilterMenuVisible(false);
  };

  const handleResetFilters = () => {
    setMaxDistance('');
    setSortBy(null);
    setFiltersApplied(false);
    fetchDeliveries();
    setFilterMenuVisible(false);
  };

  const handleCreateDelivery = () => {
    navigation.navigate('CreateDelivery');
  };

  const navigateToDeliveryDetails = (deliveryId: number) => {
    navigation.navigate('DeliveryDetails', { 
      deliveryId,
      onStatusChange: () => {
        // Обновляем список доставок при изменении статуса
        fetchDeliveries({
          maxDistance: maxDistance || undefined, 
          sortBy: sortBy || undefined 
        });
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
        return theme.colors.tertiaryContainer;
      case DeliveryStatus.DELIVERED:
        return theme.colors.primaryContainer;
      default:
        return theme.colors.secondaryContainer;
    }
  };

  const renderDelivery = ({ item }: { item: Delivery }) => {
    const statusColor = getStatusColor(item.status);
    const textColor = statusColor === theme.colors.primaryContainer ? 
      theme.colors.onPrimaryContainer : 
      (statusColor === theme.colors.tertiaryContainer ? 
        theme.colors.onTertiaryContainer : 
        theme.colors.onSecondaryContainer);
        
    return (
      <MaterialCard 
        title={item.title}
        icon="package-variant"
        onPress={() => navigateToDeliveryDetails(item.id)}
        style={styles.card}
        footer={
          <Button 
            mode="contained" 
            onPress={() => handleAssignDelivery(item.id)} 
            disabled={loading || isOffline}
            icon={({size, color}) => (
              <Icon name="check" size={size} color={color} />
            )}
          >
            Принять
          </Button>
        }
      >
        <Paragraph style={styles.description}>{item.description}</Paragraph>
        
        <View style={styles.cardRow}>
          <Icon name="map-marker-outline" size={20} color={theme.colors.onSurfaceVariant} />
          <Paragraph style={styles.cardText}>От: {item.fromAddress}</Paragraph>
        </View>
        
        <View style={styles.cardRow}>
          <Icon name="map-marker" size={20} color={theme.colors.onSurfaceVariant} />
          <Paragraph style={styles.cardText}>До: {item.toAddress}</Paragraph>
        </View>
        
        <View style={styles.cardRow}>
          <Icon name="map-marker-distance" size={20} color={theme.colors.onSurfaceVariant} />
          <Paragraph style={styles.cardText}>Расстояние: {item.price / 100} км</Paragraph>
        </View>
        
        <Chip 
          style={{ 
            backgroundColor: statusColor, 
            alignSelf: 'flex-start', 
            marginTop: 12,
            borderRadius: 8 
          }}
          textStyle={{ color: textColor }}
        >
          {getStatusName(item.status)}
        </Chip>
      </MaterialCard>
    );
  };

  return (
    <View style={styles.container}>
      {/* Кнопка фильтров */}
      <View style={styles.filterContainer}>
        <Button 
          mode={filtersApplied ? "contained" : "outlined"}
          icon={({size, color}) => (
            <Icon name="filter" size={size} color={color} />
          )}
          onPress={() => setFilterMenuVisible(true)}
          style={styles.filterButton}
        >
          Фильтры {filtersApplied ? '(применены)' : ''}
        </Button>
      </View>
      
      {/* Меню фильтров */}
      <Menu
        visible={filterMenuVisible}
        onDismiss={() => setFilterMenuVisible(false)}
        anchor={{ x: 0, y: 0 }}
        style={styles.filterMenu}
      >
        <View style={styles.filterMenuContent}>
          <Title style={styles.filterTitle}>Фильтры</Title>
          
          <TextInput
            label="Максимальное расстояние (км)"
            value={maxDistance}
            onChangeText={setMaxDistance}
            keyboardType="numeric"
            mode="outlined"
            style={styles.filterInput}
          />
          
          <List.Subheader>Сортировка</List.Subheader>
          {sortOptions.map(option => (
            <List.Item
              key={option.value}
              title={option.label}
              onPress={() => setSortBy(option.value)}
              right={props => 
                sortBy === option.value ? (
                  <List.Icon {...props} icon={({size, color}) => (
                    <Icon name="check" size={size} color={color} />
                  )} />
                ) : null
              }
            />
          ))}
          
          <Divider style={styles.divider} />
          
          <View style={styles.filterActions}>
            <Button 
              mode="text" 
              onPress={handleResetFilters}
              style={styles.filterActionButton}
            >
              Сбросить
            </Button>
            <Button 
              mode="contained" 
              onPress={handleApplyFilters}
              style={styles.filterActionButton}
            >
              Применить
            </Button>
          </View>
        </View>
      </Menu>
      
      <FlatList
        data={deliveries}
        renderItem={renderDelivery}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={() => fetchDeliveries({ 
          maxDistance: maxDistance || undefined, 
          sortBy: sortBy || undefined 
        })}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <MaterialCard 
            title="Нет доступных доставок"
            style={styles.emptyCard}
            icon="package-variant-closed-remove"
            mode="elevated"
            elevation={2}
          >
            <Paragraph style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
              Попробуйте изменить параметры фильтра или обновить список
            </Paragraph>
          </MaterialCard>
        }
      />
      
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
      
      <FAB
        style={styles.fab}
        icon={({size, color}) => (
          <Icon name="plus" size={size} color={color} />
        )}
        onPress={handleCreateDelivery}
        disabled={isOffline}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 8,
    paddingBottom: 80, // Пространство для FAB
  },
  card: {
    margin: 8,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardText: {
    marginLeft: 8,
    flex: 1,
  },
  description: {
    marginBottom: 12,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  filterContainer: {
    padding: 8,
    backgroundColor: '#fff',
    elevation: 2,
    zIndex: 1,
  },
  filterButton: {
    alignSelf: 'flex-start',
  },
  filterMenu: {
    width: '80%',
    maxWidth: 300,
    marginTop: 45,
  },
  filterMenuContent: {
    padding: 16,
  },
  filterTitle: {
    marginBottom: 16,
  },
  filterInput: {
    marginBottom: 12,
  },
  divider: {
    marginVertical: 12,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  filterActionButton: {
    marginLeft: 8,
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

export default DeliveriesScreen;