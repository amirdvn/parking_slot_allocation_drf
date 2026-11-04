// src/types/parking.ts
import type { Vehicle } from "./vehicle";

export type RequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELED"
  | "EXPIRED"
  | "IN_USE"
  | "COMPLETED"
  | "NEEDS_REVIEW";

export interface ParkingSpace {
  id: string;
  code: string;
  zone: string;
  floor: string;
  space_type: string;
  is_active: boolean;
}

export interface ParkingRequest {
  id: number;
  vehicle: number;
  parking_space: string;
  start_time: string;
  end_time: string;
  status: RequestStatus;
  description?: string;
  cancellation_reason?: string;
  created_date: string;
  updated_date: string;
}

export interface CreateRequestPayload {
  vehicle: number;
  parking_space: string;
  start_time: string;
  end_time: string;
  description?: string;
}

export interface ParkingSpace {
  id: string; // UUID
  code: string;
  zone: "NORTH" | "SOUTH" | "WEST" | "EAST";
  floor: "GROUND" | "FLOOR_1" | "FLOOR_2" | "BASEMENT_1" | "BASEMENT_2";
  space_type: "NORMAL" | "GUEST" | "MANAGERS" | "DISABLED" | "MOTORCYCLE" | "ELECTRIC" | "LOADING" | "EMERGENCY";
  is_active: boolean;
  requires_permission: boolean;
  description?: string;
}

export interface ParkingSpacePayload {
  zone: string;
  floor: string;
  space_type: string;
  description?: string;
  is_active?: boolean;
}
export interface GuestRequestPayload {
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  guest_plate_number: string;
  parking_space: string;
  start_time: string;
  end_time: string;
  reason: string;
  description?: string;
}