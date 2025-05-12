# Aerodyne - Система доставки

Проект состоит из трех частей:
1. Django backend API (delivery_app)
2. React Native мобильное приложение (NewDeliveryApp)
3. Web-приложение для отчетов (delivery-report-web)

## Структура проекта

```
aerodyne/
├── delivery_app/           # Django бэкенд
│   ├── api/                # API эндпоинты
│   ├── core/               # Основные модели и функции
│   └── ...
├── NewDeliveryApp/         # React Native мобильное приложение
│   ├── src/                # Исходный код приложения
│   │   ├── components/     # Переиспользуемые компоненты
│   │   ├── screens/        # Экраны приложения
│   │   ├── services/       # Сервисы для работы с API и данными
│   │   ├── navigation/     # Навигация приложения
│   │   ├── types/          # TypeScript типы
│   │   ├── utils/          # Вспомогательные функции
│   │   └── config.ts       # Конфигурация приложения
│   ├── android/            # Android-специфичный код
│   ├── ios/                # iOS-специфичный код
│   └── ...
├── delivery-report-web/    # Web-приложение для отчетов
│   ├── src/                # Исходный код приложения
│   │   ├── components/     # Переиспользуемые компоненты
│   │   ├── pages/          # Страницы приложения
│   │   ├── services/       # Сервисы для работы с API
│   │   └── ...
│   └── ...
├── requirements.txt        # Python зависимости
├── .gitignore              # Файлы, исключенные из Git
└── README.md               # Этот файл
```

## Требования

### Для бэкенда (Django)
- Python 3.8+
- Django 4.2+
- Django REST Framework 3.14+
- JWT аутентификация (djangorestframework-simplejwt 5.2+)
- PostgreSQL 12+

### Для мобильного приложения (React Native)
- Node.js 14+
- React Native 0.70+
- TypeScript
- Yarn или npm

### Для веб-приложения отчетов
- Node.js 16+
- React 18+
- TypeScript
- Vite или Create React App

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

3. Создайте файл .env в корне проекта на основе .env.example

4. Примените миграции:
   ```bash
   cd delivery_app
   python manage.py migrate
   ```

5. Запустите сервер разработки:
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

### Web-приложение для отчетов

1. Установите зависимости:
   ```bash
   cd delivery-report-web
   npm install
   # или
   yarn install
   ```

2. Запустите приложение:
   ```bash
   npm run dev
   # или
   yarn dev
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
- Формирование отчетов и аналитика (web-приложение)

### В разработке
- Отображение доставок на карте
- Подробная статистика по доставкам
- Чат между курьером и получателем
- Интеграция с платежными системами

## API Endpoints

### Аутентификация
- `/api/token/` - Получение JWT токена
- `/api/token/refresh/` - Обновление JWT токена

### Пользователи
- `/api/users/me/` - Информация о текущем пользователе
- `/api/profile/` - Получение/обновление профиля пользователя (GET/PUT)

### Справочники
- `/api/transport-models/` - Получение списка моделей транспорта
- `/api/packaging-types/` - Получение списка типов упаковки
- `/api/services/` - Получение списка доступных услуг
- `/api/statuses/` - Получение списка статусов доставки

### Доставки
- `/api/deliveries/available/` - Список доступных доставок
- `/api/deliveries/my/active/` - Список активных доставок курьера
- `/api/deliveries/my/history/` - История доставок курьера
- `/api/deliveries/{id}/` - Детали конкретной доставки
- `/api/deliveries/` - Создание новой доставки (POST)
- `/api/deliveries/create_simple/` - Создание доставки с использованием ID связанных объектов (POST)
- `/api/deliveries/{id}/` - Обновление существующей доставки (PUT)
- `/api/deliveries/{id}/assign/` - Назначить доставку курьеру
- `/api/deliveries/{id}/unassign/` - Отменить назначение доставки
- `/api/deliveries/{id}/media/` - Загрузка медиафайлов для доставки
- `/api/deliveries/{id}/update-status/` - Обновление статуса доставки (PATCH)
- `/api/deliveries/{id}/update-all/` - Полное обновление всех полей доставки (PATCH)
- `/api/deliveries/sync/` - Синхронизация данных о доставках
- `/api/deliveries/coordinates/` - Получение координат всех доставок
