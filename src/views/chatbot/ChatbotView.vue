<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { Bot, MessageSquareText, Sparkles, Trash2 } from 'lucide-vue-next'

import ChatInput from '../../components/chatbot/ChatInput.vue'
import ChatMessage from '../../components/chatbot/ChatMessage.vue'
import SuggestionChip from '../../components/chatbot/SuggestionChip.vue'
import ConfirmationModal from '../../components/common/ConfirmationModal.vue'

import { useChatbotStore } from '../../stores/chatbot'

const chatbotStore = useChatbotStore()

const messagesContainer = ref(null)

const showClearModal = ref(false)

const suggestions = [
  'Koliko imamo aktivnih narudžbi?',
  'Što treba isporučiti danas?',
  'Koje narudžbe kasne?',
  'Prikaži posljednjih pet narudžbi.',
  'Koji kupac ima najviše narudžbi?',
  'Koji je najnaručivaniji proizvod?',
]

async function scrollToBottom() {
  await nextTick()

  const container = messagesContainer.value

  if (!container) {
    return
  }

  container.scrollTop = container.scrollHeight
}

async function sendMessage(message) {
  const success = await chatbotStore.sendMessage(message)

  if (success) {
    scrollToBottom()
  }
}

function clearConversation() {
  chatbotStore.clearConversation()
  showClearModal.value = false
}

watch(
  () => chatbotStore.messages.length,
  () => {
    scrollToBottom()
  },
)

onMounted(() => {
  scrollToBottom()
})
</script>

<template>
  <section class="flex h-[calc(100vh-130px)] flex-col">
    <header
      class="flex flex-col gap-4 rounded-2xl border border-brand-border bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-brand-red-700">
          AI asistent
        </p>

        <h2 class="mt-1 text-3xl font-bold text-brand-brown-900">Poslovni chatbot</h2>

        <p class="mt-3 max-w-2xl text-stone-600">
          Postavite pitanja o narudžbama, kupcima, proizvodima i poslovnim statistikama.
        </p>
      </div>

      <button
        v-if="chatbotStore.hasMessages"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        @click="showClearModal = true"
      >
        <Trash2 :size="18" />

        Obriši razgovor
      </button>
    </header>

    <div
      v-if="!chatbotStore.hasMessages"
      class="mt-6 rounded-2xl border border-brand-border bg-white p-6 shadow-sm"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex size-12 items-center justify-center rounded-full bg-brand-red-700 text-white"
        >
          <Bot :size="22" />
        </div>

        <div>
          <h3 class="font-bold text-brand-brown-900">Pozdrav!</h3>

          <p class="text-sm text-stone-600">Kako vam mogu pomoći danas?</p>
        </div>
      </div>

      <div class="mt-8">
        <div class="mb-4 flex items-center gap-2">
          <Sparkles :size="18" class="text-brand-red-700" />

          <p class="font-semibold text-brand-brown-900">Primjeri pitanja</p>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <SuggestionChip
            v-for="suggestion in suggestions"
            :key="suggestion"
            :text="suggestion"
            :disabled="chatbotStore.loading"
            @select="sendMessage"
          />
        </div>
      </div>
    </div>

    <div
      ref="messagesContainer"
      class="mt-6 flex-1 overflow-y-auto rounded-2xl border border-brand-border bg-brand-cream-50 p-5"
    >
      <div
        v-if="!chatbotStore.hasMessages"
        class="flex h-full items-center justify-center text-center"
      >
        <div>
          <MessageSquareText :size="42" class="mx-auto text-brand-red-700" />

          <p class="mt-4 text-sm text-stone-500">Razgovor će se prikazivati ovdje.</p>
        </div>
      </div>

      <div v-else class="space-y-6">
        <ChatMessage
          v-for="message in chatbotStore.messages"
          :key="message.id"
          :message="message"
        />

        <div v-if="chatbotStore.loading" class="flex items-center gap-3">
          <div
            class="flex size-10 items-center justify-center rounded-full bg-brand-red-700 text-white"
          >
            <Bot :size="18" />
          </div>

          <div
            class="rounded-2xl rounded-bl-md border border-brand-border bg-white px-5 py-4 shadow-sm"
          >
            <div class="flex gap-2">
              <span class="size-2 animate-bounce rounded-full bg-brand-red-700" />
              <span
                class="size-2 animate-bounce rounded-full bg-brand-red-700 [animation-delay:150ms]"
              />
              <span
                class="size-2 animate-bounce rounded-full bg-brand-red-700 [animation-delay:300ms]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="chatbotStore.error"
      class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ chatbotStore.error }}
    </div>

    <ChatInput class="mt-4" :loading="chatbotStore.loading" @send="sendMessage" />

    <ConfirmationModal
      :open="showClearModal"
      title="Obriši razgovor"
      message="Jeste li sigurni da želite obrisati cijeli razgovor s AI chatbotom?"
      confirm-text="Obriši"
      cancel-text="Odustani"
      @confirm="clearConversation"
      @cancel="showClearModal = false"
    />
  </section>
</template>
