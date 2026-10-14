import { donationApi } from "./api";

export const authService = {
    async register(userData) {
        const response = await donationApi.post("/api/auth/register", userData);
        if (response.data.token) {
            localStorage.setItem("foodrescue_token", response.data.token);
            localStorage.setItem("foodrescue_user", JSON.stringify(response.data.user));
        }
        return response.data;
    },

    async login(credentials) {
        const response = await donationApi.post("/api/auth/login", credentials);
        if (response.data.token) {
            localStorage.setItem("foodrescue_token", response.data.token);
            localStorage.setItem("foodrescue_user", JSON.stringify(response.data.user));
        }
        return response.data;
    },

    async getMe() {
        const response = await donationApi.get("/api/auth/me");
        if (response.data.user) {
            localStorage.setItem("foodrescue_user", JSON.stringify(response.data.user));
        }
        return response.data.user;
    },

    async updateProfile(profileData) {
        const response = await donationApi.put("/api/auth/profile", profileData);
        if (response.data.token) {
            localStorage.setItem("foodrescue_token", response.data.token);
        }
        if (response.data.user) {
            localStorage.setItem("foodrescue_user", JSON.stringify(response.data.user));
        }
        return response.data;
    },

    logout() {
        localStorage.removeItem("foodrescue_token");
        localStorage.removeItem("foodrescue_user");
    },

    getCurrentUser() {
        try {
            const raw = localStorage.getItem("foodrescue_user");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },

    getToken() {
        return localStorage.getItem("foodrescue_token");
    }
};

export default authService;
