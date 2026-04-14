import apiClient from './apiClient'

export const invoiceService = {
  createInvoice: async (payload) => {
    const response = await apiClient.post('/invoices', payload)
    return response.data
  },

  getInvoiceById: async (invoiceId) => {
    const response = await apiClient.get(`/invoices/${invoiceId}`)
    return response.data
  },

  getInvoices: async (params = {}) => {
    const response = await apiClient.get('/invoices', { params })
    return response.data
  },

  updatePayment: async (invoiceId, payload) => {
    const response = await apiClient.patch(`/invoices/${invoiceId}/payment`, payload)
    return response.data
  },

  updateDelivery: async (invoiceId, payload) => {
    const response = await apiClient.patch(`/invoices/${invoiceId}/delivery`, payload)
    return response.data
  },
}
