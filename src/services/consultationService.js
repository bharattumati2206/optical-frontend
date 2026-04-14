import apiClient from './apiClient'

export const consultationService = {
  createConsultation: async (payload) => {
    const response = await apiClient.post('/consultations', payload)
    return response.data
  },

  getConsultations: async (params = {}) => {
    const response = await apiClient.get('/consultations', { params })
    return response.data
  },

  getConsultationsByCustomer: async (customerId) => {
    const response = await apiClient.get(`/consultations/customer/${customerId}`)
    return response.data
  },
}
