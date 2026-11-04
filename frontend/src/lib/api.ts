// src/lib/api.ts
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  throw new Error("VITE_API_BASE_URL is not defined");
}

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// اینترسپتور درخواست‌ها
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("access_token");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 👇 لیست صفحات عمومی که نباید به Login ریدایرکت بشن
const PUBLIC_ROUTES = ["/login", "/register", "/verify-otp"];

// اینترسپتور پاسخ‌ها
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          const response = await axios.post(`${baseURL}/api/token/refresh/`, {
            refresh: refreshToken,
          });

          const newAccessToken = response.data.access;
          localStorage.setItem("access_token", newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");

          // 🚀 فقط اگر کاربر توی صفحه عمومی نبود، ریدایرکت کن
          const currentPath = window.location.pathname;
          const isPublicRoute = PUBLIC_ROUTES.some(route => currentPath.startsWith(route));

          if (!isPublicRoute) {
            window.location.href = "/login";
          }
          return Promise.reject(refreshError);
        }
      } else {
        // 🚀 اگر اصلاً refresh_token نداشتیم، فقط توکن‌ها رو پاک کن
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        const currentPath = window.location.pathname;
        const isPublicRoute = PUBLIC_ROUTES.some(route => currentPath.startsWith(route));

        if (!isPublicRoute) {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);