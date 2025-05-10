import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Avatar, Card, ActivityIndicator } from 'react-native-paper';
import { authService } from '../services/authService';
import { User } from '../types';

interface ProfileScreenProps {
  setIsAuthenticated: (auth: boolean) => void;
}

const ProfileScreen = ({ setIsAuthenticated }: ProfileScreenProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        console.log('Загрузка данных пользователя...');
        const userData = await authService.getCurrentUser();
        console.log('Полученные данные пользователя:', userData);
        setUser(userData);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Функция для получения инициалов пользователя
  const getUserInitials = (): string => {
    if (!user) return '??';
    
    const firstInitial = user.firstName && typeof user.firstName === 'string' 
      ? user.firstName.charAt(0) 
      : '?';
      
    const lastInitial = user.lastName && typeof user.lastName === 'string'
      ? user.lastName.charAt(0)
      : '?';
      
    return `${firstInitial}${lastInitial}`;
  };

  // Функция для получения имени пользователя
  const getUserName = (): string => {
    if (!user) return 'Пользователь';
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
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
    <View style={styles.container}>
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
          
          {user && (
            <View style={styles.infoContainer}>
              {user.email && (
                <Text style={styles.infoText}>Email: {user.email}</Text>
              )}
              {user.phone && (
                <Text style={styles.infoText}>Телефон: {user.phone}</Text>
              )}
            </View>
          )}
          
          <Button 
            mode="contained" 
            onPress={handleLogout} 
            style={styles.button}
          >
            Выйти из аккаунта
          </Button>
        </Card.Content>
      </Card>
    </View>
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
  infoText: {
    fontSize: 16,
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
    width: '100%',
  },
});

export default ProfileScreen; 