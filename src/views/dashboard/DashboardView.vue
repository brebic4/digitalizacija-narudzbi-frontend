<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  PackageCheck,
  RefreshCw,
  ShoppingCart,
} from 'lucide-vue-next'

import { getDashboardSummary } from '../../services/dashboard.service'

const statistics = ref({
  activeOrders: 0,
  dueToday: 0,
  inPreparation: 0,
  readyForDelivery: 0,
  overdueOrders: 0,
})

const recentOrders = ref([])
const loading = ref(true)
const error = ref('')

const statisticCards = computed(() => [
  {
    title: 'Aktivne narudžbe',
    value: statistics.value.activeOrders,
    description: 'Sve narudžbe koje još nisu isporučene',
    icon: ShoppingCart,
    iconClasses: 'bg-brand-red-700/10 text-brand-red-700',
  },
  {
    title: 'Rok danas',
    value: statistics.value.dueToday,
    description: 'Narudžbe koje treba isporučiti danas',
    icon: CalendarClock,
    iconClasses: 'bg-amber-100 text-amber-700',
  },
  {
    title: 'U pripremi',
    value: statistics.value.inPreparation,
    description: 'Narudžbe koje se trenutačno pripremaju',
    icon: Clock3,
    iconClasses: 'bg-blue-100 text-blue-700',
  },
  {
    title: 'Spremne za isporuku',
    value: statistics.value.readyForDelivery,
    description: 'Zapakirane narudžbe koje čekaju isporuku',
    icon: PackageCheck,
    iconClasses: 'bg-green-100 text-green-700',
  },
  {
    title: 'Zakašnjele',
    value: statistics.value.overdueOrders,
    description: 'Rok je prošao, a narudžba nije isporučena',
    icon: AlertTriangle,
    iconClasses: 'bg-red-100 text-red-700',
  },
])

const statusLabels = {
  zaprimljena: 'Zaprimljena',
  obrađena: 'Obrađena',
  u_pripremi: 'U pripremi',
  spremna_za_isporuku: 'Spremna za isporuku',
  isporučena: 'Isporučena',
}

const statusClasses = {
  zaprimljena: 'bg-stone-100 text-stone-700',
  obrađena: 'bg-blue-100 text-blue-700',
  u_pripremi: 'bg-amber-100 text-amber-700',
  spremna_za_isporuku: 'bg-green-100 text-green-700',
  isporučena: 'bg-emerald-100 text-emerald-700',
}

function formatDate(value) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('hr-HR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function formatNumber(value) {
  return new Intl.NumberFormat('hr-HR').format(Number(value || 0))
}

async function loadDashboard() {
  loading.value = true
  error.value = ''

  try {
    const response = await getDashboardSummary()

    statistics.value = response.data.statistics
    recentOrders.value = response.data.recentOrders
  } catch (err) {
    error.value = err.response?.data?.message || 'Podaci za dashboard nisu mogli biti dohvaćeni.'
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>

<template>
  <section class="space-y-8">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-brand-red-700">
          Pregled poslovanja
        </p>

        <h2 class="mt-1 text-3xl font-bold text-brand-brown-900">Dobro došli u sustav</h2>

        <p class="mt-3 max-w-2xl text-stone-600">
          Brzi pregled narudžbi, rokova isporuke i trenutačnog stanja proizvodnje.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm font-semibold text-brand-brown-900 shadow-sm transition hover:border-brand-red-700 hover:text-brand-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="loading"
        @click="loadDashboard"
      >
        <RefreshCw :size="18" :class="{ 'animate-spin': loading }" />

        Osvježi podatke
      </button>
    </div>

    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {{ error }}
    </div>

    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <div
        v-for="index in 5"
        :key="index"
        class="h-44 animate-pulse rounded-2xl border border-brand-border bg-white"
      />
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <article
        v-for="card in statisticCards"
        :key="card.title"
        class="rounded-2xl border border-brand-border bg-white p-5 shadow-sm"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-stone-500">
              {{ card.title }}
            </p>

            <p class="mt-3 text-4xl font-bold text-brand-brown-900">
              {{ formatNumber(card.value) }}
            </p>
          </div>

          <div
            class="flex size-11 shrink-0 items-center justify-center rounded-xl"
            :class="card.iconClasses"
          >
            <component :is="card.icon" :size="22" />
          </div>
        </div>

        <p class="mt-4 text-xs leading-5 text-stone-500">
          {{ card.description }}
        </p>
      </article>
    </div>

    <section class="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-brand-border px-5 py-4 sm:px-6">
        <div>
          <h3 class="text-lg font-bold text-brand-brown-900">Posljednje narudžbe</h3>

          <p class="mt-1 text-sm text-stone-500">Posljednjih pet unesenih narudžbi.</p>
        </div>

        <RouterLink to="/orders" class="text-sm font-semibold text-brand-red-700 hover:underline">
          Sve narudžbe
        </RouterLink>
      </div>

      <div v-if="loading" class="p-6 text-sm text-stone-500">Učitavanje narudžbi...</div>

      <div
        v-else-if="recentOrders.length === 0"
        class="flex flex-col items-center justify-center px-6 py-14 text-center"
      >
        <div
          class="flex size-14 items-center justify-center rounded-full bg-brand-cream-100 text-brand-brown-900"
        >
          <CheckCircle2 :size="26" />
        </div>

        <h4 class="mt-4 font-semibold text-brand-brown-900">Još nema narudžbi</h4>

        <p class="mt-2 max-w-sm text-sm text-stone-500">
          Posljednje narudžbe prikazat će se nakon što ih dodate u sustav.
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-brand-border">
          <thead class="bg-brand-cream-100/70">
            <tr>
              <th
                class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6"
              >
                Broj narudžbe
              </th>

              <th
                class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500"
              >
                Kupac
              </th>

              <th
                class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500"
              >
                Datum isporuke
              </th>

              <th
                class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500"
              >
                Status
              </th>

              <th
                class="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-500"
              >
                Pakiranja
              </th>

              <th
                class="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6"
              >
                Težina
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-brand-border">
            <tr
              v-for="order in recentOrders"
              :key="order._id"
              class="transition hover:bg-brand-cream-50"
            >
              <td
                class="whitespace-nowrap px-5 py-4 text-sm font-semibold text-brand-brown-900 sm:px-6"
              >
                {{ order.orderNumber }}
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-sm text-stone-700">
                {{ order.customerName }}
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-sm text-stone-700">
                {{ formatDate(order.deliveryDate) }}
              </td>

              <td class="whitespace-nowrap px-5 py-4">
                <span
                  class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                  :class="statusClasses[order.status] || 'bg-stone-100 text-stone-700'"
                >
                  {{ statusLabels[order.status] || order.status }}
                </span>
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-right text-sm text-stone-700">
                {{ formatNumber(order.totalPackages) }}
              </td>

              <td
                class="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-brand-brown-900 sm:px-6"
              >
                {{ formatNumber(order.totalWeightKg) }} kg
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>
