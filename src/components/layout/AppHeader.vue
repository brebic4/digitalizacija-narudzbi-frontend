<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LogOut, Menu, UserRound } from 'lucide-vue-next'

import { useAuthStore } from '../../stores/auth'

const emit = defineEmits(['toggle-sidebar'])

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const pageTitle = computed(() => {
  return route.meta.title || 'Digitalizacija narudžbi'
})

const userFullName = computed(() => {
  const firstName = authStore.user?.firstName || ''
  const lastName = authStore.user?.lastName || ''

  const fullName = `${firstName} ${lastName}`.trim()

  return fullName || authStore.user?.email || 'Korisnik'
})

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header
    class="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-brand-border bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8"
  >
    <div class="flex items-center gap-4">
      <button
        type="button"
        class="rounded-lg border border-brand-border p-2 text-brand-brown-900 hover:bg-brand-cream-100 lg:hidden"
        aria-label="Otvori navigaciju"
        @click="emit('toggle-sidebar')"
      >
        <Menu :size="22" />
      </button>

      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-brand-red-700">
          Pršutana Barić
        </p>

        <h1 class="text-xl font-bold text-brand-brown-900 sm:text-2xl">
          {{ pageTitle }}
        </h1>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <div class="hidden text-right sm:block">
        <p class="text-sm font-semibold text-brand-brown-900">
          {{ userFullName }}
        </p>

        <p class="text-xs uppercase tracking-wide text-stone-500">
          {{ authStore.user?.role || 'korisnik' }}
        </p>
      </div>

      <div
        class="flex size-10 items-center justify-center rounded-full bg-brand-cream-200 text-brand-brown-900"
      >
        <UserRound :size="19" />
      </div>

      <button
        type="button"
        class="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2 text-sm font-semibold text-brand-brown-900 transition hover:border-brand-red-700 hover:bg-brand-red-700 hover:text-white"
        @click="logout"
      >
        <LogOut :size="18" />

        <span class="hidden sm:inline"> Odjava </span>
      </button>
    </div>
  </header>
</template>
