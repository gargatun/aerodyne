import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { apiService } from '../services/api';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true); // По умолчанию считаем, что соединение есть
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Функция для синхронизации данных при восстановлении соединения
    const syncDataIfConnected = async (state: NetInfoState) => {
      if (state.isConnected && state.isInternetReachable) {
        try {
          await apiService.syncOfflineData();
        } catch (error) {
          console.error('Error syncing offline data:', error);
        }
      }
    };

    try {
      // Подписываемся на изменения состояния сети
      const unsubscribe = NetInfo.addEventListener(state => {
        try {
          setIsConnected(state.isConnected);
          setIsInternetReachable(state.isInternetReachable);
          setConnectionType(state.type);

          // Если соединение восстановлено, синхронизируем данные
          if (state.isConnected && !isConnected) {
            syncDataIfConnected(state);
          }
        } catch (error) {
          console.error('Error in NetInfo event handler:', error);
          setHasError(true);
        }
      });

      // Получаем начальное состояние
      NetInfo.fetch().then(state => {
        try {
          setIsConnected(state.isConnected);
          setIsInternetReachable(state.isInternetReachable);
          setConnectionType(state.type);
        } catch (error) {
          console.error('Error fetching initial network state:', error);
          setHasError(true);
        }
      }).catch(error => {
        console.error('Error fetching initial network state:', error);
        setHasError(true);
      });

      // Отписываемся при размонтировании
      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up NetInfo listener:', error);
      setHasError(true);
    }
  }, [isConnected]);

  return {
    isConnected: hasError ? true : isConnected, // В случае ошибки считаем, что соединение есть
    isInternetReachable: hasError ? true : isInternetReachable,
    connectionType,
    isOffline: hasError ? false : (!isConnected || !isInternetReachable),
    hasError,
  };
}; 