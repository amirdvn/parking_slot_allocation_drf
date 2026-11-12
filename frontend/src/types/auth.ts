// src/types/auth.ts

export type UserRole = 'USER' | 'GUARD' | 'MANAGER';
export type UserDepartment = 'MANAGEMENT' | 'ADMINISTRATIVE' | 'WORKERS';

export interface UserProfile {
  email: string;
  phone_number: string;
  full_name: string;
  department: UserDepartment;
  role: UserRole;
  description?: string;
  is_superuser: boolean;
  can_manage_users: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface VerifyOtpResponse {
  is_registered: boolean;
  tokens?: AuthTokens;
}

export interface LoginCredentials {
  phone_number: string;
  code: string;
}

export type Department = "MANAGEMENT" | "ADMINISTRATIVE" | "WORKERS";

export interface RegisterPayload {
  email: string;
  phone_number: string;
  full_name: string;
  // department و role حذف شدند
}