import { api } from "../../lib/api";
import type { VerifyOtpResponse } from "../../types/auth";

export const authApi = {
  sendOtp: async (phone_number: string) => {
    const response = await api.post("/api/auth/login/send_otp/", { phone_number });
    return response.data;
  },

  verifyOtp: async (phone_number: string, code: string) => {
    const response = await api.post<VerifyOtpResponse>("/api/auth/login/verify_otp/", {
      phone_number,
      code: Number(code),
    });
    return response.data;
  },
};