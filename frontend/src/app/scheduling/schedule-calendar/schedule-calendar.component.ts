import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VehicleSchedule } from '../../shared/models/vehicle-schedule.model';
import { Vehicle } from '../../shared/models/vehicle.model';
import { ApiService } from '../../shared/services/api.service';
import { ScheduleFormComponent } from '../schedule-form/schedule-form.component';

interface DaySlot {
  date: string;
  label: string;
  weekday: string;
  isToday: boolean;
  schedules: VehicleSchedule[];
}

@Component({ standalone: false,
  selector: 'app-schedule-calendar',
  template: `<section class="page">
  <div class="page-head">
    <h1>车辆排班管理</h1>
    <div class="actions">
      <button mat-icon-button (click)="navigate(-1)"><mat-icon>chevron_left</mat-icon></button>
      <span class="week-label">{{ weekLabel }}</span>
      <button mat-icon-button (click)="navigate(1)"><mat-icon>chevron_right</mat-icon></button>
      <button mat-stroked-button (click)="goToday()" style="margin-left:8px">今天</button>
      <button mat-flat-button color="primary" (click)="openForm()" style="margin-left:8px" *appHasRole="['OPERATOR','ADMIN']">
        <mat-icon style="margin-right:4px">add</mat-icon>新增排班
      </button>
    </div>
  </div>
  <div class="filter">
    <mat-form-field appearance="outline" style="width:240px">
      <mat-label>筛选车辆</mat-label>
      <mat-select [(ngModel)]="filterVehicleId" (selectionChange)="renderWeek()">
        <mat-option value="">全部运营车辆</mat-option>
        <mat-option *ngFor="let v of vehicles" [value]="v.id">{{ v.plate_number }} - {{ v.brand }} {{ v.model }}</mat-option>
      </mat-select>
    </mat-form-field>
    <div class="legend">
      <span class="legend-title">状态：</span>
      <span class="lg lg-op">运营中</span>
      <span class="lg lg-mt">维修中</span>
      <span class="lg lg-ds">停用</span>
      <span class="lg lg-pd">待审核</span>
    </div>
  </div>
  <div class="week-grid">
    <div class="hour-header">
      <div class="hh-title">时段</div>
      <div class="hh-cell" *ngFor="let h of hours">{{ h }}:00</div>
    </div>
    <div class="day-col" *ngFor="let day of weekDays" [class.today]="day.isToday">
      <div class="day-head">
        <div class="dw">{{ day.weekday }}</div>
        <div class="dd" [class.today-num]="day.isToday">{{ day.label }}</div>
        <button mat-icon-button class="add-btn" (click)="openForm(day.date)" *appHasRole="['OPERATOR','ADMIN']" matTooltip="添加该日排班">
          <mat-icon style="font-size:16px">add</mat-icon>
        </button>
      </div>
      <div class="day-body" (click)="handleDayClick(day.date, $event)" #dayBody>
        <div class="grid-lines">
          <div class="gl" *ngFor="let h of hours"></div>
        </div>
        <div
          *ngFor="let s of day.schedules"
          class="sch-item"
          [class]="'sch-' + s.status.toLowerCase()"
          [style.top]="getTop(s.start_time) + 'px'"
          [style.height]="getHeight(s.start_time, s.end_time) + 'px'"
          (click)="$event.stopPropagation(); openForm(day.date, s)"
          [matTooltip]="s.vehicle_detail?.plate_number + ' ' + s.start_time + '-' + s.end_time + ': ' + s.task"
        >
          <div class="sch-plate">{{ s.vehicle_detail?.plate_number || '#' + s.vehicle }}</div>
          <div class="sch-time">{{ s.start_time.slice(0,5) }} - {{ s.end_time.slice(0,5) }}</div>
          <div class="sch-task">{{ s.task }}</div>
          <button mat-icon-button class="sch-del" (click)="$event.stopPropagation(); deleteSchedule(s)" *appHasRole="['OPERATOR','ADMIN']" matTooltip="删除">
            <mat-icon style="font-size:14px">close</mat-icon>
          </button>
        </div>
      </div>
    </div>
  </div>
</section>`,
  styles: [`
.page{padding:18px 24px}
.page-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.page-head h1{margin:0;font-size:22px}
.actions{display:flex;align-items:center;gap:4px}
.week-label{font-size:15px;font-weight:600;padding:0 10px;min-width:220px;text-align:center}
.filter{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:16px;flex-wrap:wrap}
.legend{display:flex;align-items:center;gap:10px;font-size:13px;color:#555}
.legend-title{color:#888}
.lg{padding:3px 10px;border-radius:4px;color:#fff;font-size:12px}
.lg-op{background:#0e7c59}.lg-mt{background:#d97706}.lg-ds{background:#6b7280}.lg-pd{background:#2563eb}
.week-grid{display:grid;grid-template-columns:80px repeat(7,1fr);gap:0;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;background:#fff}
.hour-header{background:#f8fafc;border-right:1px solid #e5e7eb}
.hh-title{height:72px;display:flex;align-items:center;justify-content:center;font-weight:600;color:#475569;border-bottom:1px solid #e5e7eb}
.hh-cell{height:60px;display:flex;align-items:flex-start;justify-content:center;padding-top:4px;font-size:12px;color:#94a3b8;border-bottom:1px solid #f1f5f9}
.day-col{border-right:1px solid #e5e7eb;min-width:0}
.day-col:last-child{border-right:none}
.day-col.today{background:#f0fdf4}
.day-head{height:72px;display:flex;align-items:center;justify-content:center;gap:6px;border-bottom:1px solid #e5e7eb;background:#f8fafc;position:relative}
.dw{font-size:13px;color:#64748b}
.dd{font-size:18px;font-weight:600;color:#1e293b}
.dd.today-num{color:#0e7c59;background:#bbf7d0;padding:2px 8px;border-radius:50%}
.add-btn{position:absolute;right:4px;top:4px;width:28px;height:28px}
.add-btn .mat-mdc-icon-button{--mdc-icon-button-icon-size:16px}
.day-body{position:relative}
.grid-lines{position:absolute;inset:0}
.gl{height:60px;border-bottom:1px solid #f1f5f9}
.sch-item{position:absolute;left:4px;right:4px;border-radius:6px;padding:6px 8px;overflow:hidden;cursor:pointer;border:1px solid transparent;transition:transform .15s;box-shadow:0 1px 3px rgba(0,0,0,.1)}
.sch-item:hover{transform:translateY(-1px);box-shadow:0 4px 10px rgba(0,0,0,.15);z-index:5}
.sch-operating{background:#dcfce7;border-color:#86efac;color:#065f46}
.sch-maintenance{background:#fef3c7;border-color:#fcd34d;color:#92400e}
.sch-disabled{background:#f1f5f9;border-color:#cbd5e1;color:#334155}
.sch-pending{background:#dbeafe;border-color:#93c5fd;color:#1e40af}
.sch-plate{font-weight:600;font-size:12px;margin-bottom:2px}
.sch-time{font-size:11px;opacity:.85;margin-bottom:2px}
.sch-task{font-size:11px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sch-del{position:absolute;top:2px;right:2px;width:20px;height:20px;padding:0;opacity:.6}
.sch-del:hover{opacity:1}
`]
})
export class ScheduleCalendarComponent implements OnInit {
  weekDays: DaySlot[] = [];
  weekStart = new Date();
  schedules: VehicleSchedule[] = [];
  vehicles: Vehicle[] = [];
  filterVehicleId: number | string = '';
  hours = Array.from({ length: 14 }, (_, i) => i + 7);
  HOUR_HEIGHT = 60;

  constructor(private api: ApiService, private dialog: MatDialog, private snack: MatSnackBar) {}

  ngOnInit(): void {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    this.weekStart = d;
    this.api.operatingVehicles().subscribe(v => this.vehicles = v);
    this.loadWeek();
  }

  get weekLabel(): string {
    const s = this.formatDate(this.weekStart);
    const e = new Date(this.weekStart); e.setDate(e.getDate() + 6);
    return `${s} ~ ${this.formatDate(e)}`;
  }

  formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  navigate(delta: number): void {
    this.weekStart.setDate(this.weekStart.getDate() + delta * 7);
    this.loadWeek();
  }

  goToday(): void {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    this.weekStart = d;
    this.loadWeek();
  }

  loadWeek(): void {
    const dateStr = this.formatDate(this.weekStart);
    this.api.weeklySchedules(dateStr).subscribe({
      next: (s) => { this.schedules = s; this.renderWeek(); },
      error: () => { this.schedules = []; this.renderWeek(); }
    });
  }

  renderWeek(): void {
    const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const todayStr = this.formatDate(new Date());
    this.weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(this.weekStart);
      d.setDate(d.getDate() + i);
      const ds = this.formatDate(d);
      const filtered = this.schedules.filter(s => s.schedule_date === ds && (!this.filterVehicleId || s.vehicle === Number(this.filterVehicleId)));
      return {
        date: ds,
        label: String(d.getDate()),
        weekday: weekdays[i],
        isToday: ds === todayStr,
        schedules: filtered.sort((a, b) => a.start_time.localeCompare(b.start_time)),
      };
    });
  }

  getTop(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    const startHour = this.hours[0];
    return (h - startHour) * this.HOUR_HEIGHT + (m / 60) * this.HOUR_HEIGHT + 2;
  }

  getHeight(start: string, end: string): number {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const mins = (eh - sh) * 60 + (em - sm);
    return Math.max(34, (mins / 60) * this.HOUR_HEIGHT - 4);
  }

  handleDayClick(date: string, e: MouseEvent): void {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const startHour = this.hours[0];
    const hourIdx = Math.floor(y / this.HOUR_HEIGHT);
    const hour = startHour + hourIdx;
    const defaultStart = `${String(hour).padStart(2, '0')}:00`;
    const defaultEnd = `${String(Math.min(hour + 2, this.hours[this.hours.length - 1] + 1)).padStart(2, '0')}:00`;
    this.openForm(date, undefined, defaultStart, defaultEnd);
  }

  openForm(default_date?: string, schedule?: VehicleSchedule, default_start?: string, default_end?: string): void {
    const d = this.dialog.open(ScheduleFormComponent, {
      width: '520px',
      data: { schedule, default_date: default_date || this.formatDate(new Date()), default_start, default_end },
      panelClass: 'sch-dialog'
    });
    d.componentInstance.saved.subscribe(() => this.loadWeek());
  }

  deleteSchedule(s: VehicleSchedule): void {
    if (!confirm(`确定删除 ${s.vehicle_detail?.plate_number || '车辆'} 的排班吗？`)) return;
    this.api.deleteSchedule(s.id).subscribe({
      next: () => { this.snack.open('删除成功', '确定', { duration: 2000 }); this.loadWeek(); },
      error: (e) => this.snack.open(e.error?.detail || '删除失败', '确定', { duration: 3000 })
    });
  }
}
