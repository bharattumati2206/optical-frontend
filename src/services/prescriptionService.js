import apiClient from './apiClient'

export const prescriptionService = {
  createPrescription: async (payload) => {
    const response = await apiClient.post('/prescriptions', payload)
    return response.data
  },

  getCustomerPrescriptions: async (customerId) => {
    const response = await apiClient.get(`/prescriptions/customer/${customerId}`)
    return response.data
  },

  getLatestPrescription: async (customerId) => {
    const response = await apiClient.get(`/prescriptions/customer/${customerId}/latest`)
    return response.data
  },
}
