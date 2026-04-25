import axios from "axios";
import { generateUUID } from "./utils";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { env } from "./env";

const BASE_URL = env.appUrl || "";

export const mdwClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

mdwClient.interceptors.request.use(
  async (config) => {
    const traceId = generateUUID();
    config.headers["X-Trace-Id"] = traceId;
    
    // Cookies are automatically sent to /api endpoints due to withCredentials: true.
    // The Next.js API Routes (ServerBackend) will read the HttpOnly cookie
    // and attach the Authorization header to the actual backend request.
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

mdwClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if this is an authentication-related request
    const isAuthRequest = originalRequest.url?.includes("/auth/login") || 
                         originalRequest.url?.includes("/auth/refresh") ||
                         originalRequest.url?.includes("/auth/register");

    // If error is 401, we haven't retried yet, and it's NOT an auth request
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;
      
      try {
        // Refresh token is managed via HttpOnly cookie.
        const res = await axios.post(`${BASE_URL}/api/auth/refresh`, {}, { withCredentials: true });

        if (res.data.success) {
          const { user } = res.data.data;
          if (user) {
            useAuthStore.getState().setAuth(user);
          }
          // The new HttpOnly cookie is now set. Retry the original request.
          // Since it goes to /api, it will automatically include the new cookie.
          return mdwClient(originalRequest);
        }
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default mdwClient;
