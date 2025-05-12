import React from 'react';
import { Platform, TouchableNativeFeedback, TouchableOpacity, View } from 'react-native';

/**
 * Компонент кнопки без визуального эффекта при нажатии
 * 
 * @param props - пропсы компонента
 * @returns Компонент кнопки без эффекта нажатия
 */
const NoFeedbackButton: React.FC<any> = ({ children, style, ...props }) => {
  if (Platform.OS === 'android') {
    return (
      <TouchableNativeFeedback
        background={TouchableNativeFeedback.Ripple('transparent', false)}
        useForeground={false}
        {...props}
      >
        <View style={style}>
          {children}
        </View>
      </TouchableNativeFeedback>
    );
  }
  
  return (
    <TouchableOpacity
      activeOpacity={1.0}
      style={style}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
};

export default NoFeedbackButton; 