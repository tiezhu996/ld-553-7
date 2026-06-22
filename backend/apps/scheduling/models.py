from django.db import models

from apps.common.constants.enums import VehicleStatus
from apps.vehicles.models import Vehicle


class VehicleSchedule(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="schedules")
    schedule_date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    task = models.CharField(max_length=500)
    status = models.CharField(max_length=20, choices=VehicleStatus.choices, default=VehicleStatus.OPERATING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["schedule_date", "start_time"]
        indexes = [
            models.Index(fields=["vehicle", "schedule_date"]),
        ]
