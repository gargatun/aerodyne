"""
URL configuration for delivery_app project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
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
    path('api/deliveries/coordinates/', DeliveryViewSet.as_view({'get': 'coordinates'}), name='deliveries_coordinates'),
    path('api/deliveries/sync/', DeliveryViewSet.as_view({'post': 'sync'}), name='deliveries_sync'),
    path('api/deliveries/<int:pk>/assign/', DeliveryViewSet.as_view({'patch': 'assign'}), name='delivery_assign'),
    path('api/deliveries/<int:pk>/unassign/', DeliveryViewSet.as_view({'patch': 'unassign'}), name='delivery_unassign'),
    path('api/deliveries/<int:pk>/media/', DeliveryViewSet.as_view({'post': 'media'}), name='delivery_media'),
    path('api/deliveries/<int:pk>/update-status/', DeliveryViewSet.as_view({'patch': 'update_status'}), name='delivery_update_status'),
    path('api/deliveries/<int:pk>/update-all/', DeliveryViewSet.as_view({'patch': 'update_all'}), name='delivery_update_all'),
    path('api/deliveries/create_simple/', DeliveryViewSet.as_view({'post': 'create_simple'}), name='delivery_create_simple'),
    path('api/profile/', ProfileView.as_view(), name='profile'),
    path('api/', include(router.urls)),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/login/', RedirectView.as_view(url='/api/token/'), name='auth_login_redirect'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
