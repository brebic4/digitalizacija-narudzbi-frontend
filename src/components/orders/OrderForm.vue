<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  AlertCircle,
  CalendarDays,
  FileText,
  LoaderCircle,
  PackagePlus,
  Plus,
  Save,
  Search,
  Trash2,
  UserRound,
} from 'lucide-vue-next'

import { getCustomers } from '../../services/customers.service'
import { getProducts } from '../../services/products.service'

const props = defineProps({
  initialData: {
    type: Object,
    default: null,
  },

  loading: {
    type: Boolean,
    default: false,
  },

  serverError: {
    type: String,
    default: '',
  },

  submitText: {
    type: String,
    default: 'Spremi narudžbu',
  },
})

const emit = defineEmits(['submit'])

const customers = ref([])
const products = ref([])

const loadingCustomers = ref(false)
const loadingProducts = ref(false)
const referenceDataError = ref('')

const customerSearch = ref('')
const productSearches = ref({})

const form = reactive({
  customerId: '',
  orderNumber: '',
  deliveryDate: '',
  note: '',
  items: [],
})

const errors = reactive({
  customerId: '',
  orderNumber: '',
  deliveryDate: '',
  items: '',
})

const filteredCustomers = computed(() => {
  const query = customerSearch.value.trim().toLowerCase()

  if (!query) {
    return customers.value
  }

  return customers.value.filter((customer) => {
    return [customer.name, customer.oib, customer.city]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  })
})

const selectedCustomer = computed(() => {
  return customers.value.find((customer) => customer._id === form.customerId)
})

const summary = computed(() => {
  const validItems = form.items.filter((item) => item.productId)

  const totalPackages = validItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)

  const totalWeightGrams = validItems.reduce((sum, item) => {
    const product = getProductById(item.productId)

    return sum + Number(item.quantity || 0) * Number(product?.packageWeightGrams || 0)
  }, 0)

  return {
    itemsCount: validItems.length,
    totalPackages,
    totalWeightGrams,
    totalWeightKg: totalWeightGrams / 1000,
  }
})

function resetErrors() {
  errors.customerId = ''
  errors.orderNumber = ''
  errors.deliveryDate = ''
  errors.items = ''
}

function getProductById(productId) {
  return products.value.find((product) => product._id === productId)
}

function availableProductsForItem(itemIndex) {
  const currentProductId = form.items[itemIndex]?.productId

  const usedProductIds = new Set(
    form.items.map((item, index) => (index === itemIndex ? null : item.productId)).filter(Boolean),
  )

  const search = productSearches.value[itemIndex]?.trim().toLowerCase() || ''

  return products.value.filter((product) => {
    if (usedProductIds.has(product._id) && product._id !== currentProductId) {
      return false
    }

    if (!search) {
      return true
    }

    return [product.name, product.code, product.barcode]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search))
  })
}

function addItem() {
  form.items.push({
    productId: '',
    quantity: 1,
    customerProductCode: '',
    customerBarcode: '',
    originalProductName: '',
  })

  productSearches.value[form.items.length - 1] = ''
  errors.items = ''
}

function removeItem(index) {
  form.items.splice(index, 1)

  const nextSearches = {}

  form.items.forEach((_, newIndex) => {
    nextSearches[newIndex] =
      productSearches.value[newIndex >= index ? newIndex + 1 : newIndex] || ''
  })

  productSearches.value = nextSearches
}

function validateForm() {
  resetErrors()

  if (!form.customerId) {
    errors.customerId = 'Potrebno je odabrati kupca.'
  }

  if (!form.orderNumber.trim()) {
    errors.orderNumber = 'Broj narudžbe je obavezan.'
  }

  if (!form.deliveryDate) {
    errors.deliveryDate = 'Datum isporuke je obavezan.'
  }

  if (form.items.length === 0) {
    errors.items = 'Narudžba mora sadržavati najmanje jednu stavku.'
  } else {
    const invalidItem = form.items.find(
      (item) =>
        !item.productId || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0,
    )

    if (invalidItem) {
      errors.items = 'Svaka stavka mora imati proizvod i količinu veću od 0.'
    }

    const productIds = form.items.map((item) => item.productId).filter(Boolean)

    if (new Set(productIds).size !== productIds.length) {
      errors.items = 'Isti proizvod nije moguće dodati više puta.'
    }
  }

  return !Object.values(errors).some(Boolean)
}

function buildPayload() {
  return {
    customerId: form.customerId,
    orderNumber: form.orderNumber.trim(),
    deliveryDate: form.deliveryDate,
    note: form.note.trim(),

    items: form.items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),

      customerProductCode: item.customerProductCode.trim(),

      customerBarcode: item.customerBarcode.trim(),

      originalProductName: item.originalProductName.trim(),
    })),
  }
}

function handleSubmit() {
  if (!validateForm()) {
    return
  }

  emit('submit', buildPayload())
}

function fillForm(data = null) {
  form.customerId = data?.customerId || ''
  form.orderNumber = data?.orderNumber || ''
  form.deliveryDate = data?.deliveryDate ? String(data.deliveryDate).slice(0, 10) : ''
  form.note = data?.note || ''

  form.items = Array.isArray(data?.items)
    ? data.items.map((item) => ({
        productId: item.productId || '',
        quantity: Number(item.quantity || 1),
        customerProductCode: item.customerProductCode || '',
        customerBarcode: item.customerBarcode || '',
        originalProductName: item.originalProductName || '',
      }))
    : []

  productSearches.value = {}

  form.items.forEach((_, index) => {
    productSearches.value[index] = ''
  })

  resetErrors()
}

async function loadReferenceData() {
  referenceDataError.value = ''
  loadingCustomers.value = true
  loadingProducts.value = true

  try {
    const [customersResponse, productsResponse] = await Promise.all([
      getCustomers({
        page: 1,
        limit: 100,
      }),

      getProducts({
        page: 1,
        limit: 100,
      }),
    ])

    customers.value = customersResponse.data.filter((customer) => customer.active)

    products.value = productsResponse.data.filter((product) => product.active)
  } catch (err) {
    referenceDataError.value =
      err.response?.data?.message || 'Kupce i proizvode nije moguće dohvatiti.'
  } finally {
    loadingCustomers.value = false
    loadingProducts.value = false
  }
}

watch(
  () => props.initialData,
  (data) => {
    fillForm(data)
  },
  {
    deep: true,
  },
)

onMounted(async () => {
  fillForm(props.initialData)
  await loadReferenceData()

  if (form.items.length === 0) {
    addItem()
  }
})
</script>

<template>
  <form class="space-y-6" @submit.prevent="handleSubmit">
    <div
      v-if="referenceDataError"
      class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
    >
      {{ referenceDataError }}
    </div>

    <div
      v-if="serverError"
      class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
    >
      {{ serverError }}
    </div>

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

      <div class="mt-6">
        <label for="customer-search" class="mb-2 block text-sm font-semibold text-brand-brown-900">
          Pretraga kupaca
        </label>

        <div class="relative">
          <Search
            :size="18"
            class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
          />

          <input
            id="customer-search"
            v-model="customerSearch"
            type="search"
            placeholder="Pretraži prema nazivu, OIB-u ili gradu..."
            class="w-full rounded-xl border border-brand-border bg-brand-cream-50 py-3 pl-11 pr-4 text-sm text-brand-brown-900 outline-none transition focus:border-brand-red-700 focus:bg-white focus:ring-2 focus:ring-brand-red-700/10"
            :disabled="loadingCustomers || loading"
          />
        </div>
      </div>

      <div class="mt-4">
        <label for="customer-id" class="mb-2 block text-sm font-semibold text-brand-brown-900">
          Odaberite kupca *
        </label>

        <select
          id="customer-id"
          v-model="form.customerId"
          class="w-full rounded-xl border bg-brand-cream-50 px-4 py-3 text-sm text-brand-brown-900 outline-none transition focus:bg-white focus:ring-2"
          :class="
            errors.customerId
              ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
              : 'border-brand-border focus:border-brand-red-700 focus:ring-brand-red-700/10'
          "
          :disabled="loadingCustomers || loading"
        >
          <option value="">Odaberite kupca</option>

          <option v-for="customer in filteredCustomers" :key="customer._id" :value="customer._id">
            {{ customer.name }}
            {{ customer.oib ? `— ${customer.oib}` : '' }}
          </option>
        </select>

        <p v-if="errors.customerId" class="mt-2 text-xs text-red-600">
          {{ errors.customerId }}
        </p>

        <div v-if="selectedCustomer" class="mt-4 rounded-xl bg-brand-cream-50 p-4">
          <p class="font-semibold text-brand-brown-900">
            {{ selectedCustomer.name }}
          </p>

          <p class="mt-1 text-sm text-stone-500">
            OIB:
            {{ selectedCustomer.oib || '—' }}
          </p>

          <p class="mt-1 text-sm text-stone-500">
            {{ selectedCustomer.address || '' }}
            {{ selectedCustomer.city || '' }}
          </p>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-6">
      <div class="flex items-center gap-3">
        <div
          class="flex size-11 items-center justify-center rounded-xl bg-brand-cream-100 text-brand-brown-900"
        >
          <FileText :size="22" />
        </div>

        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red-700">
            Osnovni podaci
          </p>

          <h3 class="mt-1 text-xl font-bold text-brand-brown-900">Narudžba</h3>
        </div>
      </div>

      <div class="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label for="order-number" class="mb-2 block text-sm font-semibold text-brand-brown-900">
            Broj narudžbe *
          </label>

          <input
            id="order-number"
            v-model="form.orderNumber"
            type="text"
            placeholder="Unesite broj narudžbe"
            class="w-full rounded-xl border bg-brand-cream-50 px-4 py-3 text-sm text-brand-brown-900 outline-none transition focus:bg-white focus:ring-2"
            :class="
              errors.orderNumber
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : 'border-brand-border focus:border-brand-red-700 focus:ring-brand-red-700/10'
            "
            :disabled="loading"
          />

          <p v-if="errors.orderNumber" class="mt-2 text-xs text-red-600">
            {{ errors.orderNumber }}
          </p>
        </div>

        <div>
          <label for="delivery-date" class="mb-2 block text-sm font-semibold text-brand-brown-900">
            Datum isporuke *
          </label>

          <div class="relative">
            <CalendarDays
              :size="18"
              class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            />

            <input
              id="delivery-date"
              v-model="form.deliveryDate"
              type="date"
              class="w-full rounded-xl border bg-brand-cream-50 py-3 pl-11 pr-4 text-sm text-brand-brown-900 outline-none transition focus:bg-white focus:ring-2"
              :class="
                errors.deliveryDate
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                  : 'border-brand-border focus:border-brand-red-700 focus:ring-brand-red-700/10'
              "
              :disabled="loading"
            />
          </div>

          <p v-if="errors.deliveryDate" class="mt-2 text-xs text-red-600">
            {{ errors.deliveryDate }}
          </p>
        </div>

        <div class="sm:col-span-2">
          <label for="order-note" class="mb-2 block text-sm font-semibold text-brand-brown-900">
            Napomena
          </label>

          <textarea
            id="order-note"
            v-model="form.note"
            rows="4"
            placeholder="Unesite napomenu uz narudžbu"
            class="w-full resize-y rounded-xl border border-brand-border bg-brand-cream-50 px-4 py-3 text-sm text-brand-brown-900 outline-none transition focus:border-brand-red-700 focus:bg-white focus:ring-2 focus:ring-brand-red-700/10"
            :disabled="loading"
          />
        </div>
      </div>
    </section>

    <section class="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm">
      <header
        class="flex flex-col gap-4 border-b border-brand-border p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red-700">
            Sadržaj narudžbe
          </p>

          <h3 class="mt-1 text-xl font-bold text-brand-brown-900">Stavke</h3>
        </div>

        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-red-700 px-4 py-2.5 text-sm font-semibold text-brand-red-700 transition hover:bg-brand-red-700 hover:text-white"
          :disabled="loadingProducts || loading"
          @click="addItem"
        >
          <Plus :size="18" />
          Dodaj proizvod
        </button>
      </header>

      <div class="space-y-4 p-5 sm:p-6">
        <div
          v-if="errors.items"
          class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <div class="flex items-center gap-2">
            <AlertCircle :size="18" />
            {{ errors.items }}
          </div>
        </div>

        <article
          v-for="(item, index) in form.items"
          :key="index"
          class="rounded-2xl border border-brand-border bg-brand-cream-50 p-4"
        >
          <div class="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_160px_48px]">
            <div>
              <label
                :for="`product-search-${index}`"
                class="mb-2 block text-sm font-semibold text-brand-brown-900"
              >
                Proizvod *
              </label>

              <input
                :id="`product-search-${index}`"
                v-model="productSearches[index]"
                type="search"
                placeholder="Pretraži proizvod..."
                class="mb-3 w-full rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm text-brand-brown-900 outline-none transition focus:border-brand-red-700 focus:ring-2 focus:ring-brand-red-700/10"
                :disabled="loadingProducts || loading"
              />

              <select
                v-model="item.productId"
                class="w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-sm text-brand-brown-900 outline-none transition focus:border-brand-red-700 focus:ring-2 focus:ring-brand-red-700/10"
                :disabled="loadingProducts || loading"
              >
                <option value="">Odaberite proizvod</option>

                <option
                  v-for="product in availableProductsForItem(index)"
                  :key="product._id"
                  :value="product._id"
                >
                  {{ product.name }}
                  — {{ product.code }} — {{ product.packageWeightGrams }} g
                </option>
              </select>

              <div
                v-if="getProductById(item.productId)"
                class="mt-3 grid gap-2 rounded-xl bg-white p-3 text-xs text-stone-600 sm:grid-cols-3"
              >
                <span>
                  Šifra:
                  <strong>
                    {{ getProductById(item.productId)?.code }}
                  </strong>
                </span>

                <span>
                  Barkod:
                  <strong>
                    {{ getProductById(item.productId)?.barcode }}
                  </strong>
                </span>

                <span>
                  Pakiranje:
                  <strong>
                    {{ getProductById(item.productId)?.packageWeightGrams }}
                    g
                  </strong>
                </span>
              </div>
            </div>

            <div>
              <label
                :for="`quantity-${index}`"
                class="mb-2 block text-sm font-semibold text-brand-brown-900"
              >
                Količina *
              </label>

              <input
                :id="`quantity-${index}`"
                v-model.number="item.quantity"
                type="number"
                min="1"
                step="1"
                class="w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-sm text-brand-brown-900 outline-none transition focus:border-brand-red-700 focus:ring-2 focus:ring-brand-red-700/10"
                :disabled="loading"
              />

              <p v-if="getProductById(item.productId)" class="mt-3 text-xs text-stone-500">
                Ukupna težina:
                <strong class="text-brand-brown-900">
                  {{
                    (
                      (Number(item.quantity || 0) *
                        Number(getProductById(item.productId)?.packageWeightGrams || 0)) /
                      1000
                    ).toLocaleString('hr-HR')
                  }}
                  kg
                </strong>
              </p>
            </div>

            <div class="flex items-end">
              <button
                type="button"
                class="inline-flex size-11 items-center justify-center rounded-xl border border-red-200 bg-white text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="loading || form.items.length === 1"
                aria-label="Ukloni stavku"
                @click="removeItem(index)"
              >
                <Trash2 :size="19" />
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-6">
      <div class="flex items-center gap-3">
        <div
          class="flex size-11 items-center justify-center rounded-xl bg-brand-cream-100 text-brand-brown-900"
        >
          <PackagePlus :size="22" />
        </div>

        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red-700">
            Automatski izračun
          </p>

          <h3 class="mt-1 text-xl font-bold text-brand-brown-900">Sažetak</h3>
        </div>
      </div>

      <div class="mt-6 grid gap-4 sm:grid-cols-3">
        <article class="rounded-xl bg-brand-cream-50 p-4">
          <p class="text-sm text-stone-500">Različitih proizvoda</p>

          <p class="mt-2 text-3xl font-bold text-brand-brown-900">
            {{ summary.itemsCount }}
          </p>
        </article>

        <article class="rounded-xl bg-brand-cream-50 p-4">
          <p class="text-sm text-stone-500">Ukupno pakiranja</p>

          <p class="mt-2 text-3xl font-bold text-brand-brown-900">
            {{ summary.totalPackages.toLocaleString('hr-HR') }}
          </p>
        </article>

        <article class="rounded-xl bg-brand-cream-50 p-4">
          <p class="text-sm text-stone-500">Ukupna težina</p>

          <p class="mt-2 text-3xl font-bold text-brand-brown-900">
            {{
              summary.totalWeightKg.toLocaleString('hr-HR', {
                maximumFractionDigits: 2,
              })
            }}
            kg
          </p>
        </article>
      </div>
    </section>

    <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        type="submit"
        class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-red-800 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="loading || loadingCustomers || loadingProducts"
      >
        <LoaderCircle v-if="loading" :size="19" class="animate-spin" />

        <Save v-else :size="19" />

        {{ loading ? 'Spremanje...' : submitText }}
      </button>
    </div>
  </form>
</template>
