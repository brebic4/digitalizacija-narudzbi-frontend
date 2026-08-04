import api from './api'

export async function getUsers(params = {}) {
  const response = await api.get('/users', {
    params,
  })

  return response.data
}

export async function getUserById(id) {
  const response = await api.get(`/users/${id}`)

  return response.data
}

export async function createUser(payload) {
  const response = await api.post('/users', payload)

  return response.data
}

export async function updateUser(id, payload) {
  const response = await api.put(`/users/${id}`, payload)

  return response.data
}

export async function changeUserActiveStatus(id, active) {
  const response = await api.patch(`/users/${id}/active`, {
    active,
  })

  return response.data
}
