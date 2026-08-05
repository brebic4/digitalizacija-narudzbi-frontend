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
  ClipboardList,
  Scale,
  Truck,
  Award,
  Boxes,
  Building2,
  PackageSearch,
  UsersRound,
} from 'lucide-vue-next'

import { getDashboardSummary } from '../../services/dashboard.service'

const statistics = ref({
  totalOrders: 0,
  activeOrders: 0,
  deliveredOrders: 0,
  dueToday: 0,
  inPreparation: 0,
  readyForDelivery: 0,
  overdueOrders: 0,
  totalPackages: 0,
  totalWeightKg: 0,
})

const recentOrders = ref([])
const statusDistribution = ref({
  zaprimljena: 0,
  obrađena: 0,
  u_pripremi: 0,
  spremna_za_isporuku: 0,
  isporučena: 0,
})

const topCustomers = ref([])
const topProducts = ref([])
const loading = ref(true)
const error = ref('')

const statisticCards = computed(() => [
  {
    title: 'Ukupno narudžbi',
    value: statistics.value.totalOrders,
    description: 'Sve narudžbe evidentirane u sustavu',
    icon: ClipboardList,
    iconClasses: 'bg-brand-cream-100 text-brand-red-700',
    valueSuffix: '',
  },
  {
    title: 'Aktivne narudžbe',
    value: statistics.value.activeOrders,
    description: 'Sve narudžbe koje još nisu isporučene',
    icon: ShoppingCart,
    iconClasses: 'bg-brand-red-700/10 text-brand-red-700',
    valueSuffix: '',
  },
  {
    title: 'Isporučene',
    value: statistics.value.deliveredOrders,
    description: 'Narudžbe uspješno završene i isporučene',
    icon: Truck,
    iconClasses: 'bg-emerald-100 text-emerald-700',
    valueSuffix: '',
  },
  {
    title: 'Rok danas',
    value: statistics.value.dueToday,
    description: 'Narudžbe koje treba isporučiti danas',
    icon: CalendarClock,
    iconClasses: 'bg-amber-100 text-amber-700',
    valueSuffix: '',
  },
  {
    title: 'U pripremi',
    value: statistics.value.inPreparation,
    description: 'Narudžbe koje se trenutačno pripremaju',
    icon: Clock3,
    iconClasses: 'bg-blue-100 text-blue-700',
    valueSuffix: '',
  },
  {
    title: 'Spremne za isporuku',
    value: statistics.value.readyForDelivery,
    description: 'Zapakirane narudžbe koje čekaju isporuku',
    icon: PackageCheck,
    iconClasses: 'bg-green-100 text-green-700',
    valueSuffix: '',
  },
  {
    title: 'Zakašnjele',
    value: statistics.value.overdueOrders,
    description: 'Rok je prošao, a narudžba nije isporučena',
    icon: AlertTriangle,
    iconClasses: 'bg-red-100 text-red-700',
    valueSuffix: '',
  },
  {
    title: 'Ukupno pakiranja',
    value: statistics.value.totalPackages,
    description: 'Ukupan broj pakiranja u svim narudžbama',
    icon: PackageCheck,
    iconClasses: 'bg-violet-100 text-violet-700',
    valueSuffix: '',
  },
  {
    title: 'Ukupna težina',
    value: statistics.value.totalWeightKg,
    description: 'Ukupna težina proizvoda u svim narudžbama',
    icon: Scale,
    iconClasses: 'bg-cyan-100 text-cyan-700',
    valueSuffix: ' kg',
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

const statusOverview = computed(() => [
  {
    status: 'zaprimljena',
    label: 'Zaprimljene',
    value: statusDistribution.value.zaprimljena,
    barClasses: 'bg-stone-500',
    badgeClasses: 'bg-stone-100 text-stone-700',
  },
  {
    status: 'obrađena',
    label: 'Obrađene',
    value: statusDistribution.value.obrađena,
    barClasses: 'bg-blue-500',
    badgeClasses: 'bg-blue-100 text-blue-700',
  },
  {
    status: 'u_pripremi',
    label: 'U pripremi',
    value: statusDistribution.value.u_pripremi,
    barClasses: 'bg-amber-500',
    badgeClasses: 'bg-amber-100 text-amber-700',
  },
  {
    status: 'spremna_za_isporuku',
    label: 'Spremne za isporuku',
    value: statusDistribution.value.spremna_za_isporuku,
    barClasses: 'bg-green-500',
    badgeClasses: 'bg-green-100 text-green-700',
  },
  {
    status: 'isporučena',
    label: 'Isporučene',
    value: statusDistribution.value.isporučena,
    barClasses: 'bg-emerald-600',
    badgeClasses: 'bg-emerald-100 text-emerald-700',
  },
])

const maximumStatusCount = computed(() => {
  const values = statusOverview.value.map((item) => Number(item.value || 0))

  return Math.max(...values, 1)
})

const maximumCustomerOrders = computed(() => {
  const values = topCustomers.value.map((customer) => Number(customer.ordersCount || 0))

  return Math.max(...values, 1)
})

const maximumProductPackages = computed(() => {
  const values = topProducts.value.map((product) => Number(product.totalPackages || 0))

  return Math.max(...values, 1)
})

function getPercentage(value, maximum) {
  const numericValue = Number(value || 0)
  const numericMaximum = Number(maximum || 1)

  if (numericValue <= 0) {
    return 0
  }

  return Math.max(Math.round((numericValue / numericMaximum) * 100), 6)
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
  return new Intl.NumberFormat('hr-HR', {
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}
async function loadDashboard() {
  loading.value = true
  error.value = ''

  try {
    const response = await getDashboardSummary()

    statistics.value = response.data.statistics

    statusDistribution.value = {
      zaprimljena: response.data.statusDistribution?.zaprimljena || 0,

      obrađena: response.data.statusDistribution?.obrađena || 0,

      u_pripremi: response.data.statusDistribution?.u_pripremi || 0,

      spremna_za_isporuku: response.data.statusDistribution?.spremna_za_isporuku || 0,

      isporučena: response.data.statusDistribution?.isporučena || 0,
    }

    topCustomers.value = Array.isArray(response.data.topCustomers) ? response.data.topCustomers : []

    topProducts.value = Array.isArray(response.data.topProducts) ? response.data.topProducts : []

    recentOrders.value = Array.isArray(response.data.recentOrders) ? response.data.recentOrders : []
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

    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="index in 9"
        :key="index"
        class="h-44 animate-pulse rounded-2xl border border-brand-border bg-white"
      />
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
              {{ formatNumber(card.value) }}{{ card.valueSuffix }}
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

    <div class="grid gap-6 xl:grid-cols-2">
      <!-- Raspodjela statusa -->
      <section class="rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-6">
        <div class="flex items-center gap-3">
          <div
            class="flex size-11 items-center justify-center rounded-xl bg-brand-cream-100 text-brand-red-700"
          >
            <Boxes :size="22" />
          </div>

          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red-700">
              Trenutačno stanje
            </p>

            <h3 class="mt-1 text-xl font-bold text-brand-brown-900">Raspodjela narudžbi</h3>
          </div>
        </div>

        <div v-if="loading" class="mt-6 space-y-5">
          <div v-for="index in 5" :key="index" class="space-y-2">
            <div class="h-4 w-32 animate-pulse rounded bg-brand-cream-100" />

            <div class="h-2 animate-pulse rounded-full bg-brand-cream-100" />
          </div>
        </div>

        <div
          v-else-if="statistics.totalOrders === 0"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <div
            class="flex size-14 items-center justify-center rounded-full bg-brand-cream-100 text-brand-brown-900"
          >
            <CheckCircle2 :size="26" />
          </div>

          <p class="mt-4 font-semibold text-brand-brown-900">Još nema narudžbi</p>

          <p class="mt-2 text-sm text-stone-500">
            Raspodjela statusa prikazat će se nakon dodavanja narudžbi.
          </p>
        </div>

        <div v-else class="mt-6 space-y-5">
          <article v-for="item in statusOverview" :key="item.status">
            <div class="mb-2 flex items-center justify-between gap-4">
              <div class="flex items-center gap-2">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="item.badgeClasses"
                >
                  {{ item.label }}
                </span>
              </div>

              <span class="text-sm font-bold text-brand-brown-900">
                {{ formatNumber(item.value) }}
              </span>
            </div>

            <div class="h-2.5 overflow-hidden rounded-full bg-brand-cream-100">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="item.barClasses"
                :style="{
                  width: `${getPercentage(item.value, maximumStatusCount)}%`,
                }"
              />
            </div>
          </article>
        </div>
      </section>

      <!-- Top kupci -->
      <section class="rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-6">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div
              class="flex size-11 items-center justify-center rounded-xl bg-brand-cream-100 text-brand-red-700"
            >
              <UsersRound :size="22" />
            </div>

            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red-700">
                Poslovni partneri
              </p>

              <h3 class="mt-1 text-xl font-bold text-brand-brown-900">Top kupci</h3>
            </div>
          </div>

          <RouterLink
            to="/customers"
            class="text-sm font-semibold text-brand-red-700 hover:underline"
          >
            Svi kupci
          </RouterLink>
        </div>

        <div v-if="loading" class="mt-6 space-y-4">
          <div
            v-for="index in 5"
            :key="index"
            class="h-16 animate-pulse rounded-xl bg-brand-cream-100"
          />
        </div>

        <div
          v-else-if="topCustomers.length === 0"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <div
            class="flex size-14 items-center justify-center rounded-full bg-brand-cream-100 text-brand-brown-900"
          >
            <Building2 :size="26" />
          </div>

          <p class="mt-4 font-semibold text-brand-brown-900">Nema podataka o kupcima</p>

          <p class="mt-2 text-sm text-stone-500">Kupci će se rangirati nakon dodavanja narudžbi.</p>
        </div>

        <ol v-else class="mt-6 space-y-4">
          <li
            v-for="(customer, index) in topCustomers"
            :key="customer.customerId || customer.customerName"
            class="rounded-xl border border-brand-border bg-brand-cream-50 p-4"
          >
            <div class="flex items-center gap-4">
              <div
                class="flex size-10 shrink-0 items-center justify-center rounded-full font-bold"
                :class="
                  index === 0 ? 'bg-amber-100 text-amber-700' : 'bg-white text-brand-brown-900'
                "
              >
                <Award v-if="index === 0" :size="19" />

                <span v-else>
                  {{ index + 1 }}
                </span>
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0">
                    <p class="truncate font-semibold text-brand-brown-900">
                      {{ customer.customerName }}
                    </p>

                    <p class="mt-1 text-xs text-stone-500">
                      {{ formatNumber(customer.totalPackages) }}
                      pakiranja
                    </p>
                  </div>

                  <div class="shrink-0 text-right">
                    <p class="text-lg font-bold text-brand-brown-900">
                      {{ formatNumber(customer.ordersCount) }}
                    </p>

                    <p class="text-xs text-stone-500">narudžbi</p>
                  </div>
                </div>

                <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
                  <div
                    class="h-full rounded-full bg-brand-red-700 transition-all duration-500"
                    :style="{
                      width: `${getPercentage(customer.ordersCount, maximumCustomerOrders)}%`,
                    }"
                  />
                </div>
              </div>
            </div>
          </li>
        </ol>
      </section>
    </div>

    <section class="rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <div
            class="flex size-11 items-center justify-center rounded-xl bg-brand-cream-100 text-brand-red-700"
          >
            <PackageSearch :size="22" />
          </div>

          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red-700">
              Prodajni rezultati
            </p>

            <h3 class="mt-1 text-xl font-bold text-brand-brown-900">Najnaručivaniji proizvodi</h3>
          </div>
        </div>

        <RouterLink to="/products" class="text-sm font-semibold text-brand-red-700 hover:underline">
          Svi proizvodi
        </RouterLink>
      </div>

      <div v-if="loading" class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div
          v-for="index in 5"
          :key="index"
          class="h-40 animate-pulse rounded-xl bg-brand-cream-100"
        />
      </div>

      <div
        v-else-if="topProducts.length === 0"
        class="flex flex-col items-center justify-center py-12 text-center"
      >
        <div
          class="flex size-14 items-center justify-center rounded-full bg-brand-cream-100 text-brand-brown-900"
        >
          <PackageSearch :size="26" />
        </div>

        <p class="mt-4 font-semibold text-brand-brown-900">Nema podataka o proizvodima</p>

        <p class="mt-2 text-sm text-stone-500">
          Proizvodi će se rangirati nakon dodavanja narudžbi.
        </p>
      </div>

      <ol v-else class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <li
          v-for="(product, index) in topProducts"
          :key="product.productId || product.productName"
          class="relative overflow-hidden rounded-2xl border border-brand-border bg-brand-cream-50 p-4"
        >
          <div
            class="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-xs font-bold"
            :class="index === 0 ? 'bg-amber-100 text-amber-700' : 'bg-white text-brand-brown-900'"
          >
            <Award v-if="index === 0" :size="16" />

            <span v-else>
              {{ index + 1 }}
            </span>
          </div>

          <div
            class="flex size-11 items-center justify-center rounded-xl bg-white text-brand-red-700"
          >
            <PackageCheck :size="22" />
          </div>

          <p class="mt-4 pr-8 font-bold leading-5 text-brand-brown-900">
            {{ product.productName }}
          </p>

          <p class="mt-1 text-xs text-stone-500">
            {{ product.productCode || 'Bez šifre' }}
          </p>

          <div class="mt-5 space-y-3">
            <div>
              <div class="flex items-center justify-between gap-3 text-xs">
                <span class="text-stone-500"> Pakiranja </span>

                <strong class="text-brand-brown-900">
                  {{ formatNumber(product.totalPackages) }}
                </strong>
              </div>

              <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                <div
                  class="h-full rounded-full bg-brand-red-700 transition-all duration-500"
                  :style="{
                    width: `${getPercentage(product.totalPackages, maximumProductPackages)}%`,
                  }"
                />
              </div>
            </div>

            <div
              class="flex items-center justify-between border-t border-brand-border pt-3 text-xs"
            >
              <span class="text-stone-500"> Narudžbi </span>

              <strong class="text-brand-brown-900">
                {{ formatNumber(product.ordersCount) }}
              </strong>
            </div>

            <div class="flex items-center justify-between text-xs">
              <span class="text-stone-500"> Težina </span>

              <strong class="text-brand-brown-900">
                {{ formatNumber(product.totalWeightKg) }}
                kg
              </strong>
            </div>
          </div>
        </li>
      </ol>
    </section>

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
