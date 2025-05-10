import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MapScreen = () => (
  <View style={styles.container}>
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <Icon name="map" size={80} color="#2196F3" />
        <Title style={styles.title}>Карта доставок</Title>
        <Paragraph style={styles.paragraph}>
          Функция отображения доставок на карте находится в разработке.
        </Paragraph>
        <Paragraph style={styles.paragraph}>
          В следующих версиях приложения здесь будет интерактивная карта с отображением текущих доставок и их статусов.
        </Paragraph>
      </Card.Content>
      <Card.Actions style={styles.actions}>
        <Button mode="outlined" disabled>
          Показать все доставки
        </Button>
      </Card.Actions>
    </Card>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  card: {
    elevation: 4,
  },
  cardContent: {
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  paragraph: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  actions: {
    justifyContent: 'center',
    paddingBottom: 16,
  },
});

export default MapScreen; 