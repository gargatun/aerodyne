"""
Представления для API приложения доставки.
Предоставляет эндпоинты для работы с моделями и статистикой.
"""


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
    UserProfile
)
from .serializers import (
    TransportModelSerializer,
    PackagingTypeSerializer,
    ServiceSerializer,
    StatusSerializer,
    DeliverySerializer,
    UserProfileSerializer
)

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
