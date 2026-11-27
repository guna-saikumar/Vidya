import { adminApiClient } from './adminApiClient';

const ADMIN_TOKEN_KEY = 'vidya_admin_token';
const DEFAULT_TOKEN = 'vidya-admin-secret';

export const getStoredAdminToken = () =>
  localStorage.getItem(ADMIN_TOKEN_KEY) || DEFAULT_TOKEN;

export const adminService = {
  // ---- Auth ----
  async login({ email, password }) {
    const res = await adminApiClient.post('/api/v1/admin/auth/login', { email, password });
    return res.data;
  },

  async getMe() {
    const res = await adminApiClient.get('/api/v1/admin/auth/me');
    return res.data;
  },

  // ---- Overview / Analytics ----
  async getOverviewStats() {
    const res = await adminApiClient.get('/api/v1/admin/overview');
    return res.data;
  },

  // ---- Books & Study Materials ----
  async getClasses() {
    const res = await adminApiClient.get('/api/v1/admin/classes');
    return res.data;
  },

  async getSubjects(classId) {
    const res = await adminApiClient.get(`/api/v1/admin/classes/${classId}/subjects`);
    return res.data;
  },

  async getStudyMaterials(params = {}) {
    const res = await adminApiClient.get('/api/v1/admin/study-materials', { params });
    return res.data;
  },

  async uploadStudyMaterial(formData, onProgress) {
    const res = await adminApiClient.post('/api/v1/admin/study-materials', formData, {
      onUploadProgress: (evt) => {
        if (evt.total && onProgress) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    });
    return res.data;
  },

  async updateStudyMaterial(id, data) {
    const res = await adminApiClient.patch(`/api/v1/admin/study-materials/${id}`, data);
    return res.data;
  },

  async deleteStudyMaterial(id) {
    const res = await adminApiClient.delete(`/api/v1/admin/study-materials/${id}`);
    return res.data;
  },

  getMaterialViewUrl(id) {
    const token = getStoredAdminToken();
    const base = adminApiClient.defaults.baseURL;
    return `${base}/api/v1/study-materials/${id}/view?token=${encodeURIComponent(token)}`;
  },

  // ---- Broadcast Alerts & Notifications ----
  async getBroadcastNotifications() {
    const res = await adminApiClient.get('/api/v1/admin/notifications');
    return res.data;
  },

  async broadcastNotification(data) {
    const res = await adminApiClient.post('/api/v1/admin/notifications/broadcast', data);
    return res.data;
  },

  async deleteNotification(title) {
    const res = await adminApiClient.delete('/api/v1/admin/notifications', {
      params: { title },
    });
    return res.data;
  },

  // ---- Students Management ----
  async getStudents(params = {}) {
    const res = await adminApiClient.get('/api/v1/admin/students', { params });
    return res.data;
  },

  async getStudentDetails(id) {
    const res = await adminApiClient.get(`/api/v1/admin/students/${id}`);
    return res.data;
  },

  async updateStudent(id, data) {
    const res = await adminApiClient.patch(`/api/v1/admin/students/${id}`, data);
    return res.data;
  },

  async deleteStudent(id) {
    const res = await adminApiClient.delete(`/api/v1/admin/students/${id}`);
    return res.data;
  },

  // ---- Support Complaints ----
  async getComplaints() {
    const res = await adminApiClient.get('/api/v1/support/complaints');
    return res.data;
  },

  async updateComplaintStatus(ticketRef, status) {
    const res = await adminApiClient.patch(
      `/api/v1/support/complaints/${ticketRef}/status`,
      { status }
    );
    return res.data;
  },

  // ---- Learning desk (teacher workflow) ----
  async getLearningOverview() {
    const res = await adminApiClient.get('/api/v1/admin/learning/overview');
    return res.data;
  },

  async getDoubts(status) {
    const res = await adminApiClient.get('/api/v1/admin/learning/doubts', {
      params: status ? { status } : undefined,
    });
    return res.data;
  },

  async updateDoubt(id, status, teacherNote) {
    const res = await adminApiClient.patch(`/api/v1/admin/learning/doubts/${id}`, {
      status,
      teacherNote,
    });
    return res.data;
  },

  async getAssignments() {
    const res = await adminApiClient.get('/api/v1/admin/learning/assignments');
    return res.data;
  },

  async createAssignment(payload) {
    const res = await adminApiClient.post('/api/v1/admin/learning/assignments', payload);
    return res.data;
  },
};
