import apiClient from './apiClient'

export async function loginUser(payload) {
  const { data } = await apiClient.post('/login', payload)

  return {
    token: data.token,
    user: {
      userId: data.userId,
      username: data.username,
      name: data.name,
      storeId: data.storeId,
      role: data.role,
    },
  }
}
