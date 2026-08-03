<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Eye, EyeOff, LoaderCircle, LockKeyhole, LogIn, Mail, PackageCheck } from 'lucide-vue-next'

import { login } from '../../services/auth.service'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const sessionMessage = computed(() => {
  if (route.query.reason === 'session-expired') {
    return 'Vaša sesija je istekla. Molimo ponovno se prijavite.'
  }

  return ''
})

const redirectPath = computed(() => {
  return typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
})

async function handleLogin() {
  error.value = ''

  const normalizedEmail = email.value.trim().toLowerCase()

  if (!normalizedEmail || !password.value) {
    error.value = 'Email i lozinka su obavezni.'
    return
  }

  loading.value = true

  try {
    const response = await login(normalizedEmail, password.value)

    authStore.setAuth(response.data.token, response.data.user)

    await router.replace(redirectPath.value)
  } catch (err) {
    error.value = err.response?.data?.message || 'Prijava nije uspjela. Pokušajte ponovno.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main
    class="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-cream-100 px-4 py-10"
  >
    <div
      class="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-brand-red-700/10 blur-3xl"
    />

    <div
      class="pointer-events-none absolute -bottom-32 -right-24 size-96 rounded-full bg-brand-brown-900/10 blur-3xl"
    />

    <section
      class="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-brand-border bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]"
    >
      <div class="hidden flex-col justify-between bg-brand-brown-900 p-10 text-white lg:flex">
        <div>
          <div
            class="flex size-14 items-center justify-center rounded-2xl bg-brand-red-700 shadow-lg"
          >
            <PackageCheck :size="28" />
          </div>

          <p class="mt-8 text-sm font-semibold uppercase tracking-[0.22em] text-brand-cream-200">
            Pršutana Barić
          </p>

          <h1 class="mt-3 max-w-md text-4xl font-bold leading-tight">
            Digitalno upravljanje narudžbama
          </h1>

          <p class="mt-5 max-w-md leading-7 text-brand-cream-200/80">
            Centralizirano zaprimanje, obrada i praćenje narudžbi uz automatiziranu obradu PDF
            dokumenata.
          </p>
        </div>

        <p class="text-sm leading-6 text-brand-cream-200/60">
          Interni poslovni sustav namijenjen ovlaštenim zaposlenicima.
        </p>
      </div>

      <div class="p-6 sm:p-10 lg:p-12">
        <div class="mx-auto max-w-md">
          <div class="mb-7 flex items-center gap-3 lg:hidden">
            <div
              class="flex size-11 items-center justify-center rounded-xl bg-brand-red-700 text-white"
            >
              <PackageCheck :size="22" />
            </div>

            <div>
              <p class="font-bold text-brand-brown-900">Pršutana Barić</p>

              <p class="text-xs text-stone-500">Upravljanje narudžbama</p>
            </div>
          </div>

          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-brand-red-700">
            Dobro došli
          </p>

          <h2 class="mt-2 text-3xl font-bold text-brand-brown-900">Prijava u sustav</h2>

          <p class="mt-3 text-sm leading-6 text-stone-600">
            Unesite svoje korisničke podatke za pristup poslovnoj aplikaciji.
          </p>

          <div
            v-if="sessionMessage"
            class="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800"
          >
            {{ sessionMessage }}
          </div>

          <div
            v-if="error"
            class="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
          >
            {{ error }}
          </div>

          <form class="mt-7 space-y-5" @submit.prevent="handleLogin">
            <div>
              <label for="email" class="mb-2 block text-sm font-semibold text-brand-brown-900">
                Email adresa
              </label>

              <div class="relative">
                <Mail
                  :size="19"
                  class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                />

                <input
                  id="email"
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  placeholder="Unesite email adresu..."
                  class="w-full rounded-xl border border-brand-border bg-brand-cream-50 py-3 pl-11 pr-4 text-sm text-brand-brown-900 outline-none transition placeholder:text-stone-400 focus:border-brand-red-700 focus:bg-white focus:ring-2 focus:ring-brand-red-700/10"
                  :disabled="loading"
                />
              </div>
            </div>

            <div>
              <label for="password" class="mb-2 block text-sm font-semibold text-brand-brown-900">
                Lozinka
              </label>

              <div class="relative">
                <LockKeyhole
                  :size="19"
                  class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                />

                <input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="Unesite lozinku..."
                  class="w-full rounded-xl border border-brand-border bg-brand-cream-50 py-3 pl-11 pr-12 text-sm text-brand-brown-900 outline-none transition placeholder:text-stone-400 focus:border-brand-red-700 focus:bg-white focus:ring-2 focus:ring-brand-red-700/10"
                  :disabled="loading"
                />

                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-stone-500 transition hover:bg-brand-cream-200 hover:text-brand-brown-900"
                  :aria-label="showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'"
                  :disabled="loading"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" :size="19" />

                  <Eye v-else :size="19" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-red-800 focus:outline-none focus:ring-2 focus:ring-brand-red-700/30 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="loading"
            >
              <LoaderCircle v-if="loading" :size="19" class="animate-spin" />

              <LogIn v-else :size="19" />

              {{ loading ? 'Prijava u tijeku...' : 'Prijavi se' }}
            </button>
          </form>

          <p class="mt-7 text-center text-xs leading-5 text-stone-500">
            Pristup je dopušten samo ovlaštenim korisnicima sustava.
          </p>
        </div>
      </div>
    </section>
  </main>
</template>
