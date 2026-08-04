import api from './api'

export async function getOrders(params = {}) {
  const response = await api.get('/orders', {
    params,
  })

  return response.data
}

export async function getOrderById(id) {
  const response = await api.get(`/orders/${id}`)

  return response.data
}

export async function createOrder(payload) {
  const response = await api.post('/orders', payload)

  return response.data
}

export async function updateOrder(id, payload) {
  const response = await api.put(`/orders/${id}`, payload)

  return response.data
}

export async function updateOrderStatus(id, status) {
  const response = await api.patch(`/orders/${id}/status`, {
    status,
  })

  return response.data
}

export async function deleteOrder(id) {
  const response = await api.delete(`/orders/${id}`)

  return response.data
}
