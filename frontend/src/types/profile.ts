export interface ProfileUpdatePayload {
  full_name?: string;
  description?: string;
}

export interface ChangePhonePayload {
  phone_number: string;
}

export interface VerifyChangePhonePayload {
  phone_number: string;
  code: number;
}