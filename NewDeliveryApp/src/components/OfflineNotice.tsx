import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const OfflineNotice: React.FC = () => {
  const [hasError, setHasError] = useState(false);
  const { isOffline } = useNetworkStatus();

  useEffect(() => {
    // Сбрасываем ошибку при изменении состояния сети
    setHasError(false);
  }, [isOffline]);

  if (hasError || !isOffline) {
    return null;
  }

  try {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          Нет подключения к интернету. Некоторые функции могут быть недоступны.
        </Text>
      </View>
    );
  } catch (error) {
    console.error('Error rendering OfflineNotice:', error);
    setHasError(true);
    return null;
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#b71c1c',
    padding: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  text: {
    color: '#fff',
    textAlign: 'center',
  },
});

export default OfflineNotice; 