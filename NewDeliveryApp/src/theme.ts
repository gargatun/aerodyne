import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

// Цвета Material Design 3
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#006495', // Основной цвет
    primaryContainer: '#cde5ff', // Контейнер основного цвета
    onPrimaryContainer: '#001d32', // Текст на контейнере основного цвета
    secondary: '#50606e', // Вторичный цвет
    secondaryContainer: '#d3e5f5', // Контейнер вторичного цвета
    onSecondaryContainer: '#0c1d29', // Текст на контейнере вторичного цвета
    tertiary: '#00639a', // Третичный цвет
    tertiaryContainer: '#cde5ff', // Контейнер третичного цвета
    onTertiaryContainer: '#001d32', // Текст на контейнере третичного цвета
    error: '#ba1a1a', // Цвет ошибки
    errorContainer: '#ffdad6', // Контейнер цвета ошибки
    onErrorContainer: '#410002', // Текст на контейнере цвета ошибки
    background: '#f8f9ff', // Фон
    surface: '#f8f9ff', // Поверхность
    onSurface: '#1a1c1e', // Текст на поверхности
    surfaceVariant: '#dfe2eb', // Вариант поверхности
    onSurfaceVariant: '#43474e', // Текст на варианте поверхности
    outline: '#73777f', // Обводка
    outlineVariant: '#c3c6cf', // Вариант обводки
    elevation: {
      level0: 'transparent',
      level1: '#f4f6ff', // Тень уровня 1
      level2: '#eef0f9', // Тень уровня 2
      level3: '#e9ebf4', // Тень уровня 3
      level4: '#e6e8f1', // Тень уровня 4
      level5: '#e4e6ef', // Тень уровня 5
    },
    surfaceDisabled: '#1a1c1e61', // Отключенная поверхность
    onSurfaceDisabled: '#1a1c1e1f', // Текст на отключенной поверхности
    backdrop: 'rgba(30, 32, 37, 0.4)', // Фон для модальных окон
  },
};

export default theme; 