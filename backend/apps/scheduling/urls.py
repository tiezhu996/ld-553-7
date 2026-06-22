from rest_framework.routers import DefaultRouter

from apps.scheduling.views import VehicleScheduleViewSet

router = DefaultRouter()
router.register("", VehicleScheduleViewSet, basename="schedules")
urlpatterns = router.urls
