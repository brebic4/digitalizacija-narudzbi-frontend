<script setup>
import { nextTick, ref, watch } from 'vue'
import { LoaderCircle, Send } from 'lucide-vue-next'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },

  disabled: {
    type: Boolean,
    default: false,
  },

  maxLength: {
    type: Number,
    default: 1000,
  },
})

const emit = defineEmits(['send'])

const message = ref('')
const textarea = ref(null)

function resizeTextarea() {
  const element = textarea.value

  if (!element) {
    return
  }

  element.style.height = 'auto'

  const maximumHeight = 160
  const nextHeight = Math.min(element.scrollHeight, maximumHeight)

  element.style.height = `${nextHeight}px`
  element.style.overflowY = element.scrollHeight > maximumHeight ? 'auto' : 'hidden'
}

async function resetInput() {
  message.value = ''

  await nextTick()

  resizeTextarea()
  textarea.value?.focus()
}

async function handleSubmit() {
  const normalizedMessage = message.value.trim()

  if (!normalizedMessage || props.loading || props.disabled) {
    return
  }

  emit('send', normalizedMessage)

  await resetInput()
}

function handleKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSubmit()
  }
}

watch(message, async () => {
  await nextTick()
  resizeTextarea()
})
</script>

<template>
  <form class="border-t border-brand-border bg-white p-4 sm:p-5" @submit.prevent="handleSubmit">
    <div
      class="rounded-2xl border border-brand-border bg-brand-cream-50 p-2 shadow-sm transition focus-within:border-brand-red-700 focus-within:ring-2 focus-within:ring-brand-red-700/10"
    >
      <div class="flex items-end gap-2">
        <textarea
          ref="textarea"
          v-model="message"
          rows="1"
          :maxlength="maxLength"
          :disabled="loading || disabled"
          placeholder="Postavite pitanje o narudžbama, kupcima ili proizvodima..."
          class="min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-6 text-brand-brown-900 outline-none placeholder:text-stone-400 disabled:cursor-not-allowed disabled:opacity-60"
          @keydown="handleKeydown"
        />

        <button
          type="submit"
          class="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-red-700 text-white shadow-sm transition hover:bg-brand-red-800 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="loading || disabled || !message.trim()"
          aria-label="Pošalji poruku"
        >
          <LoaderCircle v-if="loading" :size="19" class="animate-spin" />

          <Send v-else :size="19" />
        </button>
      </div>

      <div
        class="flex flex-col gap-1 px-3 pb-1 pt-2 text-xs text-stone-400 sm:flex-row sm:items-center sm:justify-between"
      >
        <span> Enter za slanje · Shift + Enter za novi red </span>

        <span> {{ message.length }} / {{ maxLength }} </span>
      </div>
    </div>
  </form>
</template>
