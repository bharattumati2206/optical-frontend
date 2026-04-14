import apiClient from './apiClient'

export const orderService = {
  createOrder: async (payload) => {
    const response = await apiClient.post('/orders', payload)
    return response.data
  },

  getOrderById: async (orderId) => {
    const response = await apiClient.get(`/orders/${orderId}`)
    return response.data
  },

  getOrders: async (params = {}) => {
    const response = await apiClient.get('/orders', { params })
    return response.data
  },

  updatePayment: async (orderId, payload) => {
    const response = await apiClient.patch(`/orders/${orderId}/payment`, payload)
    return response.data
  },

  updateOrderStatus: async (orderId, payload) => {
    const response = await apiClient.patch(`/orders/${orderId}/status`, payload)
    return response.data
  },
}
