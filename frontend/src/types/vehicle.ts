// src/types/vehicle.ts
export type VehicleType = "CAR" | "MOTORCYCLE" | "BICYCLE";
export type SubType = "PASSENGER" | "CARGO" | "ELECTRIC" | "DISABLED";
export type ColorType = "RED" | "BLUE" | "GREEN" | "BLACK" | "WHITE" | "YELLOW" | "ORANGE" | "PURPLE" | "BROWN" | "GRAY";

export interface Vehicle {
  id: number;
  plate_number: string;
  vehicle_type: VehicleType;
  sub_type: SubType;
  color: ColorType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehiclePayload {
  plate_number: string;
  vehicle_type: VehicleType;
  sub_type: SubType;
  color: ColorType;
}


export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}