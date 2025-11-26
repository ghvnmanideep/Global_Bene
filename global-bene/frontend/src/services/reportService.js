import axios from '../utils/axiosinstance';

const reportService = {
  // Create a new report
  createReport: async (targetType, targetId, reason) => {
    const response = await axios.post('/reports', {
      targetType,
      targetId,
      reason
    });
    return response;
  },

  // Get all reports (admin only)
  getReports: async (params = {}) => {
    const response = await axios.get('/reports', { params });
    return response;
  },

  // Update report status (admin only)
  updateReportStatus: async (reportId, status, handledBy = null) => {
    const response = await axios.put(`/reports/${reportId}/status`, {
      status,
      handledBy
    });
    return response;
  },

  // Delete a report (admin only)
  deleteReport: async (reportId) => {
    const response = await axios.delete(`/reports/${reportId}`);
    return response;
  },

  // Get report statistics (admin only)
  getReportStats: async () => {
    const response = await axios.get('/reports/stats/overview');
    return response;
  }
};

export { reportService };