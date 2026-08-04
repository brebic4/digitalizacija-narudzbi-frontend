<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LogOut, Menu, UserRound } from 'lucide-vue-next'

import { useAuthStore } from '../../stores/auth'
import ConfirmationModal from '../common/ConfirmationModal.vue'

const emit = defineEmits(['toggle-sidebar'])

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const logoutModalOpen = ref(false)
const logoutLoading = ref(false)
const logoutError = ref('')

const pageTitle = computed(() => {
  return route.meta.title || 'Digitalizacija narudžbi'
})

const userFullName = computed(() => {
  const firstName = authStore.user?.firstName || ''
  const lastName = authStore.user?.lastName || ''

  const fullName = `${firstName} ${lastName}`.trim()

  return fullName || authStore.user?.email || 'Korisnik'
})

function openLogoutModal() {
  logoutError.value = ''
  logoutModalOpen.value = true
}

function closeLogoutModal() {
  if (logoutLoading.value) {
    return
  }

  logoutModalOpen.value = false
  logoutError.value = ''
}

async function confirmLogout() {
  logoutLoading.value = true
  logoutError.value = ''

  try {
    await authStore.logout()

    logoutModalOpen.value = false

    await router.replace({
      name: 'login',
    })
  } catch (err) {
    logoutError.value =
      err.response?.data?.message || err.message || 'Odjava iz sustava nije uspjela.'
  } finally {
    logoutLoading.value = false
  }
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
        @click="openLogoutModal"
      >
        <LogOut :size="18" />

        <span class="hidden sm:inline"> Odjava </span>
      </button>
    </div>
  </header>

  <ConfirmationModal
    :open="logoutModalOpen"
    :loading="logoutLoading"
    :error="logoutError"
    title="Odjava iz sustava"
    message="Jeste li sigurni da se želite odjaviti? Morat ćete se ponovno prijaviti kako biste nastavili rad."
    confirm-text="Odjavi se"
    loading-text="Odjavljivanje..."
    cancel-text="Odustani"
    @confirm="confirmLogout"
    @cancel="closeLogoutModal"
  />
</template>
