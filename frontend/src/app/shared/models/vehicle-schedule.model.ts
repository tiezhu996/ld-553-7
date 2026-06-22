import { VehicleStatus } from '../constants/enums';
import { Vehicle } from './vehicle.model';

export interface VehicleSchedule {
  id: number;
  vehicle: number;
  vehicle_detail?: Vehicle;
  schedule_date: string;
  start_time: string;
  end_time: string;
  task: string;
  status: VehicleStatus;
  created_at?: string;
  updated_at?: string;
}
