from rest_framework import serializers

from apps.scheduling.models import VehicleSchedule
from apps.vehicles.serializers import VehicleSerializer


class VehicleScheduleSerializer(serializers.ModelSerializer):
    vehicle_detail = VehicleSerializer(source="vehicle", read_only=True)

    class Meta:
        model = VehicleSchedule
        fields = "__all__"

    def validate(self, attrs):
        start = attrs.get("start_time")
        end = attrs.get("end_time")
        if start and end and start >= end:
            raise serializers.ValidationError("结束时间必须晚于开始时间")
        return attrs
