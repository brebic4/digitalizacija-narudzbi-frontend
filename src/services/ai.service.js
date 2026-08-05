import api from './api'

export async function uploadOrderPdf(file) {
  if (!(file instanceof File)) {
    throw new Error('PDF datoteka nije ispravna.')
  }

  const formData = new FormData()
  formData.append('file', file, file.name)

  const response = await api.post('/uploads/order-pdf', formData, {
    headers: {
      'Content-Type': undefined,
    },
  })

  return response.data
}

export async function extractOrderFromPdf(fileName) {
  const response = await api.post('/ai/extract-order', {
    fileName,
  })

  return response.data
}

export async function deleteOrderPdf(fileName) {
  const response = await api.delete(`/uploads/order-pdf/${encodeURIComponent(fileName)}`)

  return response.data
}
