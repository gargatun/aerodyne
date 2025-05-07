"""
Представления для API приложения доставки.
Предоставляет эндпоинты для работы с моделями и статистикой.
"""


from rest_framework import viewsets, views
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

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

class AvailableDeliveriesView(views.APIView):
    """Представление для получения доступных доставок."""
    permission_classes = [IsAuthenticated]

    def get(self, _request):
        """
        Получает список доставок без назначенного курьера и со статусом "В ожидании".
        
        Args:
            _request: HTTP запрос
            
        Returns:
            Response: Список доступных доставок
        """
        # Получаем или создаем статус "В ожидании"
        status = Status.objects.get_or_create(
            name="В ожидании",
            defaults={'color': 'yellow'}
        )

        # Получаем доставки без курьера и с нужным статусом
        deliveries = Delivery.objects.filter(
            courier__isnull=True,
            status=status
        ).select_related(
            'transport_model',
            'packaging',
            'status'
        ).prefetch_related('services')

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
        profile = UserProfile.objects.get_or_create(user=request.user)
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
