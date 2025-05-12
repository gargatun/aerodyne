import React from 'react';
import { ViewStyle, TextStyle } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Octicons from 'react-native-vector-icons/Octicons';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Feather from 'react-native-vector-icons/Feather';

// Именование наборов иконок для использования в компоненте
export enum IconSet {
  Material = 'material',
  MaterialCommunity = 'material-community',
  FontAwesome = 'font-awesome',
  Ionicons = 'ionicons',
  Octicons = 'octicons',
  EvilIcons = 'evil-icons',
  Feather = 'feather'
}

// Определение распространенных имен иконок по наборам
const ICON_SETS = {
  // Иконки Material Icons
  filter: { set: IconSet.Material, name: 'filter-list' },
  plus: { set: IconSet.Material, name: 'add' },
  check: { set: IconSet.Material, name: 'check' },
  close: { set: IconSet.Material, name: 'close' },
  upload: { set: IconSet.Material, name: 'file-upload' },
  save: { set: IconSet.Material, name: 'save' },
  edit: { set: IconSet.Material, name: 'edit' },
  delete: { set: IconSet.Material, name: 'delete' },
  search: { set: IconSet.Material, name: 'search' },
  settings: { set: IconSet.Material, name: 'settings' },
  
  // Иконки Material Community Icons
  'map-marker': { set: IconSet.MaterialCommunity, name: 'map-marker' },
  'map-marker-outline': { set: IconSet.MaterialCommunity, name: 'map-marker-outline' },
  'map-marker-distance': { set: IconSet.MaterialCommunity, name: 'map-marker-distance' },
  'package-variant': { set: IconSet.MaterialCommunity, name: 'package-variant' },
  'package-variant-closed': { set: IconSet.MaterialCommunity, name: 'package-variant-closed' },
  'package-variant-closed-remove': { set: IconSet.MaterialCommunity, name: 'package-variant-closed-remove' },
  history: { set: IconSet.MaterialCommunity, name: 'history' },
  calendar: { set: IconSet.MaterialCommunity, name: 'calendar' },
  truck: { set: IconSet.MaterialCommunity, name: 'truck' },
  account: { set: IconSet.MaterialCommunity, name: 'account' }
};

// Типы для свойств компонента
interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: TextStyle | ViewStyle;
  set?: IconSet;
}

/**
 * Универсальный компонент для отображения иконок
 * Автоматически выбирает правильный набор иконок на основе имени
 */
const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#000', style, set }) => {
  // Если набор иконок явно указан, используем его
  if (set) {
    switch (set) {
      case IconSet.Material:
        return <MaterialIcons name={name} size={size} color={color} style={style} />;
      case IconSet.MaterialCommunity:
        return <MaterialCommunityIcons name={name} size={size} color={color} style={style} />;
      case IconSet.FontAwesome:
        return <FontAwesome name={name} size={size} color={color} style={style} />;
      case IconSet.Ionicons:
        return <Ionicons name={name} size={size} color={color} style={style} />;
      case IconSet.Octicons:
        return <Octicons name={name} size={size} color={color} style={style} />;
      case IconSet.EvilIcons:
        return <EvilIcons name={name} size={size} color={color} style={style} />;
      case IconSet.Feather:
        return <Feather name={name} size={size} color={color} style={style} />;
    }
  }

  // Если набор не указан, определяем его на основе предопределенного маппинга
  const iconInfo = ICON_SETS[name];
  
  if (iconInfo) {
    // Рекурсивно вызываем этот же компонент с явно указанным набором
    return <Icon name={iconInfo.name} size={size} color={color} style={style} set={iconInfo.set} />;
  }
  
  // Если иконка не определена в маппинге, пробуем Material Icons по умолчанию
  return <MaterialIcons name={name} size={size} color={color} style={style} />;
};

export default Icon; 