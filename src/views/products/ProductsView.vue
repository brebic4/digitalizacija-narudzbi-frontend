<script setup>
import { onMounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, Package, Plus, RefreshCw, Search } from 'lucide-vue-next'

import { getProducts, createProduct, updateProduct } from '../../services/products.service'
import ProductFormModal from '../../components/products/ProductFormModal.vue'

const products = ref([])
const loading = ref(false)
const error = ref('')

const search = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)

const formModalOpen = ref(false)
const selectedProduct = ref(null)
const savingProduct = ref(false)
const formError = ref('')
const successMessage = ref('')

const pagination = ref({
  totalItems: 0,
  currentPage: 1,
  itemsPerPage: 10,
  totalPages: 0,
})

let searchTimeout

function openCreateModal() {
  selectedProduct.value = null
  formError.value = ''
  formModalOpen.value = true
}

function openEditModal(product) {
  selectedProduct.value = product
  formError.value = ''
  formModalOpen.value = true
}

function closeFormModal() {
  if (savingProduct.value) {
    return
  }

  formModalOpen.value = false
  selectedProduct.value = null
  formError.value = ''
}

async function handleProductSubmit(payload) {
  savingProduct.value = true
  formError.value = ''
  successMessage.value = ''
  error.value = ''

  try {
    if (selectedProduct.value?._id) {
      await updateProduct(selectedProduct.value._id, payload)

      successMessage.value = 'Proizvod je uspješno ažuriran.'
    } else {
      await createProduct(payload)

      successMessage.value = 'Proizvod je uspješno dodan.'
    }

    formModalOpen.value = false
    selectedProduct.value = null

    currentPage.value = 1
    await loadProducts()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Podatke o proizvodu nije moguće spremiti.'
  } finally {
    savingProduct.value = false
  }
}

async function loadProducts() {
  loading.value = true
  error.value = ''

  try {
    const response = await getProducts({
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: search.value.trim(),
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

    products.value = response.data
    pagination.value = receivedPagination
  } catch (err) {
    error.value = err.response?.data?.message || 'Proizvodi nisu mogli biti dohvaćeni.'
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

watch(search, () => {
  clearTimeout(searchTimeout)

  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadProducts()
  }, 350)
})

watch(currentPage, loadProducts)

watch(itemsPerPage, () => {
  currentPage.value = 1
  loadProducts()
})

onMounted(loadProducts)
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-brand-red-700">
          Evidencija artikala
        </p>

        <h2 class="mt-1 text-3xl font-bold text-brand-brown-900">Proizvodi</h2>

        <p class="mt-3 max-w-2xl text-stone-600">
          Pregled proizvoda koji se koriste u obradi narudžbi.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-red-800"
        @click="openCreateModal"
      >
        <Plus :size="18" />
        Dodaj proizvod
      </button>
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

    <section class="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm">
      <div
        class="flex flex-col gap-4 border-b border-brand-border p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="relative w-full sm:max-w-md">
          <Search
            :size="19"
            class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />

          <input
            v-model="search"
            type="search"
            placeholder="Pretraži po nazivu, šifri ili barkodu..."
            class="w-full rounded-xl border border-brand-border bg-brand-cream-50 py-2.5 pl-10 pr-4 text-sm text-brand-brown-900 outline-none transition placeholder:text-stone-400 focus:border-brand-red-700 focus:ring-2 focus:ring-brand-red-700/10"
          />
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
            @click="loadProducts"
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
          class="h-16 animate-pulse rounded-xl bg-brand-cream-100"
        />
      </div>

      <div
        v-else-if="products.length === 0"
        class="flex flex-col items-center justify-center px-6 py-16 text-center"
      >
        <div
          class="flex size-14 items-center justify-center rounded-full bg-brand-cream-100 text-brand-brown-900"
        >
          <Package :size="27" />
        </div>

        <h3 class="mt-4 font-semibold text-brand-brown-900">Nema pronađenih proizvoda</h3>

        <p class="mt-2 max-w-sm text-sm text-stone-500">
          Dodajte prvi proizvod ili promijenite pojam pretrage.
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-brand-border">
          <thead class="bg-brand-cream-100/70">
            <tr>
              <th
                class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6"
              >
                Naziv
              </th>

              <th
                class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500"
              >
                Interna šifra
              </th>

              <th
                class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500"
              >
                Barkod
              </th>

              <th
                class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500"
              >
                Pakiranje
              </th>

              <th
                class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500"
              >
                Status
              </th>

              <th
                class="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6"
              >
                Akcije
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-brand-border">
            <tr
              v-for="product in products"
              :key="product._id"
              class="transition hover:bg-brand-cream-50"
            >
              <td class="px-5 py-4 sm:px-6">
                <p class="font-semibold text-brand-brown-900">
                  {{ product.name }}
                </p>
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-sm text-stone-700">
                {{ product.code || '—' }}
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-sm text-stone-700">
                {{ product.barcode || '—' }}
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-sm text-stone-700">
                {{ product.packageWeightGrams || 0 }} g /
                {{ product.unit || 'kom' }}
              </td>

              <td class="whitespace-nowrap px-5 py-4">
                <span
                  class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                  :class="
                    product.active ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'
                  "
                >
                  {{ product.active ? 'Aktivan' : 'Neaktivan' }}
                </span>
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-right sm:px-6">
                <div class="inline-flex items-center gap-2">
                  <button
                    type="button"
                    class="rounded-lg border border-brand-border px-3 py-2 text-xs font-semibold text-brand-brown-900 transition hover:border-brand-red-700 hover:text-brand-red-700"
                    @click="openEditModal(product)"
                  >
                    Uredi
                  </button>

                  <button
                    type="button"
                    class="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    Obriši
                  </button>
                </div>
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
          proizvoda
        </p>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex size-9 items-center justify-center rounded-lg border border-brand-border text-brand-brown-900 transition hover:border-brand-red-700 hover:text-brand-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="currentPage <= 1"
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
            @click="goToPage(currentPage + 1)"
          >
            <ChevronRight :size="18" />
          </button>
        </div>
      </div>
    </section>

    <ProductFormModal
      :open="formModalOpen"
      :product="selectedProduct"
      :loading="savingProduct"
      :server-error="formError"
      @close="closeFormModal"
      @submit="handleProductSubmit"
    />
  </section>
</template>
