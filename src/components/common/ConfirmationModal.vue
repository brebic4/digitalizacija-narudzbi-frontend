<script setup>
import { LoaderCircle, TriangleAlert, X } from 'lucide-vue-next'

const props = defineProps({
  open: Boolean,
  loading: Boolean,

  title: {
    type: String,
    default: 'Potvrda',
  },

  message: {
    type: String,
    default: '',
  },

  confirmText: {
    type: String,
    default: 'Potvrdi',
  },

  cancelText: {
    type: String,
    default: 'Odustani',
  },

  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['confirm', 'cancel'])

function close() {
  if (props.loading) return

  emit('cancel')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      @click.self="close"
    >
      <section class="w-full max-w-md rounded-2xl border border-brand-border bg-white shadow-2xl">
        <header class="flex items-center justify-between border-b border-brand-border p-5">
          <div class="flex items-center gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-full bg-red-100">
              <TriangleAlert :size="22" class="text-red-600" />
            </div>

            <h2 class="text-xl font-bold text-brand-brown-900">
              {{ title }}
            </h2>
          </div>

          <button class="rounded-lg p-2 hover:bg-brand-cream-100" @click="close">
            <X :size="20" />
          </button>
        </header>

        <div class="p-6">
          <p class="leading-7 text-stone-700">
            {{ message }}
          </p>
        </div>

        <div
          v-if="error"
          class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
        >
          {{ error }}
        </div>

        <footer class="flex justify-end gap-3 border-t border-brand-border p-5">
          <button
            class="rounded-xl border border-brand-border px-5 py-2.5 font-semibold hover:bg-brand-cream-100"
            :disabled="loading"
            @click="close"
          >
            {{ cancelText }}
          </button>

          <button
            class="inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-2.5 font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            :disabled="loading"
            @click="$emit('confirm')"
          >
            <LoaderCircle v-if="loading" class="animate-spin" :size="18" />

            <span>
              {{ loading ? 'Brisanje...' : confirmText }}
            </span>
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>
