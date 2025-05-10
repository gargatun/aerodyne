import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Snackbar, Text } from 'react-native-paper';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { authService } from '../services/authService';
import { ERROR_MESSAGES } from '../constants';

interface LoginScreenProps {
  navigation: any;
  setIsAuthenticated: (auth: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ setIsAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isOffline } = useNetworkStatus();

  useEffect(() => {
    // Проверяем сохраненный токен
    checkStoredToken();
  }, []);

  const checkStoredToken = async () => {
    try {
      console.log('Проверка сохраненного токена...');
      const isAuthenticated = await authService.isAuthenticated();
      console.log('Пользователь авторизован:', isAuthenticated);
      if (isAuthenticated) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Ошибка при проверке токена:', error);
    }
  };

  const handleLogin = async () => {
    if (isOffline) {
      setError(ERROR_MESSAGES.NETWORK_ERROR);
      return;
    }

    if (!username || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    setLoading(true);
    try {
      console.log('Попытка входа с логином:', username);
      const result = await authService.login({ username, password });
      
      console.log('Результат входа:', result);
      if (result.success) {
        console.log('Вход успешен, устанавливаем isAuthenticated в true');
        setIsAuthenticated(true);
      } else {
        setError(result.error || ERROR_MESSAGES.LOGIN_FAILED);
      }
    } catch (error) {
      console.error('Ошибка при входе:', error);
      setError(ERROR_MESSAGES.SERVER_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Вход в систему</Text>
      
      <TextInput
        label="Логин"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        mode="outlined"
        disabled={loading}
      />
      
      <TextInput
        label="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        mode="outlined"
        disabled={loading}
      />
      
      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        disabled={loading || isOffline}
        style={styles.button}
      >
        Войти
      </Button>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setError(''),
        }}
      >
        {error}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
  },
}); 