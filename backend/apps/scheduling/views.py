from datetime import date, datetime, timedelta

from rest_framework import decorators, response, status, viewsets

from apps.common.permissions import IsOperatorOrAdmin
from apps.scheduling.models import VehicleSchedule
from apps.scheduling.serializers import VehicleScheduleSerializer
from apps.scheduling.services import ScheduleService


class VehicleScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleScheduleSerializer
    permission_classes = [IsOperatorOrAdmin]

    def get_queryset(self):
        queryset = VehicleSchedule.objects.select_related("vehicle", "vehicle__driver").all()

        start_date_str = self.request.query_params.get("start_date")
        end_date_str = self.request.query_params.get("end_date")
        vehicle_id = self.request.query_params.get("vehicle_id")

        if start_date_str and end_date_str:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
            queryset = queryset.filter(schedule_date__range=(start_date, end_date))
        elif target_date_str := self.request.query_params.get("date"):
            target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
            queryset = queryset.filter(schedule_date=target_date)

        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        schedule = ScheduleService.create_schedule(serializer.validated_data)
        headers = self.get_success_headers(VehicleScheduleSerializer(schedule).data)
        return response.Response(
            VehicleScheduleSerializer(schedule).data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        schedule = ScheduleService.update_schedule(instance, serializer.validated_data)
        return response.Response(VehicleScheduleSerializer(schedule).data)

    @decorators.action(detail=False, methods=["get"], url_path="weekly")
    def weekly(self, request):
        date_str = request.query_params.get("date")
        if date_str:
            base_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        else:
            base_date = date.today()
        start = base_date - timedelta(days=base_date.weekday())
        end = start + timedelta(days=6)
        qs = VehicleSchedule.objects.select_related("vehicle", "vehicle__driver").filter(
            schedule_date__range=(start, end)
        )
        return response.Response(VehicleScheduleSerializer(qs, many=True).data)

    @decorators.action(detail=False, methods=["get"], url_path="today-count")
    def today_count(self, request):
        today = date.today()
        count = ScheduleService.count_scheduled_vehicles_by_date(today)
        return response.Response({"date": today.isoformat(), "scheduled_vehicles": count})

    @decorators.action(detail=False, methods=["get"], url_path="operating-vehicles")
    def operating_vehicles(self, request):
        from apps.common.constants.enums import VehicleStatus
        from apps.vehicles.models import Vehicle
        from apps.vehicles.serializers import VehicleSerializer

        qs = Vehicle.objects.select_related("driver").filter(status=VehicleStatus.OPERATING)
        return response.Response(VehicleSerializer(qs, many=True).data)
