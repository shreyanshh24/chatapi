// src/api.js
import axios from "axios";

/**
 * Build a stable API base URL:
 * If REACT_APP_API_URL is set (e.g. http://localhost:5000), use that.
 * Otherwise default to http://localhost:5000.
 * Always append "/api" and remove any duplicate slashes.
 */
const RAW_API_HOST = process.env.REACT_APP_API_URL || "http://localhost:5000";
const API_HOST = RAW_API_HOST.replace(/\/+$/, ""); // remove trailing slash
export const API_BASE = `${API_HOST}/api`;

const api = axios.create({
  baseURL: API_BASE,
  // optional: increase timeout for slow requests
  timeout: 15000,
});

// Attach token automatically on each request (reads localStorage)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// Optionally helpful response interceptor for logging errors (you can remove in prod)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Useful debug: log a concise, readable error to console
    if (err?.response) {
      console.error(
        `API error ${err.response.status} ${err.config?.method?.toUpperCase() || ""} ${err.config?.url}`,
        err.response.data
      );
    } else {
      console.error("API network/unknown error", err.message || err);
    }
    return Promise.reject(err);
  }
);

/**
 * Helper to set/clear token programmatically.
 * Call setAuthToken(token) after login; setAuthToken(null) to clear.
 */
export function setAuthToken(token) {
  if (token) {
    localStorage.setItem("token", token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem("token");
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;
