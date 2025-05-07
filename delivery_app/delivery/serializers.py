"""
Сериализаторы для моделей приложения доставки.
Предоставляет сериализацию для всех моделей в формате JSON.
"""

from django.contrib.auth.models import User
from rest_framework import serializers
from .models import (
    TransportModel,
    PackagingType,
    Service,
    Status,
    Delivery,
    UserProfile
)

# pylint: disable=no-member
# objects - это стандартный атрибут Django моделей

class TransportModelSerializer(serializers.ModelSerializer):
    """Сериализатор для модели транспорта."""
    class Meta:
        """Метаданные сериализатора транспорта."""
        model = TransportModel
        fields = ['id', 'name']

class PackagingTypeSerializer(serializers.ModelSerializer):
    """Сериализатор для типа упаковки."""
    class Meta:
        """Метаданные сериализатора типа упаковки."""
        model = PackagingType
        fields = ['id', 'name']

class ServiceSerializer(serializers.ModelSerializer):
    """Сериализатор для услуги."""
    class Meta:
        """Метаданные сериализатора услуги."""
        model = Service
        fields = ['id', 'name']

class StatusSerializer(serializers.ModelSerializer):
    """Сериализатор для статуса."""
    class Meta:
        """Метаданные сериализатора статуса."""
        model = Status
        fields = ['id', 'name', 'color']

class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для пользователя."""
    class Meta:
        """Метаданные сериализатора пользователя."""
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class UserProfileSerializer(serializers.ModelSerializer):
    """Сериализатор для профиля пользователя."""
    user = UserSerializer()

    class Meta:
        """Метаданные сериализатора профиля пользователя."""
        model = UserProfile
        fields = ['user', 'phone', 'email']

class DeliverySerializer(serializers.ModelSerializer):
    """Сериализатор для доставки."""
    transport_model = TransportModelSerializer()
    packaging = PackagingTypeSerializer()
    services = ServiceSerializer(many=True)
    status = StatusSerializer()
    courier = UserSerializer(allow_null=True)

    class Meta:
        """Метаданные сериализатора доставки."""
        model = Delivery
        fields = [
            'id', 'transport_model', 'transport_number',
            'start_time', 'end_time', 'distance', 'media_file',
            'services', 'packaging', 'status', 'technical_condition',
            'courier', 'source_address', 'destination_address'
        ]

    def create(self, validated_data):
        """Создает новую доставку с связанными объектами."""
        transport_model_data = validated_data.pop('transport_model')
        packaging_data = validated_data.pop('packaging')
        services_data = validated_data.pop('services')
        status_data = validated_data.pop('status')
        courier_data = validated_data.pop('courier', None)

        transport_model, _ = TransportModel.objects.get_or_create(**transport_model_data)
        packaging, _ = PackagingType.objects.get_or_create(**packaging_data)
        status, _ = Status.objects.get_or_create(**status_data)
        courier = User.objects.get(**courier_data) if courier_data else None

        delivery = Delivery.objects.create(
            transport_model=transport_model,
            packaging=packaging,
            status=status,
            courier=courier,
            **validated_data
        )

        for service_data in services_data:
            service, _ = Service.objects.get_or_create(**service_data)
            delivery.services.add(service)

        return delivery

    def update(self, instance, validated_data):
        """Обновляет существующую доставку и связанные объекты."""
        transport_model_data = validated_data.pop('transport_model', None)
        packaging_data = validated_data.pop('packaging', None)
        services_data = validated_data.pop('services', None)
        status_data = validated_data.pop('status', None)
        courier_data = validated_data.pop('courier', None)

        if transport_model_data:
            transport_model, _ = TransportModel.objects.get_or_create(**transport_model_data)
            instance.transport_model = transport_model
        if packaging_data:
            packaging, _ = PackagingType.objects.get_or_create(**packaging_data)
            instance.packaging = packaging
        if status_data:
            status, _ = Status.objects.get_or_create(**status_data)
            instance.status = status
        if courier_data:
            instance.courier = User.objects.get(**courier_data) if courier_data else None
        if services_data:
            instance.services.clear()
            for service_data in services_data:
                service, _ = Service.objects.get_or_create(**service_data)
                instance.services.add(service)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance
