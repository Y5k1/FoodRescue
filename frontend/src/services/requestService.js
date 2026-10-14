import { requestApi } from "./api";

export const requestService = {
    async getHealth() {
        const start = performance.now();
        const response = await requestApi.get("/health");
        const latency = Math.round(performance.now() - start);
        return { ...response.data, latencyMs: latency };
    },

    async getStats() {
        const response = await requestApi.get("/api/requests/stats");
        return response.data.data;
    },

    async getRequests(params = {}) {
        const response = await requestApi.get("/api/requests", { params });
        return response.data.data;
    },

    async getRequestById(id) {
        const response = await requestApi.get(`/api/requests/${id}`);
        return response.data.data;
    },

    async createRequest(data) {
        const response = await requestApi.post("/api/requests", data);
        return response.data;
    },

    async acceptRequest(id, data = {}) {
        const response = await requestApi.post(`/api/requests/${id}/accept`, data);
        return response.data;
    },

    async rejectRequest(id, data = {}) {
        const response = await requestApi.post(`/api/requests/${id}/reject`, data);
        return response.data;
    },

    async fulfillRequest(id) {
        const response = await requestApi.post(`/api/requests/${id}/fulfill`);
        return response.data;
    },

    async cancelRequest(id) {
        const response = await requestApi.post(`/api/requests/${id}/cancel`);
        return response.data;
    },

    async getEventLogs() {
        const response = await requestApi.get("/api/requests/events");
        return response.data.data;
    }
};

export default requestService;
