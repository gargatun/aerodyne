import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Animated, TouchableOpacity } from 'react-native';
import { Title, Paragraph, Chip, Text, Snackbar, Badge, ProgressBar, useTheme, Divider, IconButton, Surface, MD3Theme } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Delivery, DeliveryStatus } from '../types';
import { ERROR_MESSAGES } from '../constants';
import { apiService } from '../services/api';
import { API_CONFIG } from '../config';
import { MaterialCard, Icon } from '../components';
import { useUser } from '../context/UserContext';

const Tab = ({ children, active, onPress }: { children: React.ReactNode, active: boolean, onPress: () => void }) => {
  const theme = useTheme();
  return (
    <TouchableOpacity 
      style={[
        styles.tab, 
        { 
          backgroundColor: active ? theme.colors.primaryContainer : 'transparent'
        }
      ]}
      onPress={onPress}
    >
      {children}
      {active && (
        <View 
          style={[
            styles.activeIndicator,
            { backgroundColor: theme.colors.primary }
          ]} 
        />
      )}
    </TouchableOpacity>
  );
};

const MyDeliveriesScreen = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([]);
  const [historyDeliveries, setHistoryDeliveries] = useState<Delivery[]>([]);
  const [loadingActive, setLoadingActive] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const translateX = React.useRef(new Animated.Value(0)).current;
  const navigation = useNavigation<any>();
  const { isOffline } = useNetworkStatus();
  const theme = useTheme();
  const { refreshUserData } = useUser();
  
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

  // Обновляем данные профиля при каждом переходе на этот экран
  useFocusEffect(
    useCallback(() => {
      refreshUserData();
    }, [refreshUserData])
  );

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
      onStatusChange: fetchActiveDeliveries
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

  const getStatusColor = (status: DeliveryStatus, theme: MD3Theme): { bg: string, text: string } => {
    switch (status) {
      case DeliveryStatus.PENDING:
        return { 
          bg: theme.colors.tertiaryContainer, 
          text: theme.colors.onTertiaryContainer 
        };
      case DeliveryStatus.DELIVERED:
        return { 
          bg: theme.colors.primaryContainer, 
          text: theme.colors.onPrimaryContainer 
        };
      default:
        return { 
          bg: theme.colors.secondaryContainer, 
          text: theme.colors.onSecondaryContainer 
        };
    }
  };

  const renderDeliveryItem = ({ item }: { item: Delivery }) => {
    const statusColors = getStatusColor(item.status, theme);
    
    return (
      <MaterialCard
        title={item.title}
        onPress={() => navigateToDeliveryDetails(item.id)}
        style={styles.card}
        icon="package-variant"
      >
        <Chip 
          style={{ 
            backgroundColor: statusColors.bg, 
            alignSelf: 'flex-start', 
            marginBottom: 12,
            borderRadius: 8
          }}
          textStyle={{ color: statusColors.text }}
        >
          {getStatusName(item.status)}
        </Chip>
        
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
        
        <Paragraph style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
          {item.description}
        </Paragraph>
        
        {activeTab === 0 && item.status !== DeliveryStatus.DELIVERED && (
          <TouchableOpacity 
            style={[
              styles.unassignButton, 
              { 
                backgroundColor: theme.colors.errorContainer,
                borderColor: theme.colors.error,
              }
            ]} 
            onPress={() => handleUnassignDelivery(item.id)}
            disabled={isOffline}
          >
            <Text style={[
              styles.unassignText, 
              { color: theme.colors.onErrorContainer },
              isOffline && { color: theme.colors.surfaceDisabled }
            ]}>
              Отказаться от доставки
            </Text>
          </TouchableOpacity>
        )}
      </MaterialCard>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={styles.tabContainer} elevation={1}>
        <Tab active={activeTab === 0} onPress={() => setActiveTab(0)}>
          <View style={styles.tabContent}>
            <Text 
              style={[
                styles.tabText, 
                { 
                  color: activeTab === 0 ? theme.colors.primary : theme.colors.onSurfaceVariant,
                  fontWeight: activeTab === 0 ? '600' : '400'
                }
              ]}
            >
              Активные
            </Text>
            {activeDeliveries.length > 0 && (
              <Badge 
                style={[styles.badge, { backgroundColor: theme.colors.error }]}
                size={18}
              >
                {activeDeliveries.length}
              </Badge>
            )}
          </View>
        </Tab>
        <Tab active={activeTab === 1} onPress={() => setActiveTab(1)}>
          <View style={styles.tabContent}>
            <Text 
              style={[
                styles.tabText, 
                { 
                  color: activeTab === 1 ? theme.colors.primary : theme.colors.onSurfaceVariant,
                  fontWeight: activeTab === 1 ? '600' : '400'
                }
              ]}
            >
              История
            </Text>
            {historyDeliveries.length > 0 && (
              <Badge 
                style={[styles.badge, { backgroundColor: theme.colors.primary }]}
                size={18}
              >
                {historyDeliveries.length}
              </Badge>
            )}
          </View>
        </Tab>
      </Surface>
      
      {(activeTab === 0 && loadingActive) || (activeTab === 1 && loadingHistory) ? (
        <View style={styles.loadingContainer}>
          <ProgressBar 
            indeterminate 
            style={styles.progressBar} 
            color={theme.colors.primary}
          />
          <Text style={{ color: theme.colors.onSurface }}>Загрузка данных...</Text>
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
            <MaterialCard 
              title={activeTab === 0 ? 'Нет активных доставок' : 'История доставок пуста'}
              style={styles.emptyCard}
              mode="elevated"
              elevation={2}
              icon={activeTab === 0 ? "package-variant-closed-remove" : "history"}
            >
              <Paragraph style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
                {activeTab === 0 
                  ? 'Посетите экран "Доставки", чтобы найти доступные заказы' 
                  : 'Завершите хотя бы одну доставку, чтобы увидеть её в истории'
                }
              </Paragraph>
            </MaterialCard>
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
        style={{ backgroundColor: theme.colors.errorContainer }}
        theme={{ colors: { surface: theme.colors.errorContainer, onSurface: theme.colors.onErrorContainer } }}
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
        style={{ backgroundColor: theme.colors.primaryContainer }}
        theme={{ colors: { surface: theme.colors.primaryContainer, onSurface: theme.colors.onPrimaryContainer } }}
      >
        {successMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    position: 'relative',
    zIndex: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  tabText: {
    fontSize: 16,
    marginRight: 4,
    textAlign: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 8,
  },
  activeIndicator: {
    position: 'absolute',
    height: 3,
    bottom: 0,
    left: 0,
    right: 0,
  },
  listContainer: {
    padding: 8,
  },
  card: {
    margin: 8,
    borderRadius: 16,
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
    marginTop: 8,
    fontStyle: 'italic',
  },
  badgeContainer: {
    marginLeft: 4,
    zIndex: 2,
    alignSelf: 'flex-start',
  },
  badge: {
    marginLeft: 4,
  },
  unassignButton: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 0,
  },
  unassignText: {
    fontWeight: '500',
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
    borderRadius: 16,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default MyDeliveriesScreen; 