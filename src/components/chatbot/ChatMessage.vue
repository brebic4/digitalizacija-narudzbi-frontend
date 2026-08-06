<script setup>
import { computed } from 'vue'
import { Bot, Clock3, Database, UserRound } from 'lucide-vue-next'

const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
})

const isUser = computed(() => {
  return props.message.role === 'user'
})

const formattedTime = computed(() => {
  if (!props.message.createdAt) {
    return ''
  }

  const date = new Date(props.message.createdAt)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('hr-HR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
})

const formattedContent = computed(() => {
  return String(props.message.content || '').trim()
})

const hasTools = computed(() => {
  return (
    !isUser.value && Array.isArray(props.message.toolsUsed) && props.message.toolsUsed.length > 0
  )
})

const toolLabels = {
  get_order_statistics: 'Statistika narudžbi',
  get_recent_orders: 'Posljednje narudžbe',
  get_overdue_orders: 'Zakašnjele narudžbe',
  get_orders_due_today: 'Današnje isporuke',
  find_order_by_number: 'Pretraga narudžbe',
  get_top_customers: 'Top kupci',
  get_top_products: 'Top proizvodi',
  get_customer_orders: 'Narudžbe kupca',
}

function getToolLabel(toolName) {
  return toolLabels[toolName] || 'Poslovni podaci'
}
</script>

<template>
  <article class="flex gap-3" :class="isUser ? 'justify-end' : 'justify-start'">
    <div
      v-if="!isUser"
      class="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-red-700 text-white shadow-sm"
    >
      <Bot :size="19" />
    </div>

    <div class="max-w-[86%] sm:max-w-[78%]" :class="isUser ? 'order-first' : ''">
      <div
        class="rounded-2xl px-4 py-3 shadow-sm"
        :class="
          isUser
            ? 'rounded-br-md bg-brand-brown-900 text-white'
            : 'rounded-bl-md border border-brand-border bg-white text-brand-brown-900'
        "
      >
        <p class="whitespace-pre-wrap wrap-break-word text-sm leading-6">
          {{ formattedContent }}
        </p>
      </div>

      <div
        class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-stone-400"
        :class="isUser ? 'justify-end' : 'justify-start'"
      >
        <span v-if="formattedTime" class="inline-flex items-center gap-1">
          <Clock3 :size="13" />
          {{ formattedTime }}
        </span>

        <template v-if="hasTools">
          <span
            v-for="toolName in message.toolsUsed"
            :key="toolName"
            class="inline-flex items-center gap-1 rounded-full bg-brand-cream-100 px-2.5 py-1 font-medium text-stone-600"
          >
            <Database :size="12" />
            {{ getToolLabel(toolName) }}
          </span>
        </template>
      </div>
    </div>

    <div
      v-if="isUser"
      class="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-cream-200 text-brand-brown-900"
    >
      <UserRound :size="19" />
    </div>
  </article>
</template>
