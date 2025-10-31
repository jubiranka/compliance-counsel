// src/api/api.ts
import axios from "axios";

/** ✅ Unified Base URL (resolves properly from .env.local) */
const baseURL = import.meta.env.VITE_API_BASE || "http://localhost:8000";

console.log("🔗 Backend Base URL:", baseURL); // 👈 TEMP: debug log

const api = axios.create({
  baseURL,
  timeout: 120000,
  headers: { "Content-Type": "application/json" },
});

// ✅ Attach token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Graceful error logging
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("[API ERROR]", err?.message, err?.config?.url);
    const detail =
      err?.response?.data?.detail ||
      err?.message ||
      "Unexpected network/server error";
    return Promise.reject(new Error(detail));
  }
);

export default api;
