import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { TextInput, Button, Text, Snackbar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/authService';
import { STORAGE_KEYS } from '../constants';
import { apiService } from '../services/api';
import i18n from '../i18n';
import { LoginCredentials } from '../types';

interface LoginScreenProps {
  setIsAuthenticated: (value: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ setIsAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!username || !password) {
      setError(i18n.t('errors.fill_required_fields'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const credentials: LoginCredentials = { username, password };
      const result = await authService.login(credentials);
      
      if (result.error) {
        setError(result.error || i18n.t('auth.login_error'));
        return;
      }
      
      if (result.success) {
        // Токен и пользовательские данные уже сохранены в authService.login
        
        // Обновим token для будущих запросов
        apiService.refreshToken();
        
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error(err);
      setError(i18n.t('errors.unknown_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Логотип закомментирован для избежания ошибок загрузки файла */}
        {/* <Image 
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        /> */}
        <Text style={styles.title}>{i18n.t('auth.welcome')}</Text>
      </View>
      
      <View style={styles.formContainer}>
        <TextInput
          label={i18n.t('auth.username')}
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          autoCapitalize="none"
          placeholder={i18n.t('auth.enter_username')}
          left={<TextInput.Icon icon="account" />}
        />
        
        <TextInput
          label={i18n.t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholder={i18n.t('auth.enter_password')}
          left={<TextInput.Icon icon="lock" />}
        />
        
        <Button 
          mode="contained" 
          onPress={handleLogin} 
          style={styles.button}
          loading={loading}
          disabled={loading}
        >
          {i18n.t('auth.login')}
        </Button>
        
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Забыли пароль?</Text>
        </TouchableOpacity>
      </View>
      
      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        action={{
          label: i18n.t('common.ok'),
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
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  formContainer: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 10,
  },
  forgotPasswordText: {
    color: 'blue',
  },
}); 