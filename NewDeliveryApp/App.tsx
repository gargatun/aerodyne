/**
 * Delivery App
 * Material Design 3 Implementation
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, StyleSheet, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';

import AppNavigator from './src/navigation/AppNavigator';
import OfflineNotice from './src/components/OfflineNotice';
import { UserProvider } from './src/context/UserContext';
import theme from './src/theme';

// Импортируем i18n
import './src/i18n';

// Игнорируем некоторые предупреждения
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'EventEmitter.removeListener',
  'DatePickerIOS has been merged',
]);

// Настройка темы навигации для отключения эффекта нажатия
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.background,
    primary: theme.colors.primary,
    // Добавляем прозрачные цвета для кнопок навигации
    notification: 'transparent', // Используется для индикатора уведомлений
    card: theme.colors.background, // Фон карточек навигации
    border: 'transparent', // Граница элементов навигации
  },
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('userToken');
      setIsAuthenticated(!!token);
    };
    checkAuth();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider 
          theme={theme}
          settings={{
            rippleEffectEnabled: false, // Отключаем эффект волны в Paper
          }}
        >
          <NavigationContainer 
            theme={navigationTheme}
          >
            <UserProvider>
              <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <OfflineNotice />
                <AppNavigator 
                  isAuthenticated={isAuthenticated} 
                  setIsAuthenticated={setIsAuthenticated} 
                />
              </View>
            </UserProvider>
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App; 