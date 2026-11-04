import type { RequestStatus } from "./parking";

export interface ManagerParkingRequest {
  id: number;
  user_detail: {
    id: number;
    full_name: string;
    phone_number: string;
  };
  vehicle_detail: {
    id: number;
    plate_number: string;
    vehicle_type: string;
    sub_type: string;
    color: string;
  } | null;
  parking_space_detail: {
    id: string;
    code: string;
    space_type: string;
    zone: string;
    floor: string;
  } | null;
  start_time: string;
  end_time: string;
  status: RequestStatus;
  description?: string;
  rejection_reason?: string;
  cancellation_reason?: string;
  created_date: string;
}
export interface ManagerUser {
  id: number;
  phone_number: string;
  email: string;
  full_name: string;
  department: string;
  role: string;
  is_active: boolean;
  is_staff: boolean;
  description?: string;
  created_date: string;
  updated_date: string;
}