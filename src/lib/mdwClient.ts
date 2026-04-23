import axios from "axios";
import { generateUUID } from "./utils";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const mdwClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

mdwClient.interceptors.request.use(
  async (config) => {
    const traceId = generateUUID();
    config.headers["X-Trace-Id"] = traceId;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

mdwClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handling can be added here (e.g. SweetAlert)
    return Promise.reject(error);
  }
);

export default mdwClient;
