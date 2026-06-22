import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChargingPile } from '../models/charging-pile.model';
import { DashboardOverview } from '../models/dashboard.model';
import { MaintenanceRecord } from '../models/maintenance-record.model';
import { TripOrder } from '../models/trip-order.model';
import { Vehicle } from '../models/vehicle.model';
import { VehicleSchedule } from '../models/vehicle-schedule.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}
  listVehicles(filters: Record<string, string> = {}): Observable<Vehicle[]> { return this.http.get<Vehicle[]>(`${environment.apiBaseUrl}/vehicles/`, { params: new HttpParams({ fromObject: filters }) }); }
  vehicleLocations(): Observable<Vehicle[]> { return this.http.get<Vehicle[]>(`${environment.apiBaseUrl}/vehicles/locations/`); }
  vehicleMaintenance(id: number): Observable<MaintenanceRecord[]> { return this.http.get<MaintenanceRecord[]>(`${environment.apiBaseUrl}/vehicles/${id}/maintenance-records/`); }
  createVehicle(data: Partial<Vehicle>): Observable<Vehicle> { return this.http.post<Vehicle>(`${environment.apiBaseUrl}/vehicles/`, data); }
  patchVehicle(id: number, data: Partial<Vehicle>): Observable<Vehicle> { return this.http.patch<Vehicle>(`${environment.apiBaseUrl}/vehicles/${id}/`, data); }
  listPiles(filters: Record<string, string> = {}): Observable<ChargingPile[]> { return this.http.get<ChargingPile[]>(`${environment.apiBaseUrl}/charging-piles/`, { params: new HttpParams({ fromObject: filters }) }); }
  pileLocations(): Observable<ChargingPile[]> { return this.http.get<ChargingPile[]>(`${environment.apiBaseUrl}/charging-piles/locations/`); }
  patchPileStatus(id: number, status: string): Observable<ChargingPile> { return this.http.patch<ChargingPile>(`${environment.apiBaseUrl}/charging-piles/${id}/status/`, { status }); }
  listOrders(filters: Record<string, string> = {}): Observable<TripOrder[]> { return this.http.get<TripOrder[]>(`${environment.apiBaseUrl}/orders/`, { params: new HttpParams({ fromObject: filters }) }); }
  patchOrderStatus(id: number, status: string): Observable<TripOrder> { return this.http.patch<TripOrder>(`${environment.apiBaseUrl}/orders/${id}/status/`, { status }); }
  dashboardOverview(): Observable<DashboardOverview> { return this.http.get<DashboardOverview>(`${environment.apiBaseUrl}/dashboard/overview/`); }
  orderTrend(): Observable<Array<{ day: string; count: number }>> { return this.http.get<Array<{ day: string; count: number }>>(`${environment.apiBaseUrl}/dashboard/order-trend/`); }
  revenueStats(): Observable<any> { return this.http.get(`${environment.apiBaseUrl}/dashboard/revenue-stats/`); }

  listSchedules(filters: Record<string, string> = {}): Observable<VehicleSchedule[]> { return this.http.get<VehicleSchedule[]>(`${environment.apiBaseUrl}/schedules/`, { params: new HttpParams({ fromObject: filters }) }); }
  weeklySchedules(date?: string): Observable<VehicleSchedule[]> {
    const params = date ? new HttpParams({ fromObject: { date } }) : new HttpParams();
    return this.http.get<VehicleSchedule[]>(`${environment.apiBaseUrl}/schedules/weekly/`, { params });
  }
  getSchedule(id: number): Observable<VehicleSchedule> { return this.http.get<VehicleSchedule>(`${environment.apiBaseUrl}/schedules/${id}/`); }
  createSchedule(data: Partial<VehicleSchedule>): Observable<VehicleSchedule> { return this.http.post<VehicleSchedule>(`${environment.apiBaseUrl}/schedules/`, data); }
  updateSchedule(id: number, data: Partial<VehicleSchedule>): Observable<VehicleSchedule> { return this.http.put<VehicleSchedule>(`${environment.apiBaseUrl}/schedules/${id}/`, data); }
  patchSchedule(id: number, data: Partial<VehicleSchedule>): Observable<VehicleSchedule> { return this.http.patch<VehicleSchedule>(`${environment.apiBaseUrl}/schedules/${id}/`, data); }
  deleteSchedule(id: number): Observable<void> { return this.http.delete<void>(`${environment.apiBaseUrl}/schedules/${id}/`); }
  todayScheduleCount(): Observable<{ date: string; scheduled_vehicles: number }> { return this.http.get<{ date: string; scheduled_vehicles: number }>(`${environment.apiBaseUrl}/schedules/today-count/`); }
  operatingVehicles(): Observable<Vehicle[]> { return this.http.get<Vehicle[]>(`${environment.apiBaseUrl}/schedules/operating-vehicles/`); }
}
