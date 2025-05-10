"""Административная панель для управления моделями доставки."""
from django.contrib import admin
from .models import TransportModel, PackagingType, Service, Status, Delivery, UserProfile

@admin.register(TransportModel)
class TransportModelAdmin(admin.ModelAdmin):
    """Административный интерфейс для модели транспорта."""
    list_display = ['name']
    search_fields = ['name']

@admin.register(PackagingType)
class PackagingTypeAdmin(admin.ModelAdmin):
    """Административный интерфейс для типа упаковки."""
    list_display = ['name']
    search_fields = ['name']

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    """Административный интерфейс для услуги."""
    list_display = ['name']
    search_fields = ['name']

@admin.register(Status)
class StatusAdmin(admin.ModelAdmin):
    """Административный интерфейс для статуса доставки."""
    list_display = ['name', 'color']
    search_fields = ['name']

@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    """Административный интерфейс для доставки."""
    list_display = ['transport_number', 'transport_model', 'start_time', 'status', 'courier']
    list_filter = ['status', 'start_time', 'courier']
    search_fields = ['transport_number']

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Административный интерфейс для профиля пользователя."""
    list_display = ['user', 'phone', 'email']
    search_fields = ['user__username']
