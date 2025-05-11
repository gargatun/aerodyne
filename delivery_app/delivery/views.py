"""
Представления для API приложения доставки.
Предоставляет эндпоинты для работы с моделями и статистикой.
"""

import logging
from rest_framework import viewsets, views, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.shortcuts import get_object_or_404

from .models import (
    TransportModel,
    PackagingType,
    Service,
    Status,
    Delivery,
    UserProfile,
    User
)
from .serializers import (
    TransportModelSerializer,
    PackagingTypeSerializer,
    ServiceSerializer,
    StatusSerializer,
    DeliverySerializer,
    UserProfileSerializer
)

# Настройка логирования
logger = logging.getLogger(__name__)

# pylint: disable=no-member
# objects - это стандартный атрибут Django моделей

class TransportModelViewSet(viewsets.ModelViewSet):
    """ViewSet для модели транспорта."""
    queryset = TransportModel.objects.all()
    serializer_class = TransportModelSerializer
    permission_classes = [IsAuthenticated]

class PackagingTypeViewSet(viewsets.ModelViewSet):
    """ViewSet для типа упаковки."""
    queryset = PackagingType.objects.all()
    serializer_class = PackagingTypeSerializer
    permission_classes = [IsAuthenticated]

class ServiceViewSet(viewsets.ModelViewSet):
    """ViewSet для услуги."""
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]

class StatusViewSet(viewsets.ModelViewSet):
    """ViewSet для статуса."""
    queryset = Status.objects.all()
    serializer_class = StatusSerializer
    permission_classes = [IsAuthenticated]

class DeliveryViewSet(viewsets.ModelViewSet):
    """ViewSet для доставки."""
    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        """
        Переопределение метода update для добавления логирования.
        
        Args:
            request: HTTP запрос
            
        Returns:
            Response: Обновленные данные или ошибка
        """
        logger.info(f"Попытка обновления доставки: {request.data}")
        print(f"Попытка обновления доставки: {request.data}")
        
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Логируем текущее состояние
        logger.info(f"Текущий статус: {instance.status.id} - {instance.status.name}")
        print(f"Текущий статус: {instance.status.id} - {instance.status.name}")
        
        # Проверяем обновление статуса
        status_id = request.data.get('status_id')
        if status_id:
            try:
                new_status = Status.objects.get(id=status_id)
                logger.info(f"Меняем статус на: {new_status.id} - {new_status.name}")
                print(f"Меняем статус на: {new_status.id} - {new_status.name}")
            except Status.DoesNotExist:
                logger.error(f"Статус с ID={status_id} не найден")
                print(f"Статус с ID={status_id} не найден")
        
        # Выполняем стандартное обновление
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Проверяем, что статус обновился
        updated_instance = self.get_object()
        logger.info(f"Обновленный статус: {updated_instance.status.id} - {updated_instance.status.name}")
        print(f"Обновленный статус: {updated_instance.status.id} - {updated_instance.status.name}")
        
        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def assign(self, request, pk=None):
        """
        Присваивает доставку текущему пользователю.
        
        Args:
            request: HTTP запрос
            pk: ID доставки
            
        Returns:
            Response: Данные о доставке или ошибка
        """
        delivery = self.get_object()
        
        if delivery.courier is not None:
            return Response(
                {"error": "Доставка уже назначена курьеру."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        delivery.courier = request.user
        delivery.save()
        
        serializer = self.get_serializer(delivery)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def unassign(self, request, pk=None):
        """
        Снимает назначение доставки с текущего пользователя.
        
        Args:
            request: HTTP запрос
            pk: ID доставки
            
        Returns:
            Response: Данные о доставке или ошибка
        """
        delivery = self.get_object()
        
        if delivery.courier != request.user:
            return Response(
                {"error": "Вы не являетесь курьером этой доставки."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        delivery.courier = None
        delivery.save()
        
        serializer = self.get_serializer(delivery)
        return Response(serializer.data)
        
    @action(detail=True, methods=['post'])
    def media(self, request, pk=None):
        """
        Загружает медиафайл для доставки.
        
        Args:
            request: HTTP запрос
            pk: ID доставки
            
        Returns:
            Response: Данные о доставке или ошибка
        """
        delivery = self.get_object()
        
        if 'media_file' not in request.FILES:
            return Response(
                {"error": "Файл не предоставлен."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        delivery.media_file = request.FILES['media_file']
        delivery.save()
        
        serializer = self.get_serializer(delivery)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def sync(self, request):
        """
        Синхронизирует офлайн-изменения доставок.
        
        Args:
            request: HTTP запрос
            
        Returns:
            Response: Результаты синхронизации
        """
        changes = request.data.get('changes', [])
        results = []
        
        for change in changes:
            change_id = change.get('id')
            action_type = change.get('action')
            data = change.get('data', {})
            
            try:
                if action_type == 'create':
                    serializer = self.get_serializer(data=data)
                    serializer.is_valid(raise_exception=True)
                    serializer.save()
                    results.append({
                        'id': change_id,
                        'status': 'created',
                        'data': serializer.data
                    })
                elif action_type == 'update':
                    if 'id' not in data:
                        results.append({
                            'id': change_id,
                            'status': 'error',
                            'error': 'ID не указан для обновления'
                        })
                        continue
                    
                    delivery = get_object_or_404(Delivery, id=data['id'])
                    serializer = self.get_serializer(delivery, data=data, partial=True)
                    serializer.is_valid(raise_exception=True)
                    serializer.save()
                    results.append({
                        'id': change_id,
                        'status': 'updated',
                        'data': serializer.data
                    })
                else:
                    results.append({
                        'id': change_id,
                        'status': 'error',
                        'error': f'Неизвестное действие: {action_type}'
                    })
            except Exception as e:
                results.append({
                    'id': change_id,
                    'status': 'error',
                    'error': str(e)
                })
        
        return Response(results)
    
    @action(detail=False, methods=['get'])
    def coordinates(self, request):
        """
        Возвращает координаты доставок.
        
        Args:
            request: HTTP запрос
            
        Returns:
            Response: Список координат доставок
        """
        deliveries = self.queryset.filter(
            courier__isnull=True
        ).values('id', 'source_lat', 'source_lon', 'dest_lat', 'dest_lon')
        
        # Фильтруем только те доставки, у которых заполнены координаты
        result = []
        for delivery in deliveries:
            if (delivery.get('source_lat') and delivery.get('source_lon') and 
                delivery.get('dest_lat') and delivery.get('dest_lon')):
                result.append(delivery)
        
        return Response(result)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """
        Специальный action для обновления статуса доставки.
        
        Args:
            request: HTTP запрос с status_id в теле
            pk: ID доставки
            
        Returns:
            Response: Обновленные данные доставки
        """
        delivery = self.get_object()
        
        # Получаем ID статуса из запроса
        status_id = request.data.get('status_id')
        if not status_id:
            return Response(
                {"error": "Необходимо указать status_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Получаем объект статуса
            status_obj = Status.objects.get(id=status_id)
            
            # Обновляем статус доставки
            old_status = delivery.status
            print(f"Обновляем статус доставки {delivery.id} с {old_status.id} ({old_status.name}) на {status_obj.id} ({status_obj.name})")
            
            delivery.status = status_obj
            delivery.save()
            
            # Проверяем, что статус обновился
            delivery.refresh_from_db()
            print(f"Статус после обновления: {delivery.status.id} ({delivery.status.name})")
            
            # Возвращаем обновленные данные
            serializer = self.get_serializer(delivery)
            return Response(serializer.data)
        
        except Status.DoesNotExist:
            return Response(
                {"error": f"Статус с ID {status_id} не найден"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    @action(detail=True, methods=['patch'])
    def update_all(self, request, pk=None):
        """
        Обновляет все поля доставки в одном запросе.
        
        Args:
            request: HTTP запрос с полями для обновления
            pk: ID доставки
            
        Returns:
            Response: Обновленные данные доставки
        """
        delivery = self.get_object()
        
        logger.info(f"Обновление всех полей доставки: {request.data}")
        print(f"Обновление всех полей доставки {delivery.id}: {request.data}")
        
        # Обработка связанных моделей
        transport_model_id = request.data.get('transport_model_id')
        packaging_id = request.data.get('packaging_id')
        service_ids = request.data.get('service_ids', [])
        status_id = request.data.get('status_id')
        
        try:
            # Обновляем модель транспорта
            if transport_model_id:
                try:
                    transport_model = TransportModel.objects.get(id=transport_model_id)
                    delivery.transport_model = transport_model
                    print(f"Модель транспорта установлена: {transport_model.id} ({transport_model.name})")
                except TransportModel.DoesNotExist:
                    return Response(
                        {"error": f"Модель транспорта с ID {transport_model_id} не найдена"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Обновляем тип упаковки
            if packaging_id:
                try:
                    packaging = PackagingType.objects.get(id=packaging_id)
                    delivery.packaging = packaging
                    print(f"Тип упаковки установлен: {packaging.id} ({packaging.name})")
                except PackagingType.DoesNotExist:
                    return Response(
                        {"error": f"Тип упаковки с ID {packaging_id} не найден"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Обновляем услуги
            if service_ids:
                # Очищаем текущие услуги
                delivery.services.clear()
                print(f"Очищены текущие услуги")
                
                # Добавляем новые услуги
                for service_id in service_ids:
                    try:
                        service = Service.objects.get(id=service_id)
                        delivery.services.add(service)
                        print(f"Добавлена услуга: {service.id} ({service.name})")
                    except Service.DoesNotExist:
                        print(f"Услуга с ID {service_id} не найдена")
                        # Не прерываем выполнение, просто пропускаем эту услугу
            
            # Обновляем статус
            if status_id:
                try:
                    status_obj = Status.objects.get(id=status_id)
                    delivery.status = status_obj
                    print(f"Статус установлен: {status_obj.id} ({status_obj.name})")
                except Status.DoesNotExist:
                    return Response(
                        {"error": f"Статус с ID {status_id} не найден"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Обновляем прочие поля
            for field in ['transport_number', 'start_time', 'end_time', 'distance', 
                         'technical_condition', 'source_address', 'destination_address',
                         'source_lat', 'source_lon', 'dest_lat', 'dest_lon']:
                if field in request.data:
                    setattr(delivery, field, request.data.get(field))
                    print(f"Поле {field} установлено: {request.data.get(field)}")
            
            # Сохраняем доставку
            delivery.save()
            print(f"Доставка {delivery.id} успешно сохранена")
            
            # Возвращаем обновленные данные
            serializer = self.get_serializer(delivery)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Ошибка при обновлении доставки: {str(e)}")
            print(f"Ошибка при обновлении доставки: {str(e)}")
            return Response(
                {"error": f"Ошибка при обновлении доставки: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def create_simple(self, request):
        """
        Создает новую доставку с использованием ID связанных объектов.
        
        Args:
            request: HTTP запрос с полями для создания
            
        Returns:
            Response: Данные созданной доставки
        """
        logger.info(f"Создание новой доставки: {request.data}")
        print(f"Создание новой доставки: {request.data}")
        
        # Обработка связанных моделей
        transport_model_id = request.data.get('transport_model_id')
        packaging_id = request.data.get('packaging_id')
        service_ids = request.data.get('service_ids', [])
        status_id = request.data.get('status_id')
        courier_id = request.data.get('courier_id')
        
        try:
            # Получаем модель транспорта
            if not transport_model_id:
                return Response(
                    {"error": "Необходимо указать transport_model_id"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                transport_model = TransportModel.objects.get(id=transport_model_id)
                print(f"Модель транспорта: {transport_model.id} ({transport_model.name})")
            except TransportModel.DoesNotExist:
                return Response(
                    {"error": f"Модель транспорта с ID {transport_model_id} не найдена"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Получаем тип упаковки
            if not packaging_id:
                return Response(
                    {"error": "Необходимо указать packaging_id"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                packaging = PackagingType.objects.get(id=packaging_id)
                print(f"Тип упаковки: {packaging.id} ({packaging.name})")
            except PackagingType.DoesNotExist:
                return Response(
                    {"error": f"Тип упаковки с ID {packaging_id} не найден"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Получаем статус
            if not status_id:
                return Response(
                    {"error": "Необходимо указать status_id"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                status_obj = Status.objects.get(id=status_id)
                print(f"Статус: {status_obj.id} ({status_obj.name})")
            except Status.DoesNotExist:
                return Response(
                    {"error": f"Статус с ID {status_id} не найден"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Получаем курьера (если указан)
            courier = None
            if courier_id:
                try:
                    courier = User.objects.get(id=courier_id)
                    print(f"Курьер: {courier.id} ({courier.username})")
                except User.DoesNotExist:
                    return Response(
                        {"error": f"Курьер с ID {courier_id} не найден"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Создаем новую доставку
            delivery = Delivery(
                transport_model=transport_model,
                packaging=packaging,
                status=status_obj,
                courier=courier,
                transport_number=request.data.get('transport_number', ''),
                start_time=request.data.get('start_time'),
                end_time=request.data.get('end_time'),
                distance=request.data.get('distance', 0),
                technical_condition=request.data.get('technical_condition', 'Исправно'),
                source_address=request.data.get('source_address', ''),
                destination_address=request.data.get('destination_address', ''),
                source_lat=request.data.get('source_lat'),
                source_lon=request.data.get('source_lon'),
                dest_lat=request.data.get('dest_lat'),
                dest_lon=request.data.get('dest_lon')
            )
            
            # Сохраняем доставку
            delivery.save()
            print(f"Доставка создана с ID: {delivery.id}")
            
            # Добавляем услуги
            if service_ids:
                for service_id in service_ids:
                    try:
                        service = Service.objects.get(id=service_id)
                        delivery.services.add(service)
                        print(f"Добавлена услуга: {service.id} ({service.name})")
                    except Service.DoesNotExist:
                        print(f"Услуга с ID {service_id} не найдена")
                        # Не прерываем выполнение, просто пропускаем эту услугу
            
            # Возвращаем созданную доставку
            serializer = self.get_serializer(delivery)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Ошибка при создании доставки: {str(e)}")
            print(f"Ошибка при создании доставки: {str(e)}")
            return Response(
                {"error": f"Ошибка при создании доставки: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

class AvailableDeliveriesView(views.APIView):
    """Представление для получения доступных доставок."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Получает список доставок без назначенного курьера и со статусом "В ожидании".
        Поддерживает фильтрацию по максимальному расстоянию и сортировку.
        
        Args:
            request: HTTP запрос
            
        Returns:
            Response: Список доступных доставок
        """
        # Получаем или создаем статус "В ожидании"
        status_obj, _ = Status.objects.get_or_create(
            name="В ожидании",
            defaults={'color': 'yellow'}
        )

        # Получаем доставки без курьера и с нужным статусом
        deliveries = Delivery.objects.filter(
            courier__isnull=True,
            status=status_obj
        ).select_related(
            'transport_model',
            'packaging',
            'status'
        ).prefetch_related('services')
        
        # Фильтрация по максимальному расстоянию
        max_distance = request.query_params.get('max_distance')
        if max_distance and max_distance.isdigit():
            deliveries = deliveries.filter(distance__lte=float(max_distance))
        
        # Сортировка
        sort_by = request.query_params.get('sort_by')
        if sort_by:
            if sort_by == 'distance':
                deliveries = deliveries.order_by('distance')
            elif sort_by == '-distance':
                deliveries = deliveries.order_by('-distance')
            elif sort_by == 'start_time':
                deliveries = deliveries.order_by('start_time')
            elif sort_by == '-start_time':
                deliveries = deliveries.order_by('-start_time')

        serializer = DeliverySerializer(deliveries, many=True)
        return Response(serializer.data)

class MyActiveDeliveriesView(views.APIView):
    """Представление для получения активных доставок курьера."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Получает список активных доставок текущего курьера.
        
        Args:
            request: HTTP запрос
            
        Returns:
            Response: Список активных доставок
        """
        deliveries = Delivery.objects.filter(
            courier=request.user
        ).exclude(status__name="Доставлено")
        serializer = DeliverySerializer(deliveries, many=True)
        return Response(serializer.data)

class MyHistoryDeliveriesView(views.APIView):
    """Представление для получения истории доставок курьера."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Получает историю доставок текущего курьера.
        
        Args:
            request: HTTP запрос
            
        Returns:
            Response: История доставок
        """
        deliveries = Delivery.objects.filter(
            courier=request.user,
            status__name="Доставлено"
        )
        serializer = DeliverySerializer(deliveries, many=True)
        return Response(serializer.data)

class ProfileView(views.APIView):
    """Представление для профиля курьера и статистики."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Получает профиль курьера и статистику доставок.
        
        Args:
            request: HTTP запрос
            
        Returns:
            Response: Профиль и статистика курьера
        """
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile)

        # Статистика
        total_deliveries = Delivery.objects.filter(
            courier=request.user
        ).count()

        successful_deliveries = Delivery.objects.filter(
            courier=request.user,
            status__name="Доставлено"
        ).count()

        # Вычисляем общее время доставки в секундах
        completed_deliveries = Delivery.objects.filter(
            courier=request.user,
            status__name="Доставлено"
        )

        total_delivery_time = 0
        for delivery in completed_deliveries:
            if delivery.end_time and delivery.start_time:
                duration = delivery.end_time - delivery.start_time
                total_delivery_time += duration.total_seconds()

        stats = {
            'total_deliveries': total_deliveries,
            'successful_deliveries': successful_deliveries,
            'total_delivery_time_seconds': round(total_delivery_time, 2),
            'total_delivery_time_hours': round(total_delivery_time / 3600, 2)  # Конвертируем в часы для удобства
        }

        return Response({**serializer.data, **stats})
        
    def put(self, request):
        """
        Обновляет профиль курьера.
        
        Args:
            request: HTTP запрос
            
        Returns:
            Response: Обновленный профиль
        """
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        
        # Обновляем только поля профиля, не затрагивая вложенный объект user
        data = {}
        if 'phone' in request.data:
            data['phone'] = request.data['phone']
        if 'email' in request.data:
            data['email'] = request.data['email']
        
        serializer = UserProfileSerializer(profile, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
        }
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
