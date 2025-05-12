import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Platform } from 'react-native';

import { LoginScreen } from '../screens/LoginScreen';
import DeliveriesScreen from '../screens/DeliveriesScreen';
import MyDeliveriesScreen from '../screens/MyDeliveriesScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DeliveryDetailsScreen from '../screens/DeliveryDetailsScreen';
import CreateDeliveryScreen from '../screens/CreateDeliveryScreen';
import { SCREENS } from '../constants';
import NoFeedbackButton from '../components/NoFeedbackButton';

const Tab = createBottomTabNavigator();
const DeliveriesStack = createStackNavigator();
const MyDeliveriesStack = createStackNavigator();

// Стек навигации для экрана "Доставки"
const DeliveriesStackNavigator = () => {
  return (
    <DeliveriesStack.Navigator
      screenOptions={{
        cardStyle: { backgroundColor: 'transparent' },
        // Отключаем эффект нажатия на кнопках в заголовке
        headerBackTitleStyle: { display: 'none' },
        headerPressColor: 'transparent',
        headerTintColor: '#006495',
      }}
    >
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
    <MyDeliveriesStack.Navigator
      screenOptions={{
        cardStyle: { backgroundColor: 'transparent' },
        // Отключаем эффект нажатия на кнопках в заголовке
        headerBackTitleStyle: { display: 'none' },
        headerPressColor: 'transparent',
        headerTintColor: '#006495',
      }}
    >
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
        tabBarStyle: route.name === SCREENS.LOGIN ? 
          { display: 'none' } : 
          {
            // Стили для панели tabBar
            elevation: 0, // Убираем тень на Android
            shadowOpacity: 0, // Убираем тень на iOS
            borderTopWidth: 0, // Убираем верхнюю границу
          },
        // Отключение эффекта нажатия (серого ореола)
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#006495',
        tabBarInactiveTintColor: '#73777f',
        tabBarPressColor: 'transparent',
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: { borderRadius: 0 },
        tabBarPressOpacity: 1,
        tabBarButton: (props) => <NoFeedbackButton {...props} />,
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
          <Tab.Screen name={SCREENS.PROFILE} options={{ title: 'Профиль' }}>
            {props => <ProfileScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
          </Tab.Screen>
        </>
      )}
    </Tab.Navigator>
  );
};

export default AppNavigator; 