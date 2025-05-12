import React from 'react';
import { StyleSheet, ViewStyle, TouchableOpacity, View } from 'react-native';
import { Card, Text, Divider, useTheme, MD3Theme } from 'react-native-paper';
import Icon from './Icon';

interface MaterialCardProps {
  title: string;
  onPress?: () => void;
  children: React.ReactNode;
  icon?: string;
  style?: ViewStyle;
  mode?: 'elevated' | 'outlined' | 'contained';
  elevation?: number;
  footer?: React.ReactNode;
  cornerRadius?: number;
}

/**
 * Компонент карточки в стиле Material Design 3
 */
const MaterialCard: React.FC<MaterialCardProps> = ({
  title,
  onPress,
  children,
  icon,
  style,
  mode = 'elevated',
  elevation = 1,
  footer,
  cornerRadius = 16
}) => {
  const theme = useTheme();

  // Определяем уровни тени в зависимости от режима и уровня
  const cardStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: cornerRadius
  };

  if (mode === 'outlined') {
    Object.assign(cardStyle, {
      borderWidth: 1,
      borderColor: theme.colors.outline
    });
  } else if (mode === 'contained') {
    Object.assign(cardStyle, {
      backgroundColor: theme.colors.surfaceVariant
    });
  }

  const renderContent = () => (
    <View style={{flex: 1}}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.titleContainer}>
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
              <Icon 
                name={icon} 
                size={24} 
                color={theme.colors.onPrimaryContainer} 
              />
            </View>
          )}
          <Text 
            variant="titleLarge" 
            style={{ 
              color: theme.colors.onSurface, 
              fontWeight: '500',
              flex: 1
            }}
          >
            {title}
          </Text>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.contentContainer}>
          {children}
        </View>
      </Card.Content>
      
      {footer && (
        <View>
          <Divider />
          <Card.Actions style={styles.footer}>
            {footer}
          </Card.Actions>
        </View>
      )}
    </View>
  );

  return (
    <Card
      style={[
        styles.card,
        cardStyle,
        style
      ]}
      mode={mode}
      elevation={elevation as any}
    >
      {onPress ? (
        <TouchableOpacity 
          onPress={onPress} 
          activeOpacity={0.7}
          style={styles.touchable}
        >
          {renderContent()}
        </TouchableOpacity>
      ) : (
        renderContent()
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 8,
    overflow: 'hidden',
  },
  touchable: {
    flex: 1,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  divider: {
    marginVertical: 12,
  },
  contentContainer: {
    paddingTop: 4,
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});

export default MaterialCard; 