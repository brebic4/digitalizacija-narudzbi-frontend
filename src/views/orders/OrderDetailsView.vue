<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Circle,
  ClipboardList,
  Clock3,
  Hash,
  LoaderCircle,
  Package,
  RefreshCw,
  Scale,
  ShoppingCart,
  UserRound,
} from 'lucide-vue-next'

import { getOrderById, updateOrderStatus } from '../../services/orders.service'

import ConfirmationModal from '../../components/common/ConfirmationModal.vue'

const route = useRoute()

const order = ref(null)
const loading = ref(false)
const error = ref('')
const successMessage = ref('')

const statusModalOpen = ref(false)
const statusUpdating = ref(false)
const statusError = ref('')

const statusFlow = ['zaprimljena', 'obrađena', 'u_pripremi', 'spremna_za_isporuku', 'isporučena']

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

const currentStatusIndex = computed(() => {
  if (!order.value) {
    return -1
  }

  return statusFlow.indexOf(order.value.status)
})

const nextStatus = computed(() => {
  if (currentStatusIndex.value < 0 || currentStatusIndex.value >= statusFlow.length - 1) {
    return null
  }

  return statusFlow[currentStatusIndex.value + 1]
})

const canAdvanceStatus = computed(() => {
  return Boolean(nextStatus.value)
})

const statusModalTitle = computed(() => {
  if (!nextStatus.value) {
    return 'Promijeni status'
  }

  return `Promijeni status u „${statusLabels[nextStatus.value]}”`
})

const statusModalMessage = computed(() => {
  if (!order.value || !nextStatus.value) {
    return ''
  }

  return `Narudžba #${order.value.orderNumber} prijeći će iz statusa „${
    statusLabels[order.value.status] || order.value.status
  }” u status „${statusLabels[nextStatus.value]}”.`
})

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

function formatDateTime(value) {
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
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatNumber(value) {
  return new Intl.NumberFormat('hr-HR').format(Number(value || 0))
}

function formatWeightGrams(value) {
  const kilograms = Number(value || 0) / 1000

  return new Intl.NumberFormat('hr-HR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(kilograms)
}

function getHistoryEntry(status) {
  return order.value?.statusHistory?.find((entry) => entry.status === status)
}

function isCompletedStatus(index) {
  return index < currentStatusIndex.value
}

function isCurrentStatus(index) {
  return index === currentStatusIndex.value
}

async function loadOrder() {
  loading.value = true
  error.value = ''

  try {
    const response = await getOrderById(route.params.id)

    order.value = response.data
  } catch (err) {
    error.value = err.response?.data?.message || 'Narudžba nije mogla biti dohvaćena.'
  } finally {
    loading.value = false
  }
}

function openStatusModal() {
  if (!canAdvanceStatus.value) {
    return
  }

  statusError.value = ''
  statusModalOpen.value = true
}

function closeStatusModal() {
  if (statusUpdating.value) {
    return
  }

  statusModalOpen.value = false
  statusError.value = ''
}

async function confirmStatusChange() {
  if (!order.value || !nextStatus.value) {
    return
  }

  statusUpdating.value = true
  statusError.value = ''
  successMessage.value = ''
  error.value = ''

  try {
    await updateOrderStatus(order.value._id, nextStatus.value)

    statusModalOpen.value = false

    successMessage.value = 'Status narudžbe uspješno je ažuriran.'

    await loadOrder()
  } catch (err) {
    statusError.value = err.response?.data?.message || 'Status narudžbe nije moguće promijeniti.'
  } finally {
    statusUpdating.value = false
  }
}

onMounted(loadOrder)
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

    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {{ error }}
    </div>

    <div
      v-if="successMessage"
      class="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
    >
      {{ successMessage }}
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="h-36 animate-pulse rounded-2xl bg-brand-cream-100" />

      <div class="h-72 animate-pulse rounded-2xl bg-brand-cream-100" />

      <div class="h-56 animate-pulse rounded-2xl bg-brand-cream-100" />
    </div>

    <template v-else-if="order">
      <header
        class="flex flex-col gap-5 rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-brand-red-700">
            Detalji narudžbe
          </p>

          <div class="mt-2 flex flex-wrap items-center gap-3">
            <h2 class="text-3xl font-bold text-brand-brown-900">
              Narudžba #{{ order.orderNumber }}
            </h2>

            <span
              class="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
              :class="statusClasses[order.status] || 'border-stone-200 bg-stone-100 text-stone-700'"
            >
              {{ statusLabels[order.status] || order.status }}
            </span>
          </div>

          <p class="mt-3 text-sm text-stone-500">Kreirano {{ formatDateTime(order.createdAt) }}</p>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-border px-4 py-2.5 text-sm font-semibold text-brand-brown-900 transition hover:border-brand-red-700 hover:text-brand-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="loading"
            @click="loadOrder"
          >
            <RefreshCw :size="18" />
            Osvježi
          </button>

          <button
            v-if="canAdvanceStatus"
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-red-800"
            @click="openStatusModal"
          >
            Promijeni u
            {{ statusLabels[nextStatus] }}

            <ChevronRight :size="18" />
          </button>

          <div
            v-else
            class="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700"
          >
            <Check :size="18" />
            Narudžba je isporučena
          </div>
        </div>
      </header>

      <div class="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section class="rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-6">
          <div class="flex items-center gap-3">
            <div
              class="flex size-11 items-center justify-center rounded-xl bg-brand-cream-100 text-brand-brown-900"
            >
              <UserRound :size="22" />
            </div>

            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red-700">
                Poslovni partner
              </p>

              <h3 class="mt-1 text-xl font-bold text-brand-brown-900">Kupac</h3>
            </div>
          </div>

          <dl class="mt-6 space-y-4">
            <div
              class="flex flex-col gap-1 border-b border-brand-border pb-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <dt class="text-sm text-stone-500">Naziv</dt>

              <dd class="font-semibold text-brand-brown-900">
                {{ order.customerSnapshot?.name || '—' }}
              </dd>
            </div>

            <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <dt class="text-sm text-stone-500">OIB</dt>

              <dd class="font-medium text-brand-brown-900">
                {{ order.customerSnapshot?.oib || '—' }}
              </dd>
            </div>
          </dl>
        </section>

        <section class="rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-6">
          <div class="flex items-center gap-3">
            <div
              class="flex size-11 items-center justify-center rounded-xl bg-brand-cream-100 text-brand-brown-900"
            >
              <ClipboardList :size="22" />
            </div>

            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red-700">
                Rok i identifikacija
              </p>

              <h3 class="mt-1 text-xl font-bold text-brand-brown-900">Podaci narudžbe</h3>
            </div>
          </div>

          <dl class="mt-6 space-y-4">
            <div
              class="flex flex-col gap-1 border-b border-brand-border pb-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <dt class="flex items-center gap-2 text-sm text-stone-500">
                <Hash :size="16" />
                Broj narudžbe
              </dt>

              <dd class="font-semibold text-brand-brown-900">
                {{ order.orderNumber }}
              </dd>
            </div>

            <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <dt class="flex items-center gap-2 text-sm text-stone-500">
                <CalendarDays :size="16" />
                Datum isporuke
              </dt>

              <dd class="font-semibold text-brand-brown-900">
                {{ formatDate(order.deliveryDate) }}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section class="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm">
        <header
          class="flex flex-col gap-3 border-b border-brand-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red-700">
              Sadržaj narudžbe
            </p>

            <h3 class="mt-1 text-xl font-bold text-brand-brown-900">Stavke</h3>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <span
              class="rounded-lg bg-brand-cream-100 px-3 py-2 text-xs font-semibold text-brand-brown-900"
            >
              {{ order.summary?.itemsCount || 0 }}
              stavki
            </span>

            <span
              class="rounded-lg bg-brand-cream-100 px-3 py-2 text-xs font-semibold text-brand-brown-900"
            >
              {{ formatNumber(order.summary?.totalPackages) }}
              pakiranja
            </span>

            <span
              class="rounded-lg bg-brand-cream-100 px-3 py-2 text-xs font-semibold text-brand-brown-900"
            >
              {{ formatWeightGrams(order.summary?.totalWeightGrams) }}
              kg
            </span>
          </div>
        </header>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-brand-border">
            <thead class="bg-brand-cream-100/70">
              <tr>
                <th
                  class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6"
                >
                  Proizvod
                </th>

                <th
                  class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500"
                >
                  Šifra
                </th>

                <th
                  class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500"
                >
                  Barkod
                </th>

                <th
                  class="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-500"
                >
                  Količina
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
                v-for="item in order.items"
                :key="item.productId"
                class="transition hover:bg-brand-cream-50"
              >
                <td class="px-5 py-4 sm:px-6">
                  <p class="font-semibold text-brand-brown-900">
                    {{
                      item.productSnapshot?.name || item.originalProductName || 'Nepoznat proizvod'
                    }}
                  </p>

                  <p v-if="item.originalProductName" class="mt-1 text-xs text-stone-500">
                    Naziv iz dokumenta:
                    {{ item.originalProductName }}
                  </p>
                </td>

                <td class="whitespace-nowrap px-5 py-4 text-sm text-stone-700">
                  {{ item.productSnapshot?.code || '—' }}
                </td>

                <td class="whitespace-nowrap px-5 py-4 text-sm text-stone-700">
                  {{ item.productSnapshot?.barcode || '—' }}
                </td>

                <td
                  class="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-brand-brown-900"
                >
                  {{ formatNumber(item.quantity) }}
                  {{ item.productSnapshot?.unit || 'kom' }}
                </td>

                <td
                  class="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-brand-brown-900 sm:px-6"
                >
                  {{ formatWeightGrams(item.totalWeightGrams) }}
                  kg
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <section class="rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-6">
          <div class="flex items-center gap-3">
            <div
              class="flex size-11 items-center justify-center rounded-xl bg-brand-cream-100 text-brand-brown-900"
            >
              <ShoppingCart :size="22" />
            </div>

            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red-700">
                Sažetak
              </p>

              <h3 class="mt-1 text-xl font-bold text-brand-brown-900">Ukupno</h3>
            </div>
          </div>

          <div class="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <article class="rounded-xl bg-brand-cream-50 p-4">
              <Package :size="21" class="text-brand-red-700" />

              <p class="mt-3 text-2xl font-bold text-brand-brown-900">
                {{ formatNumber(order.summary?.itemsCount) }}
              </p>

              <p class="mt-1 text-xs text-stone-500">različitih stavki</p>
            </article>

            <article class="rounded-xl bg-brand-cream-50 p-4">
              <ShoppingCart :size="21" class="text-brand-red-700" />

              <p class="mt-3 text-2xl font-bold text-brand-brown-900">
                {{ formatNumber(order.summary?.totalPackages) }}
              </p>

              <p class="mt-1 text-xs text-stone-500">pakiranja</p>
            </article>

            <article class="rounded-xl bg-brand-cream-50 p-4">
              <Scale :size="21" class="text-brand-red-700" />

              <p class="mt-3 text-2xl font-bold text-brand-brown-900">
                {{ formatWeightGrams(order.summary?.totalWeightGrams) }}
                kg
              </p>

              <p class="mt-1 text-xs text-stone-500">ukupna težina</p>
            </article>
          </div>

          <div
            v-if="order.note"
            class="mt-5 rounded-xl border border-brand-border bg-brand-cream-50 p-4"
          >
            <p class="text-xs font-semibold uppercase tracking-wider text-stone-500">Napomena</p>

            <p class="mt-2 whitespace-pre-line text-sm leading-6 text-stone-700">
              {{ order.note }}
            </p>
          </div>
        </section>

        <section class="rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-6">
          <div class="flex items-center gap-3">
            <div
              class="flex size-11 items-center justify-center rounded-xl bg-brand-cream-100 text-brand-brown-900"
            >
              <Clock3 :size="22" />
            </div>

            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red-700">
                Praćenje obrade
              </p>

              <h3 class="mt-1 text-xl font-bold text-brand-brown-900">Povijest statusa</h3>
            </div>
          </div>

          <ol class="mt-7">
            <li
              v-for="(status, index) in statusFlow"
              :key="status"
              class="relative flex gap-4 pb-7 last:pb-0"
            >
              <div
                v-if="index < statusFlow.length - 1"
                class="absolute left-3.75 top-8 h-[calc(100%-1rem)] w-px"
                :class="index < currentStatusIndex ? 'bg-brand-red-700' : 'bg-brand-border'"
              />

              <div
                class="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2"
                :class="
                  isCompletedStatus(index)
                    ? 'border-brand-red-700 bg-brand-red-700 text-white'
                    : isCurrentStatus(index)
                      ? 'border-brand-red-700 bg-white text-brand-red-700'
                      : 'border-brand-border bg-white text-stone-300'
                "
              >
                <Check v-if="isCompletedStatus(index)" :size="16" />

                <Circle
                  v-else
                  :size="11"
                  :fill="isCurrentStatus(index) ? 'currentColor' : 'none'"
                />
              </div>

              <div class="min-w-0 pt-1">
                <p
                  class="font-semibold"
                  :class="index <= currentStatusIndex ? 'text-brand-brown-900' : 'text-stone-400'"
                >
                  {{ statusLabels[status] }}
                </p>

                <p v-if="getHistoryEntry(status)" class="mt-1 text-xs text-stone-500">
                  {{ formatDateTime(getHistoryEntry(status).changedAt) }}
                </p>

                <p v-else class="mt-1 text-xs text-stone-400">Još nije dosegnuto</p>
              </div>
            </li>
          </ol>
        </section>
      </div>

      <ConfirmationModal
        :open="statusModalOpen"
        :loading="statusUpdating"
        :error="statusError"
        :title="statusModalTitle"
        :message="statusModalMessage"
        confirm-text="Promijeni status"
        loading-text="Ažuriranje..."
        cancel-text="Odustani"
        @confirm="confirmStatusChange"
        @cancel="closeStatusModal"
      />
    </template>
  </section>
</template>
