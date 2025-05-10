"""
URL configuration for delivery_app project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from delivery.views import (
    TransportModelViewSet, PackagingTypeViewSet, ServiceViewSet, StatusViewSet,
    DeliveryViewSet, AvailableDeliveriesView, MyActiveDeliveriesView,
    MyHistoryDeliveriesView, ProfileView, CustomTokenObtainPairView
)

router = DefaultRouter()
router.register(r'transport-models', TransportModelViewSet)
router.register(r'packaging-types', PackagingTypeViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'statuses', StatusViewSet)
router.register(r'deliveries', DeliveryViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/deliveries/available/', AvailableDeliveriesView.as_view(), name='available_deliveries'),
    path('api/deliveries/my/active/', MyActiveDeliveriesView.as_view(), name='my_active_deliveries'),
    path('api/deliveries/my/history/', MyHistoryDeliveriesView.as_view(), name='my_history_deliveries'),
    path('api/profile/', ProfileView.as_view(), name='profile'),
    path('api/', include(router.urls)),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
