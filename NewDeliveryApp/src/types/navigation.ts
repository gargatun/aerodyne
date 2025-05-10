import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Типы для основной навигации
export type MainTabParamList = {
  Deliveries: undefined;
  MyDeliveries: undefined;
  Map: undefined;
  Profile: undefined;
  Login: undefined;
};

// Типы для стека авторизации
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Типы для стека доставок
export type DeliveryStackParamList = {
  DeliveryList: undefined;
  DeliveryDetails: { deliveryId: number };
  NewDelivery: undefined;
};

// Тип для навигации между табами
export type MainTabNavigationProp<T extends keyof MainTabParamList> = 
  BottomTabNavigationProp<MainTabParamList, T>;

// Комбинированный тип для навигации между стеками
export type DeliveryScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<DeliveryStackParamList, 'DeliveryList'>,
  BottomTabNavigationProp<MainTabParamList>
>;

// Типы для роутов
export type DeliveryDetailsRouteProp = RouteProp<
  DeliveryStackParamList,
  'DeliveryDetails'
>; 