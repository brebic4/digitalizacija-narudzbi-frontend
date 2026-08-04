<script setup>
import { computed, reactive, watch } from 'vue'
import { LoaderCircle, Save, X } from 'lucide-vue-next'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  customer: {
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
  oib: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  active: true,
})

const errors = reactive({
  name: '',
  oib: '',
  email: '',
  phone: '',
  postalCode: '',
})

const isEditMode = computed(() => {
  return Boolean(props.customer?._id)
})

const modalTitle = computed(() => {
  return isEditMode.value ? 'Uredi kupca' : 'Dodaj kupca'
})

function resetErrors() {
  errors.name = ''
  errors.oib = ''
  errors.email = ''
  errors.phone = ''
  errors.postalCode = ''
}

function fillForm(customer = null) {
  form.name = customer?.name || ''
  form.oib = customer?.oib || ''
  form.email = customer?.email || ''
  form.phone = customer?.phone || ''
  form.address = customer?.address || ''
  form.city = customer?.city || ''
  form.postalCode = customer?.postalCode || ''
  form.active = customer?.active === undefined ? true : Boolean(customer.active)

  resetErrors()
}

function normalizeOib(value) {
  return String(value || '').replace(/\D/g, '')
}

function validateForm() {
  resetErrors()

  const normalizedName = form.name.trim()
  const normalizedOib = normalizeOib(form.oib)
  const normalizedEmail = form.email.trim()

  if (!normalizedName) {
    errors.name = 'Naziv kupca je obavezan.'
  }

  if (!normalizedOib) {
    errors.oib = 'OIB je obavezan.'
  } else if (normalizedOib.length !== 11) {
    errors.oib = 'OIB mora sadržavati točno 11 znamenki.'
  }

  if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = 'Email adresa nije ispravna.'
  }

  if (form.postalCode.trim() && !/^\d{5}$/.test(form.postalCode.trim())) {
    errors.postalCode = 'Poštanski broj mora sadržavati 5 znamenki.'
  }

  return !Object.values(errors).some(Boolean)
}

function handleSubmit() {
  if (!validateForm()) {
    return
  }

  emit('submit', {
    name: form.name.trim(),
    oib: normalizeOib(form.oib),
    email: form.email.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    city: form.city.trim(),
    postalCode: form.postalCode.trim(),
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
      fillForm(props.customer)
    }
  },
)

watch(
  () => props.customer,
  (customer) => {
    if (props.open) {
      fillForm(customer)
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
              Evidencija kupaca
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
                for="customer-name"
                class="mb-2 block text-sm font-semibold text-brand-brown-900"
              >
                Naziv kupca *
              </label>

              <input
                id="customer-name"
                v-model="form.name"
                type="text"
                placeholder="Unesite naziv kupca..."
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
                for="customer-oib"
                class="mb-2 block text-sm font-semibold text-brand-brown-900"
              >
                OIB *
              </label>

              <input
                id="customer-oib"
                v-model="form.oib"
                type="text"
                inputmode="numeric"
                maxlength="11"
                placeholder="Unesite OIB..."
                class="w-full rounded-xl border bg-brand-cream-50 px-4 py-3 text-sm text-brand-brown-900 outline-none transition placeholder:text-stone-400 focus:bg-white focus:ring-2"
                :class="
                  errors.oib
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-brand-border focus:border-brand-red-700 focus:ring-brand-red-700/10'
                "
                :disabled="loading"
              />

              <p v-if="errors.oib" class="mt-2 text-xs text-red-600">
                {{ errors.oib }}
              </p>
            </div>

            <div>
              <label
                for="customer-email"
                class="mb-2 block text-sm font-semibold text-brand-brown-900"
              >
                Email
              </label>

              <input
                id="customer-email"
                v-model="form.email"
                type="email"
                placeholder="Unesite email adresu..."
                class="w-full rounded-xl border bg-brand-cream-50 px-4 py-3 text-sm text-brand-brown-900 outline-none transition placeholder:text-stone-400 focus:bg-white focus:ring-2"
                :class="
                  errors.email
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-brand-border focus:border-brand-red-700 focus:ring-brand-red-700/10'
                "
                :disabled="loading"
              />

              <p v-if="errors.email" class="mt-2 text-xs text-red-600">
                {{ errors.email }}
              </p>
            </div>

            <div>
              <label
                for="customer-phone"
                class="mb-2 block text-sm font-semibold text-brand-brown-900"
              >
                Telefon
              </label>

              <input
                id="customer-phone"
                v-model="form.phone"
                type="text"
                placeholder="Unesite broj telefona..."
                class="w-full rounded-xl border border-brand-border bg-brand-cream-50 px-4 py-3 text-sm text-brand-brown-900 outline-none transition placeholder:text-stone-400 focus:border-brand-red-700 focus:bg-white focus:ring-2 focus:ring-brand-red-700/10"
                :disabled="loading"
              />
            </div>

            <div>
              <label
                for="customer-city"
                class="mb-2 block text-sm font-semibold text-brand-brown-900"
              >
                Grad
              </label>

              <input
                id="customer-city"
                v-model="form.city"
                type="text"
                placeholder="Unesite grad..."
                class="w-full rounded-xl border border-brand-border bg-brand-cream-50 px-4 py-3 text-sm text-brand-brown-900 outline-none transition placeholder:text-stone-400 focus:border-brand-red-700 focus:bg-white focus:ring-2 focus:ring-brand-red-700/10"
                :disabled="loading"
              />
            </div>

            <div class="sm:col-span-2">
              <label
                for="customer-address"
                class="mb-2 block text-sm font-semibold text-brand-brown-900"
              >
                Adresa
              </label>

              <input
                id="customer-address"
                v-model="form.address"
                type="text"
                placeholder="Unesite ulicu i kućni broj..."
                class="w-full rounded-xl border border-brand-border bg-brand-cream-50 px-4 py-3 text-sm text-brand-brown-900 outline-none transition placeholder:text-stone-400 focus:border-brand-red-700 focus:bg-white focus:ring-2 focus:ring-brand-red-700/10"
                :disabled="loading"
              />
            </div>

            <div>
              <label
                for="customer-postal-code"
                class="mb-2 block text-sm font-semibold text-brand-brown-900"
              >
                Poštanski broj
              </label>

              <input
                id="customer-postal-code"
                v-model="form.postalCode"
                type="text"
                inputmode="numeric"
                maxlength="5"
                placeholder="Unesite poštanski broj..."
                class="w-full rounded-xl border bg-brand-cream-50 px-4 py-3 text-sm text-brand-brown-900 outline-none transition placeholder:text-stone-400 focus:bg-white focus:ring-2"
                :class="
                  errors.postalCode
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-brand-border focus:border-brand-red-700 focus:ring-brand-red-700/10'
                "
                :disabled="loading"
              />

              <p v-if="errors.postalCode" class="mt-2 text-xs text-red-600">
                {{ errors.postalCode }}
              </p>
            </div>

            <div class="flex items-end">
              <label
                class="flex w-full items-center justify-between rounded-xl border border-brand-border bg-brand-cream-50 px-4 py-3"
              >
                <span>
                  <span class="block text-sm font-semibold text-brand-brown-900">
                    Aktivan kupac
                  </span>

                  <span class="mt-1 block text-xs text-stone-500">
                    Neaktivni kupci ostaju u evidenciji.
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

              {{ loading ? 'Spremanje...' : isEditMode ? 'Spremi promjene' : 'Dodaj kupca' }}
            </button>
          </footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>
