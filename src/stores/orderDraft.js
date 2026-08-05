import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useOrderDraftStore = defineStore('orderDraft', () => {
  const draft = ref(null)
  const source = ref(null)

  const hasDraft = computed(() => {
    return Boolean(draft.value)
  })

  const isFromAi = computed(() => {
    return source.value === 'ai'
  })

  function setAiDraft(orderDraft) {
    if (!orderDraft) {
      draft.value = null
      source.value = null
      return
    }

    draft.value = {
      customerId: orderDraft.customerId || '',
      orderNumber: orderDraft.orderNumber || '',
      deliveryDate: orderDraft.deliveryDate || '',
      note: orderDraft.note || '',

      items: Array.isArray(orderDraft.items)
        ? orderDraft.items.map((item) => ({
            productId: item.productId || '',
            quantity: Number(item.quantity || 1),
            customerProductCode: item.customerProductCode || '',
            customerBarcode: item.customerBarcode || '',
            originalProductName: item.originalProductName || '',
          }))
        : [],
    }

    source.value = 'ai'
  }

  function clearDraft() {
    draft.value = null
    source.value = null
  }

  return {
    draft,
    source,

    hasDraft,
    isFromAi,

    setAiDraft,
    clearDraft,
  }
})
