"""
Модели для приложения доставки.
Включает модели для транспорта, упаковки, услуг, статусов и доставок.
"""

from django.db import models
from django.contrib.auth.models import User

class TransportModel(models.Model):
    """Модель транспорта для доставки."""
    name = models.CharField(max_length=100, unique=True)

    def __str__(self) -> str:
        return str(self.name)

    class Meta:
        """Метаданные модели транспорта."""
        verbose_name = "Transport Model"
        verbose_name_plural = "Transport Models"

class PackagingType(models.Model):
    """Тип упаковки для доставки."""
    name = models.CharField(max_length=100, unique=True)

    def __str__(self) -> str:
        return str(self.name)

    class Meta:
        """Метаданные модели типа упаковки."""
        verbose_name = "Packaging Type"
        verbose_name_plural = "Packaging Types"

class Service(models.Model):
    """Услуга доставки."""
    name = models.CharField(max_length=100, unique=True)

    def __str__(self) -> str:
        return str(self.name)

    class Meta:
        """Метаданные модели услуги."""
        verbose_name = "Service"
        verbose_name_plural = "Services"

class Status(models.Model):
    """Статус доставки."""
    name = models.CharField(max_length=100, unique=True)
    color = models.CharField(max_length=20, default='yellow')

    def __str__(self) -> str:
        return str(self.name)

    class Meta:
        """Метаданные модели статуса."""
        verbose_name = "Status"
        verbose_name_plural = "Statuses"

class UserProfile(models.Model):
    """Профиль пользователя."""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)

    def __str__(self) -> str:
        username = getattr(self.user, 'username', 'Unknown')
        return f"Profile of {username}"

    class Meta:
        """Метаданные модели профиля пользователя."""
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

class Delivery(models.Model):
    """Модель доставки."""
    TECHNICAL_CONDITION_CHOICES = [
        ('Исправно', 'Исправно'),
        ('Неисправно', 'Неисправно'),
    ]

    transport_model = models.ForeignKey(TransportModel, on_delete=models.CASCADE)
    transport_number = models.CharField(max_length=50)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    distance = models.FloatField()
    media_file = models.FileField(upload_to='deliveries/%Y/%m/%d/', blank=True, null=True)
    services = models.ManyToManyField(Service)
    packaging = models.ForeignKey(PackagingType, on_delete=models.CASCADE)
    status = models.ForeignKey(Status, on_delete=models.CASCADE)
    technical_condition = models.CharField(max_length=20, choices=TECHNICAL_CONDITION_CHOICES)
    courier = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    source_address = models.CharField(max_length=255, blank=True)
    destination_address = models.CharField(max_length=255, blank=True)
    source_lat = models.FloatField(blank=True, null=True)
    source_lon = models.FloatField(blank=True, null=True)
    dest_lat = models.FloatField(blank=True, null=True)
    dest_lon = models.FloatField(blank=True, null=True)

    def __str__(self) -> str:
        return f"Delivery {self.transport_number}"

    class Meta:
        """Метаданные модели доставки."""
        verbose_name = "Delivery"
        verbose_name_plural = "Deliveries"
