from datetime import date, datetime, time
from typing import Optional

from django.db import models
from django.db.models import Q

from apps.common.constants.enums import VehicleStatus
from apps.common.exceptions import BusinessException
from apps.scheduling.models import VehicleSchedule
from apps.vehicles.models import Vehicle


class ScheduleService:
    @staticmethod
    def check_conflict(
        vehicle_id: int,
        schedule_date: date,
        start_time: time,
        end_time: time,
        exclude_id: Optional[int] = None,
    ) -> bool:
        qs = VehicleSchedule.objects.filter(
            vehicle_id=vehicle_id,
            schedule_date=schedule_date,
        )
        if exclude_id:
            qs = qs.exclude(id=exclude_id)
        conflict = qs.filter(
            Q(start_time__lt=end_time) & Q(end_time__gt=start_time)
        ).exists()
        return conflict

    @staticmethod
    def _extract_vehicle_id(data: dict) -> int:
        if "vehicle_id" in data:
            return int(data["vehicle_id"])
        v = data.get("vehicle")
        if isinstance(v, Vehicle):
            return v.id
        return int(v)

    @staticmethod
    def create_schedule(data: dict) -> VehicleSchedule:
        vehicle_id = ScheduleService._extract_vehicle_id(data)
        vehicle = Vehicle.objects.filter(id=vehicle_id).first()
        if not vehicle:
            raise BusinessException("车辆不存在")
        if vehicle.status != VehicleStatus.OPERATING:
            raise BusinessException("只有运营中车辆可以排班")

        schedule_date = data["schedule_date"]
        start_time = data["start_time"]
        end_time = data["end_time"]

        if ScheduleService.check_conflict(vehicle_id, schedule_date, start_time, end_time):
            raise BusinessException("该车辆在此时段已有排班，不可重叠")

        create_data = dict(data)
        create_data["vehicle_id"] = vehicle_id
        if "vehicle" in create_data:
            del create_data["vehicle"]
        schedule = VehicleSchedule.objects.create(**create_data)
        return schedule

    @staticmethod
    def update_schedule(schedule: VehicleSchedule, data: dict) -> VehicleSchedule:
        new_vehicle_id = ScheduleService._extract_vehicle_id(data) if ("vehicle" in data or "vehicle_id" in data) else schedule.vehicle_id
        schedule_date = data.get("schedule_date", schedule.schedule_date)
        start_time = data.get("start_time", schedule.start_time)
        end_time = data.get("end_time", schedule.end_time)

        if new_vehicle_id != schedule.vehicle_id or schedule_date != schedule.schedule_date or start_time != schedule.start_time or end_time != schedule.end_time:
            vehicle = Vehicle.objects.filter(id=new_vehicle_id).first()
            if not vehicle:
                raise BusinessException("车辆不存在")
            if vehicle.status != VehicleStatus.OPERATING:
                raise BusinessException("只有运营中车辆可以排班")
            if ScheduleService.check_conflict(new_vehicle_id, schedule_date, start_time, end_time, exclude_id=schedule.id):
                raise BusinessException("该车辆在此时段已有排班，不可重叠")

        update_data = dict(data)
        if "vehicle" in update_data or "vehicle_id" in update_data:
            update_data["vehicle_id"] = new_vehicle_id
            if "vehicle" in update_data:
                del update_data["vehicle"]
        for key, value in update_data.items():
            setattr(schedule, key, value)
        schedule.save()
        return schedule

    @staticmethod
    def list_by_date_range(start_date: date, end_date: date) -> list[VehicleSchedule]:
        return list(
            VehicleSchedule.objects.select_related("vehicle", "vehicle__driver")
            .filter(schedule_date__range=(start_date, end_date))
            .all()
        )

    @staticmethod
    def list_by_vehicle(vehicle_id: int, start_date: Optional[date] = None, end_date: Optional[date] = None) -> list[VehicleSchedule]:
        qs = VehicleSchedule.objects.select_related("vehicle", "vehicle__driver").filter(vehicle_id=vehicle_id)
        if start_date and end_date:
            qs = qs.filter(schedule_date__range=(start_date, end_date))
        return list(qs.all())

    @staticmethod
    def count_scheduled_vehicles_by_date(target_date: date) -> int:
        return (
            VehicleSchedule.objects.filter(schedule_date=target_date)
            .values_list("vehicle_id", flat=True)
            .distinct()
            .count()
        )
