<script setup>
import { ArrowUpRight } from 'lucide-vue-next'

defineProps({
  text: {
    type: String,
    required: true,
  },

  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select'])
</script>

<template>
  <button
    type="button"
    class="group flex w-full items-center justify-between gap-3 rounded-xl border border-brand-border bg-white px-4 py-3 text-left text-sm font-medium text-brand-brown-900 shadow-sm transition hover:border-brand-red-700 hover:bg-brand-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    :disabled="disabled"
    @click="emit('select', text)"
  >
    <span class="leading-5">
      {{ text }}
    </span>

    <ArrowUpRight
      :size="17"
      class="shrink-0 text-stone-400 transition group-hover:text-brand-red-700"
    />
  </button>
</template>
