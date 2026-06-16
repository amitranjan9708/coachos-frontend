import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const TOKEN_KEY = "coachos_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

export const apiState = {
  activeRequests: 0,
  listeners: [],
  subscribe(fn) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn) };
  },
  notify() {
    const isLoading = this.activeRequests > 0;
    this.listeners.forEach(fn => fn(isLoading));
    if (isLoading) {
      document.body.classList.add("is-api-loading");
    } else {
      document.body.classList.remove("is-api-loading");
    }
  }
};

const api = axios.create({
  baseURL: API,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  apiState.activeRequests++;
  apiState.notify();
  return config;
});

api.interceptors.response.use(
  (r) => {
    apiState.activeRequests--;
    if (apiState.activeRequests < 0) apiState.activeRequests = 0;
    apiState.notify();
    return r;
  },
  (err) => {
    apiState.activeRequests--;
    if (apiState.activeRequests < 0) apiState.activeRequests = 0;
    apiState.notify();
    
    if (err.response?.status === 401 && window.location.pathname !== "/login" && window.location.pathname !== "/register") {
      setToken(null);
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export default api;
