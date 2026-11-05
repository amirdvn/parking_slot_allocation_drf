export type BlockReason =
  | "REPAIR"
  | "EVENT"
  | "CLEANING"
  | "VIP_RESERVE"
  | "EQUIPMENT_FAILURE"
  | "OTHER";

export interface ParkingBlock {
  id: number;
  parking_space: string;
  start_time: string;
  end_time: string;
  reason: BlockReason;
  description?: string;
  created_by: number;
  created_date: string;
}

export interface CreateBlockPayload {
  parking_space: string;
  start_time: string;
  end_time: string;
  reason: BlockReason;
  description?: string;
}