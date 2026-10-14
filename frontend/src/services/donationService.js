import { donationApi } from "./api";

export const donationService = {
    async getHealth() {
        const start = performance.now();
        const response = await donationApi.get("/health");
        const latency = Math.round(performance.now() - start);
        return { ...response.data, latencyMs: latency };
    },

    async getStats() {
        const response = await donationApi.get("/api/donations/stats");
        return response.data.data;
    },

    async getDonations(params = {}) {
        const response = await donationApi.get("/api/donations", { params });
        return response.data.data;
    },

    async getAvailableDonations() {
        const response = await donationApi.get("/api/donations/available");
        return response.data.data;
    },

    async getDonationById(id) {
        const response = await donationApi.get(`/api/donations/${id}`);
        return response.data.data;
    },

    async createDonation(data) {
        const response = await donationApi.post("/api/donations", data);
        return response.data;
    },

    async updateDonation(id, data) {
        const response = await donationApi.put(`/api/donations/${id}`, data);
        return response.data;
    },

    async deleteDonation(id) {
        const response = await donationApi.delete(`/api/donations/${id}`);
        return response.data;
    },

    async reserveDonation(id, requestId) {
        const response = await donationApi.patch(`/api/donations/${id}/reserve`, { requestId });
        return response.data;
    },

    async releaseDonation(id) {
        const response = await donationApi.patch(`/api/donations/${id}/release`);
        return response.data;
    },

    async collectDonation(id) {
        const response = await donationApi.patch(`/api/donations/${id}/collect`);
        return response.data;
    }
};

export default donationService;
