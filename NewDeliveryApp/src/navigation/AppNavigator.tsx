import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { LoginScreen } from '../screens/LoginScreen';
import DeliveriesScreen from '../screens/DeliveriesScreen';
import MyDeliveriesScreen from '../screens/MyDeliveriesScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DeliveryDetailsScreen from '../screens/DeliveryDetailsScreen';
import CreateDeliveryScreen from '../screens/CreateDeliveryScreen';
import { SCREENS } from '../constants';

const Tab = createBottomTabNavigator();
const DeliveriesStack = createStackNavigator();
const MyDeliveriesStack = createStackNavigator();

// Стек навигации для экрана "Доставки"
const DeliveriesStackNavigator = () => {
  return (
    <DeliveriesStack.Navigator>
      <DeliveriesStack.Screen 
        name={SCREENS.DELIVERIES_LIST} 
        component={DeliveriesScreen} 
        options={{ title: 'Доступные доставки', headerShown: false }}
      />
      <DeliveriesStack.Screen 
        name={SCREENS.DELIVERY_DETAILS} 
        component={DeliveryDetailsScreen} 
        options={{ title: 'Детали доставки' }}
      />
      <DeliveriesStack.Screen 
        name={SCREENS.CREATE_DELIVERY} 
        component={CreateDeliveryScreen} 
        options={{ title: 'Создание доставки' }}
      />
    </DeliveriesStack.Navigator>
  );
};

// Стек навигации для экрана "Мои доставки"
const MyDeliveriesStackNavigator = () => {
  return (
    <MyDeliveriesStack.Navigator>
      <MyDeliveriesStack.Screen 
        name={SCREENS.MY_DELIVERIES_LIST} 
        component={MyDeliveriesScreen} 
        options={{ title: 'Мои доставки', headerShown: false }}
      />
      <MyDeliveriesStack.Screen 
        name={SCREENS.DELIVERY_DETAILS} 
        component={DeliveryDetailsScreen} 
        options={{ title: 'Детали доставки' }}
      />
    </MyDeliveriesStack.Navigator>
  );
};

interface AppNavigatorProps {
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
}

const AppNavigator: React.FC<AppNavigatorProps> = ({ 
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
            if (route.name === SCREENS.DELIVERIES) iconName = 'local-shipping';
            else if (route.name === SCREENS.MY_DELIVERIES) iconName = 'assignment';
            else if (route.name === SCREENS.MAP) iconName = 'map';
            else if (route.name === SCREENS.PROFILE) iconName = 'person';
            else iconName = 'login';
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarStyle: route.name === SCREENS.LOGIN ? { display: 'none' } : undefined,
        })}
      >
        {!isAuthenticated ? (
          <Tab.Screen
            name={SCREENS.LOGIN}
            options={{ headerShown: false }}
          >
            {props => <LoginScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
          </Tab.Screen>
        ) : (
          <>
            <Tab.Screen 
              name={SCREENS.DELIVERIES} 
              component={DeliveriesStackNavigator} 
              options={{ title: 'Доставки' }} 
            />
            <Tab.Screen 
              name={SCREENS.MY_DELIVERIES} 
              component={MyDeliveriesStackNavigator} 
              options={{ title: 'Мои доставки' }} 
            />
            <Tab.Screen 
              name={SCREENS.MAP} 
              component={MapScreen} 
              options={{ title: 'Карта' }} 
            />
            <Tab.Screen name={SCREENS.PROFILE}>
              {props => <ProfileScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
            </Tab.Screen>
          </>
        )}
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 