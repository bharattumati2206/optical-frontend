import apiClient from './apiClient'

export const storeService = {
  getStores: async () => {
    const response = await apiClient.get('/stores')
    return response.data
  },
}
