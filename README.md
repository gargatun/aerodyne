# Aerodyne - Система доставки

Проект состоит из двух частей:
1. Django backend API (delivery_app)
2. React Native мобильное приложение (NewDeliveryApp)

## Структура проекта

```
aerodyne/
├── delivery_app/         # Django бэкенд
│   ├── api/              # API эндпоинты
│   ├── core/             # Основные модели и функции
│   └── ...
├── NewDeliveryApp/       # React Native мобильное приложение
│   ├── src/              # Исходный код приложения
│   │   ├── components/   # Переиспользуемые компоненты
│   │   ├── screens/      # Экраны приложения
│   │   ├── services/     # Сервисы для работы с API и данными
│   │   ├── navigation/   # Навигация приложения
│   │   ├── types/        # TypeScript типы
│   │   ├── utils/        # Вспомогательные функции
│   │   └── config.ts     # Конфигурация приложения
│   ├── android/          # Android-специфичный код
│   ├── ios/              # iOS-специфичный код
│   └── ...
├── requirements.txt      # Python зависимости
└── README.md             # Этот файл
```

## Требования

### Для бэкенда (Django)
- Python 3.8+
- Django 3.2+
- Django REST Framework
- JWT аутентификация

### Для мобильного приложения (React Native)
- Node.js 14+
- React Native 0.70+
- TypeScript
- Yarn или npm

## Установка и запуск

### Бэкенд (Django)

1. Создайте и активируйте виртуальное окружение:
   ```bash
   python -m venv venv
   source venv/bin/activate  # На Windows: venv\Scripts\activate
   ```

2. Установите зависимости:
   ```bash
   pip install -r requirements.txt
   ```

3. Примените миграции:
   ```bash
   cd delivery_app
   python manage.py migrate
   ```

4. Запустите сервер разработки:
   ```bash
   python manage.py runserver
   ```

### Мобильное приложение (React Native)

1. Установите зависимости:
   ```bash
   cd NewDeliveryApp
   npm install
   # или
   yarn install
   ```

2. Запустите Metro:
   ```bash
   npm start
   # или
   yarn start
   ```

3. Запустите приложение:
   ```bash
   # Для Android
   npm run android
   # или
   yarn android
   
   # Для iOS
   npm run ios
   # или
   yarn ios
   ```

## Функциональность

### Реализовано
- Авторизация пользователей через JWT
- Профиль пользователя
- Просмотр доступных доставок
- Управление своими доставками
- Поддержка офлайн режима с помощью NetInfo
- Кэширование данных для работы без интернета
- Обработка ошибок и уведомления пользователя

### В разработке
- Отображение доставок на карте
- Подробная статистика по доставкам
- Чат между курьером и получателем

## API Endpoints

- `/api/token/` - Получение JWT токена
- `/api/token/refresh/` - Обновление JWT токена
- `/api/users/me/` - Информация о текущем пользователе
- `/api/deliveries/available/` - Список доступных доставок
- `/api/deliveries/my/active/` - Список активных доставок курьера
- `/api/deliveries/{id}/` - Детали конкретной доставки
- `/api/deliveries/{id}/accept/` - Принять доставку
- `/api/deliveries/{id}/status/` - Изменить статус доставки

