import api from './api'

export async function sendChatbotMessage(payload) {
  const response = await api.post('/chatbot/message', payload)

  return response.data
}
