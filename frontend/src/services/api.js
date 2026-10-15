import axios from "axios";

const sanitizeApiUrl = (url, defaultUrl) => {
    const raw = (url || defaultUrl || "").trim();
    return raw.replace(/\/+$/, "").replace(/\/api$/, "");
};

const DONATION_BASE_URL = sanitizeApiUrl(import.meta.env.VITE_DONATION_API_URL, "http://localhost:5001");
const REQUEST_BASE_URL = sanitizeApiUrl(import.meta.env.VITE_REQUEST_API_URL, "http://localhost:5002");

// Instance for Food Donation Service (port 5001) - 30s timeout handles Render free-tier wakeups
export const donationApi = axios.create({
    baseURL: DONATION_BASE_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json"
    }
});

// Instance for Food Request & Matching Service (port 5002) - 30s timeout handles Render free-tier wakeups
export const requestApi = axios.create({
    baseURL: REQUEST_BASE_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json"
    }
});

// Helper to set auth token header
const attachAuthInterceptor = (apiInstance, serviceName) => {
    apiInstance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem("foodrescue_token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            config.metadata = { startTime: new Date() };
            return config;
        },
        (error) => Promise.reject(error)
    );

    apiInstance.interceptors.response.use(
        (response) => {
            const duration = new Date() - response.config.metadata.startTime;
            response.durationMs = duration;
            return response;
        },
        (error) => {
            if (error.response && error.response.status === 401) {
                // If unauthorized and token is invalid, clear token
                if (localStorage.getItem("foodrescue_token")) {
                    console.warn(`[${serviceName}] 401 Unauthorized - clearing token`);
                }
            }
            return Promise.reject(error);
        }
    );
};

attachAuthInterceptor(donationApi, "Food-Donation-svc");
attachAuthInterceptor(requestApi, "Food-Request-svc");

export default { donationApi, requestApi };
