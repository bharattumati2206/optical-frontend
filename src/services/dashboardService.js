import apiClient from './apiClient'

export const dashboardService = {
  getOverview: async (params = {}) => {
    const response = await apiClient.get('/dashboard/overview', { params })
    return response.data
  },
}
