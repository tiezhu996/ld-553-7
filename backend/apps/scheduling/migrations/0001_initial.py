# Generated vehicle schedule migration

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("vehicles", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="VehicleSchedule",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("schedule_date", models.DateField(db_index=True)),
                ("start_time", models.TimeField()),
                ("end_time", models.TimeField()),
                ("task", models.CharField(max_length=500)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("OPERATING", "运营中"),
                            ("MAINTENANCE", "维修中"),
                            ("DISABLED", "停用/报废"),
                            ("PENDING", "待审核"),
                        ],
                        default="OPERATING",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "vehicle",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="schedules",
                        to="vehicles.vehicle",
                    ),
                ),
            ],
            options={
                "ordering": ["schedule_date", "start_time"],
            },
        ),
        migrations.AddIndex(
            model_name="vehicleschedule",
            index=models.Index(fields=["vehicle", "schedule_date"], name="scheduling__vehicl_94ef89_idx"),
        ),
    ]
