import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VehicleStatus } from '../../shared/constants/enums';
import { Vehicle } from '../../shared/models/vehicle.model';
import { VehicleSchedule } from '../../shared/models/vehicle-schedule.model';
import { ApiService } from '../../shared/services/api.service';

@Component({ standalone: false,
  selector: 'app-schedule-form',
  template: `<h2 mat-dialog-title>{{ data?.schedule ? '编辑排班' : '新增排班' }}</h2><mat-dialog-content><form [formGroup]="form" class="form"><mat-form-field appearance="outline"><mat-label>车辆</mat-label><mat-select formControlName="vehicle" required><mat-option *ngFor="let v of vehicles" [value]="v.id">{{ v.plate_number }} - {{ v.brand }} {{ v.model }}</mat-option></mat-select></mat-form-field><mat-form-field appearance="outline"><mat-label>排班日期</mat-label><input matInput [matDatepicker]="picker" formControlName="schedule_date" required><mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle><mat-datepicker #picker></mat-datepicker></mat-form-field><div class="time-row"><mat-form-field appearance="outline"><mat-label>开始时间</mat-label><input matInput type="time" formControlName="start_time" required></mat-form-field><mat-form-field appearance="outline"><mat-label>结束时间</mat-label><input matInput type="time" formControlName="end_time" required></mat-form-field></div><mat-form-field appearance="outline"><mat-label>任务内容</mat-label><textarea matInput formControlName="task" rows="3" required placeholder="描述该时段的运营任务..."></textarea></mat-form-field><mat-form-field appearance="outline"><mat-label>状态</mat-label><mat-select formControlName="status" required><mat-option *ngFor="let s of statuses" [value]="s">{{ s | statusTranslate }}</mat-option></mat-select></mat-form-field></form></mat-dialog-content><mat-dialog-actions align="end"><button mat-button mat-dialog-close>取消</button><button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">保存</button></mat-dialog-actions>`,
  styles: [`.form{display:flex;flex-direction:column;gap:14px;min-width:420px}.time-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}`]
})
export class ScheduleFormComponent implements OnInit {
  form: FormGroup;
  vehicles: Vehicle[] = [];
  statuses = Object.values(VehicleStatus);
  @Output() saved = new EventEmitter<VehicleSchedule>();

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private snack: MatSnackBar,
    public dialogRef: MatDialogRef<ScheduleFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { schedule?: VehicleSchedule; default_date?: string; default_start?: string; default_end?: string }
  ) {
    this.form = this.fb.group({
      vehicle: [null, Validators.required],
      schedule_date: [this.data?.default_date || new Date().toISOString().slice(0, 10), Validators.required],
      start_time: [this.data?.default_start || '08:00', Validators.required],
      end_time: [this.data?.default_end || '12:00', Validators.required],
      task: ['', Validators.required],
      status: [VehicleStatus.OPERATING, Validators.required],
    });
  }

  ngOnInit(): void {
    this.api.operatingVehicles().subscribe(v => this.vehicles = v);
    if (this.data?.schedule) {
      const s = this.data.schedule;
      this.form.patchValue({
        vehicle: s.vehicle,
        schedule_date: s.schedule_date,
        start_time: s.start_time,
        end_time: s.end_time,
        task: s.task,
        status: s.status,
      });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    v.schedule_date = typeof v.schedule_date === 'object' ? v.schedule_date.toISOString().slice(0, 10) : v.schedule_date;
    const req = this.data?.schedule
      ? this.api.updateSchedule(this.data.schedule.id, v)
      : this.api.createSchedule(v);
    req.subscribe({
      next: (s) => { this.snack.open('保存成功', '确定', { duration: 2000 }); this.saved.emit(s); this.dialogRef.close(s); },
      error: (e) => this.snack.open(e.error?.detail || e.error?.message || '保存失败', '确定', { duration: 3000 }),
    });
  }
}
