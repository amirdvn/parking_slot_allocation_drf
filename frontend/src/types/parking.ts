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