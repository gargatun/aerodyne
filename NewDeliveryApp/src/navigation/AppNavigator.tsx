import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { LoginScreen } from '../screens/LoginScreen';
import DeliveriesScreen from '../screens/DeliveriesScreen';
import MyDeliveriesScreen from '../screens/MyDeliveriesScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

interface AppNavigatorProps {
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({ 
  isAuthenticated, 
  setIsAuthenticated 
}) => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            let iconName: string;
            if (route.name === 'Deliveries') iconName = 'local-shipping';
            else if (route.name === 'MyDeliveries') iconName = 'assignment';
            else if (route.name === 'Map') iconName = 'map';
            else if (route.name === 'Profile') iconName = 'person';
            else iconName = 'login';
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarStyle: route.name === 'Login' ? { display: 'none' } : undefined,
        })}
      >
        {!isAuthenticated ? (
          <Tab.Screen
            name="Login"
            options={{ headerShown: false }}
          >
            {props => <LoginScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
          </Tab.Screen>
        ) : (
          <>
            <Tab.Screen name="Deliveries" component={DeliveriesScreen} options={{ title: 'Доставки' }} />
            <Tab.Screen name="MyDeliveries" component={MyDeliveriesScreen} options={{ title: 'Мои доставки' }} />
            <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Карта' }} />
            <Tab.Screen name="Profile">
              {props => <ProfileScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
            </Tab.Screen>
          </>
        )}
      </Tab.Navigator>
    </NavigationContainer>
  );
}; 