// src/features/profile/api.ts
import { api } from "../../lib/api";
import type { UserProfile } from "../../types/auth";
import type { ProfileUpdatePayload, VerifyChangePhonePayload } from "../../types/profile";

export const profileApi = {
  getProfile: async () => {
    const response = await api.get<UserProfile>("/api/profile/me/");
    return response.data;
  },

  updateProfile: async (data: ProfileUpdatePayload) => {
    const response = await api.patch<UserProfile>("/api/profile/me/update/", data);
    return response.data;
  },

  sendChangePhoneOtp: async (phone_number: string) => {
    const response = await api.post("/api/auth/change_phone/send_otp/", { phone_number });
    return response.data;
  },

  verifyChangePhoneOtp: async (data: VerifyChangePhonePayload) => {
    const response = await api.post<{ message: string; user: UserProfile }>(
      "/api/auth/change_phone/verify_otp/",
      data
    );
    return response.data;
  },
};
