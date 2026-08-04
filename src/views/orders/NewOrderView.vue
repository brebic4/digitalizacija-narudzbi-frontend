<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ArrowLeft, ClipboardPlus } from 'lucide-vue-next'

import OrderForm from '../../components/orders/OrderForm.vue'
import { createOrder } from '../../services/orders.service'

const router = useRouter()

const saving = ref(false)
const serverError = ref('')

async function handleSubmit(payload) {
  saving.value = true
  serverError.value = ''

  try {
    const response = await createOrder(payload)

    const createdOrderId = response.data?._id

    if (!createdOrderId) {
      throw new Error('Backend nije vratio ID kreirane narudžbe.')
    }

    await router.replace({
      name: 'order-details',
      params: {
        id: createdOrderId,
      },
      query: {
        created: 'true',
      },
    })
  } catch (err) {
    serverError.value =
      err.response?.data?.message || err.message || 'Narudžbu nije moguće spremiti.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="space-y-6">
    <div>
      <RouterLink
        to="/orders"
        class="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 transition hover:text-brand-red-700"
      >
        <ArrowLeft :size="18" />
        Natrag na narudžbe
      </RouterLink>
    </div>

    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-brand-red-700">
          Ručni unos
        </p>

        <h2 class="mt-1 text-3xl font-bold text-brand-brown-900">Nova narudžba</h2>

        <p class="mt-3 max-w-2xl text-stone-600">
          Odaberite kupca, dodajte proizvode i unesite podatke potrebne za obradu narudžbe.
        </p>
      </div>

      <div
        class="flex size-12 items-center justify-center rounded-2xl bg-brand-cream-100 text-brand-red-700"
      >
        <ClipboardPlus :size="24" />
      </div>
    </header>

    <OrderForm
      :loading="saving"
      :server-error="serverError"
      submit-text="Spremi narudžbu"
      @submit="handleSubmit"
    />
  </section>
</template>
