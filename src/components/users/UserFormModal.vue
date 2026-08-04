<script setup>
import { computed, reactive, watch } from 'vue'
import {
  BellRing,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-vue-next'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },

  user: {
    type: Object,
    default: null,
  },

  currentUserId: {
    type: String,
    default: '',
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
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'EMPLOYEE',
  password: '',
  confirmPassword: '',
  active: true,
  whatsappNotifications: true,
})

const errors = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: '',
  password: '',
  confirmPassword: '',
})

const visibility = reactive({
  password: false,
  confirmPassword: false,
})

const isEditMode = computed(() => {
  return Boolean(props.user?._id)
})

const isEditingOwnAccount = computed(() => {
  return isEditMode.value && props.user?._id === props.currentUserId
})

const modalTitle = computed(() => {
  return isEditMode.value ? 'Uredi zaposlenika' : 'Dodaj zaposlenika'
})

const passwordStrength = computed(() => {
  const password = form.password

  if (!password) {
    return {
      score: 0,
      label: '',
      className: 'bg-stone-200',
    }
  }

  let score = 0

  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  if (score <= 2) {
    return {
      score: 1,
      label: 'Slaba',
      className: 'bg-red-500',
    }
  }

  if (score <= 4) {
    return {
      score: 2,
      label: 'Dobra',
      className: 'bg-amber-500',
    }
  }

  return {
    score: 3,
    label: 'Vrlo jaka',
    className: 'bg-green-600',
  }
})

function resetErrors() {
  errors.firstName = ''
  errors.lastName = ''
  errors.email = ''
  errors.phone = ''
  errors.role = ''
  errors.password = ''
  errors.confirmPassword = ''
}

function fillForm(user = null) {
  form.firstName = user?.firstName || ''
  form.lastName = user?.lastName || ''
  form.email = user?.email || ''
  form.phone = user?.phone || ''
  form.role = user?.role || 'EMPLOYEE'
  form.password = ''
  form.confirmPassword = ''

  form.active = user?.active === undefined ? true : Boolean(user.active)

  form.whatsappNotifications =
    user?.whatsappNotifications === undefined ? true : Boolean(user.whatsappNotifications)

  visibility.password = false
  visibility.confirmPassword = false

  resetErrors()
}

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validateForm() {
  resetErrors()

  const firstName = form.firstName.trim()
  const lastName = form.lastName.trim()
  const email = normalizeEmail(form.email)
  const phone = form.phone.trim()

  if (!firstName) {
    errors.firstName = 'Ime je obavezno.'
  }

  if (!lastName) {
    errors.lastName = 'Prezime je obavezno.'
  }

  if (!email) {
    errors.email = 'E-mail je obavezan.'
  } else if (!validateEmail(email)) {
    errors.email = 'Unesite ispravnu e-mail adresu.'
  }

  if (phone && !/^[+0-9()\s/-]{6,25}$/.test(phone)) {
    errors.phone = 'Broj mobitela sadrži nedopuštene znakove.'
  }

  if (!['ADMIN', 'EMPLOYEE'].includes(form.role)) {
    errors.role = 'Uloga nije ispravna.'
  }

  if (!isEditMode.value && !form.password) {
    errors.password = 'Lozinka je obavezna za novog zaposlenika.'
  } else if (form.password && form.password.length < 8) {
    errors.password = 'Lozinka mora sadržavati najmanje 8 znakova.'
  }

  if (form.password && form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Lozinke se ne podudaraju.'
  }

  return !Object.values(errors).some(Boolean)
}

function handleSubmit() {
  if (!validateForm()) {
    return
  }

  const payload = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: normalizeEmail(form.email),
    phone: form.phone.trim(),
    role: form.role,
    active: form.active,
    whatsappNotifications: form.whatsappNotifications,
  }

  if (isEditMode.value) {
    payload.password = form.password
  } else {
    payload.password = form.password
  }

  emit('submit', payload)
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
      fillForm(props.user)
    }
  },
)

watch(
  () => props.user,
  (user) => {
    if (props.open) {
      fillForm(user)
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
        class="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-brand-border bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        :aria-label="modalTitle"
      >
        <header
          class="sticky top-0 z-10 flex items-center justify-between border-b border-brand-border bg-white px-5 py-4 sm:px-6"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex size-11 items-center justify-center rounded-xl bg-brand-cream-100 text-brand-red-700"
            >
              <UserRound :size="22" />
            </div>

            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-red-700">
                Upravljanje korisnicima
              </p>

              <h2 class="mt-1 text-2xl font-bold text-brand-brown-900">
                {{ modalTitle }}
              </h2>
            </div>
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

        <form class="space-y-7 p-5 sm:p-6" @submit.prevent="handleSubmit">
          <div
            v-if="serverError"
            class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {{ serverError }}
          </div>

          <section>
            <div class="flex items-center gap-2">
              <UserRound :size="19" class="text-brand-red-700" />

              <h3 class="font-bold text-brand-brown-900">Osobni podaci</h3>
            </div>

            <div class="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  for="user-first-name"
                  class="mb-2 block text-sm font-semibold text-brand-brown-900"
                >
                  Ime *
                </label>

                <input
                  id="user-first-name"
                  v-model="form.firstName"
                  type="text"
                  autocomplete="given-name"
                  :placeholder="isEditMode ? '' : 'Unesite ime'"
                  class="w-full rounded-xl border bg-brand-cream-50 px-4 py-3 text-sm text-brand-brown-900 outline-none transition placeholder:text-stone-400 focus:bg-white focus:ring-2"
                  :class="
                    errors.firstName
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                      : 'border-brand-border focus:border-brand-red-700 focus:ring-brand-red-700/10'
                  "
                  :disabled="loading"
                />

                <p v-if="errors.firstName" class="mt-2 text-xs text-red-600">
                  {{ errors.firstName }}
                </p>
              </div>

              <div>
                <label
                  for="user-last-name"
                  class="mb-2 block text-sm font-semibold text-brand-brown-900"
                >
                  Prezime *
                </label>

                <input
                  id="user-last-name"
                  v-model="form.lastName"
                  type="text"
                  autocomplete="family-name"
                  :placeholder="isEditMode ? '' : 'Unesite prezime'"
                  class="w-full rounded-xl border bg-brand-cream-50 px-4 py-3 text-sm text-brand-brown-900 outline-none transition placeholder:text-stone-400 focus:bg-white focus:ring-2"
                  :class="
                    errors.lastName
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                      : 'border-brand-border focus:border-brand-red-700 focus:ring-brand-red-700/10'
                  "
                  :disabled="loading"
                />

                <p v-if="errors.lastName" class="mt-2 text-xs text-red-600">
                  {{ errors.lastName }}
                </p>
              </div>

              <div>
                <label
                  for="user-email"
                  class="mb-2 block text-sm font-semibold text-brand-brown-900"
                >
                  E-mail *
                </label>

                <input
                  id="user-email"
                  v-model="form.email"
                  type="email"
                  autocomplete="email"
                  :placeholder="isEditMode ? '' : 'ime.prezime@poduzece.hr'"
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
                  for="user-phone"
                  class="mb-2 block text-sm font-semibold text-brand-brown-900"
                >
                  Broj mobitela
                </label>

                <input
                  id="user-phone"
                  v-model="form.phone"
                  type="tel"
                  autocomplete="tel"
                  placeholder="+385 91 123 4567"
                  class="w-full rounded-xl border bg-brand-cream-50 px-4 py-3 text-sm text-brand-brown-900 outline-none transition placeholder:text-stone-400 focus:bg-white focus:ring-2"
                  :class="
                    errors.phone
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                      : 'border-brand-border focus:border-brand-red-700 focus:ring-brand-red-700/10'
                  "
                  :disabled="loading"
                />

                <p v-if="errors.phone" class="mt-2 text-xs text-red-600">
                  {{ errors.phone }}
                </p>
              </div>
            </div>
          </section>

          <section class="border-t border-brand-border pt-6">
            <div class="flex items-center gap-2">
              <KeyRound :size="19" class="text-brand-red-700" />

              <h3 class="font-bold text-brand-brown-900">Pristup sustavu</h3>
            </div>

            <p class="mt-2 text-sm text-stone-500">
              {{
                isEditMode
                  ? 'Ostavite polja lozinke praznima ako je ne želite mijenjati.'
                  : 'Zaposlenik će se prijavljivati navedenom e-mail adresom i lozinkom.'
              }}
            </p>

            <div class="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  for="user-password"
                  class="mb-2 block text-sm font-semibold text-brand-brown-900"
                >
                  {{ isEditMode ? 'Nova lozinka' : 'Lozinka *' }}
                </label>

                <div class="relative">
                  <input
                    id="user-password"
                    v-model="form.password"
                    :type="visibility.password ? 'text' : 'password'"
                    :autocomplete="isEditMode ? 'new-password' : 'new-password'"
                    placeholder="Najmanje 8 znakova"
                    class="w-full rounded-xl border bg-brand-cream-50 px-4 py-3 pr-12 text-sm text-brand-brown-900 outline-none transition placeholder:text-stone-400 focus:bg-white focus:ring-2"
                    :class="
                      errors.password
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                        : 'border-brand-border focus:border-brand-red-700 focus:ring-brand-red-700/10'
                    "
                    :disabled="loading"
                  />

                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-stone-400 transition hover:bg-white hover:text-brand-brown-900"
                    :aria-label="visibility.password ? 'Sakrij lozinku' : 'Prikaži lozinku'"
                    @click="visibility.password = !visibility.password"
                  >
                    <EyeOff v-if="visibility.password" :size="18" />

                    <Eye v-else :size="18" />
                  </button>
                </div>

                <p v-if="errors.password" class="mt-2 text-xs text-red-600">
                  {{ errors.password }}
                </p>

                <div v-if="form.password" class="mt-3">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-stone-500"> Jačina lozinke </span>

                    <span class="font-semibold text-brand-brown-900">
                      {{ passwordStrength.label }}
                    </span>
                  </div>

                  <div class="mt-2 grid grid-cols-3 gap-2">
                    <div
                      v-for="index in 3"
                      :key="index"
                      class="h-1.5 rounded-full"
                      :class="
                        index <= passwordStrength.score
                          ? passwordStrength.className
                          : 'bg-stone-200'
                      "
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  for="user-confirm-password"
                  class="mb-2 block text-sm font-semibold text-brand-brown-900"
                >
                  Potvrdi lozinku
                  {{ isEditMode ? '' : '*' }}
                </label>

                <div class="relative">
                  <input
                    id="user-confirm-password"
                    v-model="form.confirmPassword"
                    :type="visibility.confirmPassword ? 'text' : 'password'"
                    autocomplete="new-password"
                    placeholder="Ponovite lozinku"
                    class="w-full rounded-xl border bg-brand-cream-50 px-4 py-3 pr-12 text-sm text-brand-brown-900 outline-none transition placeholder:text-stone-400 focus:bg-white focus:ring-2"
                    :class="
                      errors.confirmPassword
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                        : 'border-brand-border focus:border-brand-red-700 focus:ring-brand-red-700/10'
                    "
                    :disabled="loading"
                  />

                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-stone-400 transition hover:bg-white hover:text-brand-brown-900"
                    :aria-label="
                      visibility.confirmPassword
                        ? 'Sakrij potvrdu lozinke'
                        : 'Prikaži potvrdu lozinke'
                    "
                    @click="visibility.confirmPassword = !visibility.confirmPassword"
                  >
                    <EyeOff v-if="visibility.confirmPassword" :size="18" />

                    <Eye v-else :size="18" />
                  </button>
                </div>

                <p v-if="errors.confirmPassword" class="mt-2 text-xs text-red-600">
                  {{ errors.confirmPassword }}
                </p>
              </div>

              <div class="sm:col-span-2">
                <label
                  for="user-role"
                  class="mb-2 block text-sm font-semibold text-brand-brown-900"
                >
                  Uloga *
                </label>

                <select
                  id="user-role"
                  v-model="form.role"
                  class="w-full rounded-xl border border-brand-border bg-brand-cream-50 px-4 py-3 text-sm text-brand-brown-900 outline-none transition focus:border-brand-red-700 focus:bg-white focus:ring-2 focus:ring-brand-red-700/10 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="loading || isEditingOwnAccount"
                >
                  <option value="EMPLOYEE">Zaposlenik</option>

                  <option value="ADMIN">Administrator</option>
                </select>

                <p v-if="isEditingOwnAccount" class="mt-2 text-xs text-stone-500">
                  Ne možete vlastitom računu ukloniti administratorsku ulogu.
                </p>

                <p v-if="errors.role" class="mt-2 text-xs text-red-600">
                  {{ errors.role }}
                </p>
              </div>
            </div>
          </section>

          <section class="border-t border-brand-border pt-6">
            <div class="flex items-center gap-2">
              <BellRing :size="19" class="text-brand-red-700" />

              <h3 class="font-bold text-brand-brown-900">Postavke računa</h3>
            </div>

            <div class="mt-4 space-y-4">
              <label
                class="flex cursor-pointer items-center justify-between gap-5 rounded-xl border border-brand-border bg-brand-cream-50 px-4 py-4"
              >
                <span>
                  <span class="block text-sm font-semibold text-brand-brown-900">
                    WhatsApp obavijesti
                  </span>

                  <span class="mt-1 block text-xs leading-5 text-stone-500">
                    Zaposlenik prima obavijest kada u sustav stigne nova narudžba.
                  </span>
                </span>

                <input
                  v-model="form.whatsappNotifications"
                  type="checkbox"
                  class="size-5 shrink-0 accent-brand-red-700"
                  :disabled="loading"
                />
              </label>

              <label
                class="flex items-center justify-between gap-5 rounded-xl border border-brand-border bg-brand-cream-50 px-4 py-4"
                :class="isEditingOwnAccount ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'"
              >
                <span>
                  <span class="block text-sm font-semibold text-brand-brown-900">
                    Aktivan korisnički račun
                  </span>

                  <span class="mt-1 block text-xs leading-5 text-stone-500">
                    Neaktivan zaposlenik ne može se prijaviti u aplikaciju.
                  </span>
                </span>

                <input
                  v-model="form.active"
                  type="checkbox"
                  class="size-5 shrink-0 accent-brand-red-700"
                  :disabled="loading || isEditingOwnAccount"
                />
              </label>

              <p v-if="isEditingOwnAccount" class="text-xs text-stone-500">
                Vlastiti korisnički račun ne možete deaktivirati.
              </p>
            </div>
          </section>

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

              {{ loading ? 'Spremanje...' : isEditMode ? 'Spremi promjene' : 'Dodaj zaposlenika' }}
            </button>
          </footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>
