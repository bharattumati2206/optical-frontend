import apiClient from './apiClient'

export const customerService = {
  createCustomer: async (payload) => {
    const response = await apiClient.post('/customers', payload)
    return response.data
  },

  getCustomerById: async (customerId) => {
    const response = await apiClient.get(`/customers/${customerId}`)
    return response.data
  },

  getCustomers: async (params = {}) => {
    const response = await apiClient.get('/customers', { params })
    return response.data
  },
}
