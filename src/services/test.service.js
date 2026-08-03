import api from './api'

export const testBackendConnection = async () => {
  const response = await api.get('/health')

  return response.data
}
