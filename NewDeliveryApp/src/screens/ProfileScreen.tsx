import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, Avatar, Card, ActivityIndicator, TextInput, Divider, Snackbar } from 'react-native-paper';
import { authService } from '../services/authService';
import { User } from '../types';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { apiService } from '../services/api';
import { API_CONFIG } from '../config';

interface UserProfile {
  user: User;
  phone: string;
  email: string;
}

interface UserStats {
  total_deliveries: number;
  successful_deliveries: number;
  total_delivery_time_seconds: number;
  total_delivery_time_hours: number;
}

interface ProfileScreenProps {
  setIsAuthenticated: (auth: boolean) => void;
}

const ProfileScreen = ({ setIsAuthenticated }: ProfileScreenProps) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { isOffline } = useNetworkStatus();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      console.log('Загрузка данных пользователя...');
      setLoading(true);
      
      const response = await apiService.get<UserProfile & UserStats>(API_CONFIG.endpoints.profile.get);
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      if (response.data) {
        const { user, phone, email, ...stats } = response.data;
        setUserProfile({ user, phone, email });
        setUserStats(stats as unknown as UserStats);
        
        // Инициализируем поля формы текущими значениями
        setPhone(phone || '');
        setEmail(email || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Ошибка загрузки данных пользователя');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
      setError('Ошибка при выходе из аккаунта');
    }
  };

  const handleEditProfile = () => {
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      const updateData = {
        phone,
        email
      };
      
      const response = await apiService.put<UserProfile>(API_CONFIG.endpoints.profile.update, updateData);
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      if (response.data) {
        setUserProfile(response.data);
        setSuccessMessage('Профиль успешно обновлен');
      }
      
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Ошибка при обновлении профиля');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Восстанавливаем исходные значения
    if (userProfile) {
      setPhone(userProfile.phone || '');
      setEmail(userProfile.email || '');
    }
    setEditing(false);
  };

  // Функция для получения инициалов пользователя
  const getUserInitials = (): string => {
    if (!userProfile || !userProfile.user) return '??';
    
    const firstInitial = userProfile.user.firstName && typeof userProfile.user.firstName === 'string' 
      ? userProfile.user.firstName.charAt(0) 
      : '?';
      
    const lastInitial = userProfile.user.lastName && typeof userProfile.user.lastName === 'string'
      ? userProfile.user.lastName.charAt(0)
      : '?';
      
    return `${firstInitial}${lastInitial}`;
  };

  // Функция для получения имени пользователя
  const getUserName = (): string => {
    if (!userProfile || !userProfile.user) return 'Пользователь';
    
    const firstName = userProfile.user.firstName || '';
    const lastName = userProfile.user.lastName || '';
    
    if (!firstName && !lastName) return 'Пользователь';
    return `${firstName} ${lastName}`.trim();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Avatar.Text 
            size={80} 
            label={getUserInitials()} 
            style={styles.avatar}
          />
          
          <Text style={styles.title}>
            {getUserName()}
          </Text>
          
          {!editing ? (
            <View style={styles.infoContainer}>
              {userProfile && (
                <>
                  <Text style={styles.infoText}>Логин: {userProfile.user.username}</Text>
                  {userProfile.email && (
                    <Text style={styles.infoText}>Email: {userProfile.email}</Text>
                  )}
                  {userProfile.phone && (
                    <Text style={styles.infoText}>Телефон: {userProfile.phone}</Text>
                  )}
                </>
              )}
              
              <Button 
                mode="outlined" 
                onPress={handleEditProfile}
                style={styles.editButton}
                disabled={isOffline}
              >
                Редактировать профиль
              </Button>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <TextInput
                label="Телефон"
                value={phone}
                onChangeText={setPhone}
                mode="outlined"
                style={styles.input}
              />
              
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
              />
              
              <View style={styles.buttonContainer}>
                <Button 
                  mode="outlined" 
                  onPress={handleCancelEdit}
                  style={[styles.button, styles.cancelButton]}
                >
                  Отмена
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleSaveProfile}
                  style={styles.button}
                  loading={saving}
                  disabled={saving || isOffline}
                >
                  Сохранить
                </Button>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
      
      {userStats && (
        <Card style={styles.card}>
          <Card.Title title="Статистика" />
          <Card.Content>
            <View style={styles.statsItem}>
              <Text style={styles.statsLabel}>Всего доставок:</Text>
              <Text style={styles.statsValue}>{userStats.total_deliveries}</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.statsItem}>
              <Text style={styles.statsLabel}>Успешных доставок:</Text>
              <Text style={styles.statsValue}>{userStats.successful_deliveries}</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.statsItem}>
              <Text style={styles.statsLabel}>Общее время доставок:</Text>
              <Text style={styles.statsValue}>{userStats.total_delivery_time_hours.toFixed(1)} ч</Text>
            </View>
            
            {userStats.total_deliveries > 0 && (
              <>
                <Divider style={styles.divider} />
                
                <View style={styles.statsItem}>
                  <Text style={styles.statsLabel}>Успешность:</Text>
                  <Text style={styles.statsValue}>
                    {(userStats.successful_deliveries / userStats.total_deliveries * 100).toFixed(0)}%
                  </Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>
      )}
      
      <Button 
        mode="contained" 
        onPress={handleLogout} 
        style={styles.logoutButton}
      >
        Выйти из аккаунта
      </Button>
      
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    elevation: 4,
    marginBottom: 16,
  },
  cardContent: {
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    marginBottom: 16,
    backgroundColor: '#2196F3',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoContainer: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  formContainer: {
    alignSelf: 'stretch',
    width: '100%',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  cancelButton: {
    borderColor: '#757575',
  },
  editButton: {
    marginTop: 16,
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: '#f44336',
  },
  divider: {
    marginVertical: 12,
  },
  statsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statsLabel: {
    fontSize: 16,
    color: '#616161',
  },
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProfileScreen; 