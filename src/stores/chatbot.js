import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { sendChatbotMessage } from '../services/chatbot.service'

const MAX_HISTORY_ITEMS = 10

function createMessage({ role, content, toolsUsed = [], usage = null }) {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    toolsUsed,
    usage,
    createdAt: new Date().toISOString(),
  }
}

export const useChatbotStore = defineStore('chatbot', () => {
  const messages = ref([])
  const loading = ref(false)
  const error = ref('')

  const hasMessages = computed(() => {
    return messages.value.length > 0
  })

  const conversationHistory = computed(() => {
    return messages.value
      .filter((message) => {
        return (
          ['user', 'assistant'].includes(message.role) &&
          typeof message.content === 'string' &&
          message.content.trim()
        )
      })
      .slice(-MAX_HISTORY_ITEMS)
      .map((message) => ({
        role: message.role,
        content: message.content.trim(),
      }))
  })

  function addUserMessage(content) {
    const message = createMessage({
      role: 'user',
      content,
    })

    messages.value.push(message)

    return message
  }

  function addAssistantMessage({ content, toolsUsed = [], usage = null }) {
    const message = createMessage({
      role: 'assistant',
      content,
      toolsUsed,
      usage,
    })

    messages.value.push(message)

    return message
  }

  function setError(message = '') {
    error.value = message
  }

  function clearError() {
    error.value = ''
  }

  function clearConversation() {
    messages.value = []
    error.value = ''
    loading.value = false
  }

  async function sendMessage(content) {
    const normalizedContent = String(content || '').trim()

    if (!normalizedContent || loading.value) {
      return false
    }

    if (normalizedContent.length > 1000) {
      error.value = 'Poruka ne smije sadržavati više od 1000 znakova.'

      return false
    }

    const previousHistory = [...conversationHistory.value]

    addUserMessage(normalizedContent)

    loading.value = true
    error.value = ''

    try {
      const response = await sendChatbotMessage({
        message: normalizedContent,
        history: previousHistory,
      })

      const answer = response.data?.answer?.trim()

      if (!answer) {
        throw new Error('Chatbot nije vratio odgovor.')
      }

      addAssistantMessage({
        content: answer,
        toolsUsed: Array.isArray(response.data?.toolsUsed) ? response.data.toolsUsed : [],
        usage: response.data?.usage || null,
      })

      return true
    } catch (err) {
      error.value =
        err.response?.data?.message || err.message || 'Chatbot trenutno ne može odgovoriti.'

      return false
    } finally {
      loading.value = false
    }
  }

  return {
    messages,
    loading,
    error,

    hasMessages,
    conversationHistory,

    addUserMessage,
    addAssistantMessage,

    setError,
    clearError,
    clearConversation,
    sendMessage,
  }
})
