import { requestApi } from "./api";

export const notificationService = {
    async getNotifications(params = {}) {
        const response = await requestApi.get("/api/notifications", { params });
        return response.data.data;
    },

    async getUnreadCount() {
        const response = await requestApi.get("/api/notifications/unread-count");
        return response.data.count || 0;
    },

    async markAsRead(id) {
        const response = await requestApi.patch(`/api/notifications/${id}/read`);
        return response.data;
    },

    async markAllAsRead() {
        const response = await requestApi.patch("/api/notifications/read-all");
        return response.data;
    }
};

export default notificationService;
