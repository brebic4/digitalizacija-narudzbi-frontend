import api from './api'

export async function getCustomers(params = {}) {
  const response = await api.get('/customers', {
    params,
  })

  return response.data
}

export async function getCustomerById(id) {
  const response = await api.get(`/customers/${id}`)

  return response.data
}

export async function createCustomer(payload) {
  const response = await api.post('/customers', payload)

  return response.data
}

export async function updateCustomer(id, payload) {
  const response = await api.put(`/customers/${id}`, payload)

  return response.data
}

export async function deleteCustomer(id) {
  const response = await api.delete(`/customers/${id}`)

  return response.data
}
