<script setup>
import { computed, reactive, watch } from 'vue'
import { LoaderCircle, Save, X } from 'lucide-vue-next'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },

  product: {
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
})

const emit = defineEmits(['close', 'submit'])

const form = reactive({
  name: '',
  code: '',
  barcode: '',
  packageWeightGrams: '',
  unit: 'kom',
  active: true,
})

const errors = reactive({
  name: '',
  code: '',
  barcode: '',
  packageWeightGrams: '',
  unit: '',
})

const isEditMode = computed(() => {
  return Boolean(props.product?._id)
})

const modalTitle = computed(() => {
  return isEditMode.value ? 'Uredi proizvod' : 'Dodaj proizvod'
})

function resetErrors() {
  errors.name = ''
  errors.code = ''
  errors.barcode = ''
  errors.packageWeightGrams = ''
  errors.unit = ''
}

function fillForm(product = null) {
  form.name = product?.name || ''
  form.code = product?.code || ''
  form.barcode = product?.barcode || ''
  form.packageWeightGrams = product?.packageWeightGrams ?? ''
  form.unit = product?.unit || 'kom'
  form.active = product?.active === undefined ? true : Boolean(product.active)

  resetErrors()
}

function normalizeCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
}

function normalizeBarcode(value) {
  return String(value || '').replace(/\D/g, '')
}

function validateForm() {
  resetErrors()

  const normalizedName = form.name.trim()
  const normalizedCode = normalizeCode(form.code)
  const normalizedBarcode = normalizeBarcode(form.barcode)
  const packageWeight = Number(form.packageWeightGrams)

  if (!normalizedName) {
    errors.name = 'Naziv proizvoda je obavezan.'
  }

  if (!normalizedCode) {
    errors.code = 'Interna šifra je obavezna.'
  }

  if (!normalizedBarcode) {
    errors.barcode = 'Barkod je obavezan.'
  } else if (normalizedBarcode.length < 8 || normalizedBarcode.length > 14) {
    errors.barcode = 'Barkod mora sadržavati između 8 i 14 znamenki.'
  }

  if (!form.packageWeightGrams) {
    errors.packageWeightGrams = 'Težina pakiranja je obavezna.'
  } else if (Number.isNaN(packageWeight) || packageWeight <= 0) {
    errors.packageWeightGrams = 'Težina pakiranja mora biti veća od 0.'
  }

  if (!['kom', 'kg'].includes(form.unit)) {
    errors.unit = 'Jedinica nije ispravna.'
  }

  return !Object.values(errors).some(Boolean)
}

function handleSubmit() {
  if (!validateForm()) {
    return
  }

  emit('submit', {
    name: form.name.trim(),
    code: normalizeCode(form.code),
    barcode: normalizeBarcode(form.barcode),
    packageWeightGrams: Number(form.packageWeightGrams),
    unit: form.unit,
    active: form.active,
  })
}

function handleClose() {
  if (props.loading) {
    return
  }

  emit('close')
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      fillForm(props.product)
    }
  },
)

watch(
  () => props.product,
  (product) => {
    if (props.open) {
      fillForm(product)
    }
  },
  {
    deep: true,
  },
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-100 flex items-center justify-center bg-black/50 px-4 py-6"
      @click.self="handleClose"
    >
      <section
        class="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-brand-border bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        :aria-label="modalTitle"
      >
        <header
          class="sticky top-0 z-10 flex items-center justify-between border-b border-brand-border bg-white px-5 py-4 sm:px-6"
        >
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-red-700">
              Evidencija proizvoda
            </p>

            <h2 class="mt-1 text-2xl font-bold text-brand-brown-900">
              {{ modalTitle }}
            </h2>
          </div>

          <button
            type="button"
            class="rounded-lg p-2 text-stone-500 transition hover:bg-brand-cream-100 hover:text-brand-brown-900 disabled:opacity-50"
            aria-label="Zatvori"
            :disabled="loading"
            @click="handleClose"
          >
            <X :size="22" />
          </button>
        </header>

        <form class="space-y-6 p-5 sm:p-6" @submit.prevent="handleSubmit">
          <div
            v-if="serverError"
            class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {{ serverError }}
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label
                for="product-name"
                class="mb-2 block text-sm font-semibold text-brand-brown-900"
              >
                Naziv proizvoda *
              </label>

              <input
                id="product-name"
                v-model="form.name"
                type="text"
                :placeholder="isEditMode ? '' : 'Unesite naziv proizvoda'"
                class="w-full rounded-xl border bg-brand-cream-50 px-4 py-3 text-sm text-brand-brown-900 outline-none transition placeholder:text-stone-400 focus:bg-white focus:ring-2"
                :class="
                  errors.name
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-brand-border focus:border-brand-red-700 focus:ring-brand-red-700/10'
                "
                :disabled="loading"
              />

              <p v-if="errors.name" class="mt-2 text-xs text-red-600">
                {{ errors.name }}
              </p>
            </div>

            <div>
              <label
                for="product-code"
                class="mb-2 block text-sm font-semibold text-brand-brown-900"
              >
                Interna šifra *
              </label>

              <input
                id="product-code"
                v-model="form.code"
                type="text"
                :placeholder="isEditMode ? '' : 'Unesite internu šifru'"
                class="w-full rounded-xl border bg-brand-cream-50 px-4 py-3 text-sm uppercase text-brand-brown-900 outline-none transition placeholder:normal-case placeholder:text-stone-400 focus:bg-white focus:ring-2"
                :class="
                  errors.code
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-brand-border focus:border-brand-red-700 focus:ring-brand-red-700/10'
                "
                :disabled="loading"
              />

              <p v-if="errors.code" class="mt-2 text-xs text-red-600">
                {{ errors.code }}
              </p>
            </div>

            <div>
              <label
                for="product-barcode"
                class="mb-2 block text-sm font-semibold text-brand-brown-900"
              >
                Barkod *
              </label>

              <input
                id="product-barcode"
                v-model="form.barcode"
                type="text"
                inputmode="numeric"
                maxlength="14"
                :placeholder="isEditMode ? '' : 'Unesite barkod proizvoda'"
                class="w-full rounded-xl border bg-brand-cream-50 px-4 py-3 text-sm text-brand-brown-900 outline-none transition placeholder:text-stone-400 focus:bg-white focus:ring-2"
                :class="
                  errors.barcode
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-brand-border focus:border-brand-red-700 focus:ring-brand-red-700/10'
                "
                :disabled="loading"
              />

              <p v-if="errors.barcode" class="mt-2 text-xs text-red-600">
                {{ errors.barcode }}
              </p>
            </div>

            <div>
              <label
                for="product-weight"
                class="mb-2 block text-sm font-semibold text-brand-brown-900"
              >
                Težina pakiranja (g) *
              </label>

              <input
                id="product-weight"
                v-model="form.packageWeightGrams"
                type="number"
                min="1"
                step="1"
                :placeholder="isEditMode ? '' : 'Unesite težinu u gramima'"
                class="w-full rounded-xl border bg-brand-cream-50 px-4 py-3 text-sm text-brand-brown-900 outline-none transition placeholder:text-stone-400 focus:bg-white focus:ring-2"
                :class="
                  errors.packageWeightGrams
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-brand-border focus:border-brand-red-700 focus:ring-brand-red-700/10'
                "
                :disabled="loading"
              />

              <p v-if="errors.packageWeightGrams" class="mt-2 text-xs text-red-600">
                {{ errors.packageWeightGrams }}
              </p>
            </div>

            <div>
              <label
                for="product-unit"
                class="mb-2 block text-sm font-semibold text-brand-brown-900"
              >
                Jedinica *
              </label>

              <select
                id="product-unit"
                v-model="form.unit"
                class="w-full rounded-xl border border-brand-border bg-brand-cream-50 px-4 py-3 text-sm text-brand-brown-900 outline-none transition focus:border-brand-red-700 focus:bg-white focus:ring-2 focus:ring-brand-red-700/10"
                :disabled="loading"
              >
                <option value="kom">Komad</option>

                <option value="kg">Kilogram</option>
              </select>

              <p v-if="errors.unit" class="mt-2 text-xs text-red-600">
                {{ errors.unit }}
              </p>
            </div>

            <div class="sm:col-span-2">
              <label
                class="flex items-center justify-between rounded-xl border border-brand-border bg-brand-cream-50 px-4 py-3"
              >
                <span>
                  <span class="block text-sm font-semibold text-brand-brown-900">
                    Aktivan proizvod
                  </span>

                  <span class="mt-1 block text-xs text-stone-500">
                    Neaktivni proizvodi ostaju u evidenciji.
                  </span>
                </span>

                <input
                  v-model="form.active"
                  type="checkbox"
                  class="size-5 accent-brand-red-700"
                  :disabled="loading"
                />
              </label>
            </div>
          </div>

          <footer
            class="flex flex-col-reverse gap-3 border-t border-brand-border pt-5 sm:flex-row sm:justify-end"
          >
            <button
              type="button"
              class="rounded-xl border border-brand-border px-5 py-2.5 text-sm font-semibold text-brand-brown-900 transition hover:bg-brand-cream-100 disabled:opacity-50"
              :disabled="loading"
              @click="handleClose"
            >
              Odustani
            </button>

            <button
              type="submit"
              class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="loading"
            >
              <LoaderCircle v-if="loading" :size="18" class="animate-spin" />

              <Save v-else :size="18" />

              {{ loading ? 'Spremanje...' : isEditMode ? 'Spremi promjene' : 'Dodaj proizvod' }}
            </button>
          </footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>
