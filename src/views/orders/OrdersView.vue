<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
} from 'lucide-vue-next'

import { getOrders } from '../../services/orders.service'

const orders = ref([])
const loading = ref(false)
const error = ref('')

const search = ref('')
const selectedStatus = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)

const pagination = ref({
  totalItems: 0,
  currentPage: 1,
  itemsPerPage: 10,
  totalPages: 0,
})

let searchTimeout

const statusOptions = [
  {
    value: '',
    label: 'Svi statusi',
  },
  {
    value: 'zaprimljena',
    label: 'Zaprimljena',
  },
  {
    value: 'obrađena',
    label: 'Obrađena',
  },
  {
    value: 'u_pripremi',
    label: 'U pripremi',
  },
  {
    value: 'spremna_za_isporuku',
    label: 'Spremna za isporuku',
  },
  {
    value: 'isporučena',
    label: 'Isporučena',
  },
]

const statusLabels = {
  zaprimljena: 'Zaprimljena',
  obrađena: 'Obrađena',
  u_pripremi: 'U pripremi',
  spremna_za_isporuku: 'Spremna za isporuku',
  isporučena: 'Isporučena',
}

const statusClasses = {
  zaprimljena: 'border-stone-200 bg-stone-100 text-stone-700',

  obrađena: 'border-blue-200 bg-blue-100 text-blue-700',

  u_pripremi: 'border-amber-200 bg-amber-100 text-amber-700',

  spremna_za_isporuku: 'border-green-200 bg-green-100 text-green-700',

  isporučena: 'border-emerald-200 bg-emerald-100 text-emerald-700',
}

function formatDate(value) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('hr-HR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatNumber(value) {
  return new Intl.NumberFormat('hr-HR').format(Number(value || 0))
}

function formatWeight(value) {
  return new Intl.NumberFormat('hr-HR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

async function loadOrders() {
  loading.value = true
  error.value = ''

  try {
    const response = await getOrders({
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: search.value.trim(),
      status: selectedStatus.value || undefined,
    })

    const receivedPagination = response.pagination

    if (receivedPagination.totalPages > 0 && currentPage.value > receivedPagination.totalPages) {
      currentPage.value = receivedPagination.totalPages

      return
    }

    if (receivedPagination.totalPages === 0 && currentPage.value !== 1) {
      currentPage.value = 1

      return
    }

    orders.value = response.data
    pagination.value = receivedPagination
  } catch (err) {
    error.value = err.response?.data?.message || 'Narudžbe nisu mogle biti dohvaćene.'
  } finally {
    loading.value = false
  }
}

function goToPage(page) {
  if (page < 1 || page > pagination.value.totalPages || page === currentPage.value) {
    return
  }

  currentPage.value = page
}

function clearFilters() {
  search.value = ''
  selectedStatus.value = ''
  currentPage.value = 1
}

watch(search, () => {
  clearTimeout(searchTimeout)

  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadOrders()
  }, 350)
})

watch(selectedStatus, () => {
  currentPage.value = 1
  loadOrders()
})

watch(currentPage, () => {
  loadOrders()
})

watch(itemsPerPage, () => {
  currentPage.value = 1
  loadOrders()
})

onMounted(loadOrders)

onBeforeUnmount(() => {
  clearTimeout(searchTimeout)
})
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-brand-red-700">
          Upravljanje poslovnim procesom
        </p>

        <h2 class="mt-1 text-3xl font-bold text-brand-brown-900">Narudžbe</h2>

        <p class="mt-3 max-w-2xl text-stone-600">
          Pregled zaprimljenih narudžbi, rokova isporuke i trenutačnog statusa obrade.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-red-800"
      >
        <Plus :size="18" />

        Nova narudžba
      </button>
    </div>

    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {{ error }}
    </div>

    <section class="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm">
      <div
        class="flex flex-col gap-4 border-b border-brand-border p-5 lg:flex-row lg:items-center lg:justify-between"
      >
        <div class="flex w-full flex-col gap-3 sm:flex-row lg:max-w-3xl">
          <div class="relative flex-1">
            <Search
              :size="19"
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />

            <input
              v-model="search"
              type="search"
              placeholder="Pretraži po broju narudžbe ili kupcu..."
              class="w-full rounded-xl border border-brand-border bg-brand-cream-50 py-2.5 pl-10 pr-4 text-sm text-brand-brown-900 outline-none transition placeholder:text-stone-400 focus:border-brand-red-700 focus:ring-2 focus:ring-brand-red-700/10"
            />
          </div>

          <select
            v-model="selectedStatus"
            class="rounded-xl border border-brand-border bg-brand-cream-50 px-4 py-2.5 text-sm text-brand-brown-900 outline-none transition focus:border-brand-red-700 focus:ring-2 focus:ring-brand-red-700/10 sm:min-w-56"
          >
            <option v-for="status in statusOptions" :key="status.value" :value="status.value">
              {{ status.label }}
            </option>
          </select>

          <button
            v-if="search || selectedStatus"
            type="button"
            class="rounded-xl border border-brand-border px-4 py-2.5 text-sm font-semibold text-stone-600 transition hover:border-brand-red-700 hover:text-brand-red-700"
            @click="clearFilters"
          >
            Očisti filtre
          </button>
        </div>

        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 text-sm text-stone-600">
            Prikaži

            <select
              v-model="itemsPerPage"
              class="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-brown-900 outline-none focus:border-brand-red-700"
            >
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </label>

          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2 text-sm font-semibold text-brand-brown-900 transition hover:border-brand-red-700 hover:text-brand-red-700 disabled:opacity-60"
            :disabled="loading"
            @click="loadOrders"
          >
            <RefreshCw :size="17" :class="{ 'animate-spin': loading }" />

            Osvježi
          </button>
        </div>
      </div>

      <div v-if="loading" class="space-y-3 p-5">
        <div
          v-for="index in 5"
          :key="index"
          class="h-20 animate-pulse rounded-xl bg-brand-cream-100"
        />
      </div>

      <div
        v-else-if="orders.length === 0"
        class="flex flex-col items-center justify-center px-6 py-16 text-center"
      >
        <div
          class="flex size-14 items-center justify-center rounded-full bg-brand-cream-100 text-brand-brown-900"
        >
          <ShoppingCart :size="27" />
        </div>

        <h3 class="mt-4 font-semibold text-brand-brown-900">Nema pronađenih narudžbi</h3>

        <p class="mt-2 max-w-sm text-sm text-stone-500">
          Dodajte novu narudžbu ili promijenite postavljene filtre.
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
                Stavke
              </th>

              <th
                class="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-500"
              >
                Pakiranja
              </th>

              <th
                class="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-500"
              >
                Težina
              </th>

              <th
                class="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6"
              >
                Akcije
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-brand-border">
            <tr v-for="order in orders" :key="order._id" class="transition hover:bg-brand-cream-50">
              <td class="whitespace-nowrap px-5 py-4 sm:px-6">
                <p class="font-semibold text-brand-brown-900">
                  {{ order.orderNumber }}
                </p>

                <p class="mt-1 text-xs text-stone-500">
                  Kreirano:
                  {{ formatDate(order.createdAt) }}
                </p>
              </td>

              <td class="px-5 py-4 text-sm text-stone-700">
                {{ order.customerName }}
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-sm text-stone-700">
                <div class="flex items-center gap-2">
                  <CalendarDays :size="16" class="text-stone-400" />

                  {{ formatDate(order.deliveryDate) }}
                </div>
              </td>

              <td class="whitespace-nowrap px-5 py-4">
                <span
                  class="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
                  :class="
                    statusClasses[order.status] || 'border-stone-200 bg-stone-100 text-stone-700'
                  "
                >
                  {{ statusLabels[order.status] || order.status }}
                </span>
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-right text-sm text-stone-700">
                {{ formatNumber(order.itemsCount) }}
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-right text-sm text-stone-700">
                {{ formatNumber(order.totalPackages) }}
              </td>

              <td
                class="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-brand-brown-900"
              >
                {{ formatWeight(order.totalWeightKg) }} kg
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-right sm:px-6">
                <RouterLink
                  :to="`/orders/${order._id}`"
                  class="inline-flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2 text-xs font-semibold text-brand-brown-900 transition hover:border-brand-red-700 hover:text-brand-red-700"
                >
                  <Eye :size="16" />

                  Pregled
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="!loading && pagination.totalItems > 0"
        class="flex flex-col gap-3 border-t border-brand-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <p class="text-sm text-stone-500">
          Ukupno:

          <span class="font-semibold text-brand-brown-900">
            {{ pagination.totalItems }}
          </span>

          narudžbi
        </p>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex size-9 items-center justify-center rounded-lg border border-brand-border text-brand-brown-900 transition hover:border-brand-red-700 hover:text-brand-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="currentPage <= 1"
            aria-label="Prethodna stranica"
            @click="goToPage(currentPage - 1)"
          >
            <ChevronLeft :size="18" />
          </button>

          <span class="px-2 text-sm text-stone-600">
            Stranica

            <strong class="text-brand-brown-900">
              {{ currentPage }}
            </strong>

            od

            <strong class="text-brand-brown-900">
              {{ pagination.totalPages || 1 }}
            </strong>
          </span>

          <button
            type="button"
            class="inline-flex size-9 items-center justify-center rounded-lg border border-brand-border text-brand-brown-900 transition hover:border-brand-red-700 hover:text-brand-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="currentPage >= pagination.totalPages"
            aria-label="Sljedeća stranica"
            @click="goToPage(currentPage + 1)"
          >
            <ChevronRight :size="18" />
          </button>
        </div>
      </div>
    </section>
  </section>
</template>
