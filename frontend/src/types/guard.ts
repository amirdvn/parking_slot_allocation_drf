// src/types/guard.ts
import type { ParkingRequest } from "./parking";

export interface EntryExitLog {
  id: number;
  parking_request: number | null;
  parking_request_detail: {
    id: number;
    parking_space: string;
    start_time: string;
    end_time: string;
    status: string;
  } | null;
  vehicle: number;
  vehicle_detail: {
    id: number;
    plate_number: string;
    vehicle_type: string;
    color: string;
  } | null;
  entry_time: string;
  exit_time: string | null;
  guard_detail: {
    id: number;
    full_name: string;
    phone_number: string;
  } | null;
  description?: string;
}
export interface GuardDashboardData {
  parking_spaces: {
    total: number;
    occupied: number;
    blocked: number;
    available: number;
  };
  vehicles: {
    in_use: number;
  };
  requests: {
    approved: number;
  };
}