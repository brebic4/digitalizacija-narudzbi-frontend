<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  BellRing,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-vue-next'

import { useAuthStore } from '../../stores/auth'
import {
  getUsers,
  createUser,
  updateUser,
  changeUserActiveStatus,
} from '../../services/users.service'
import UserFormModal from '../../components/users/UserFormModal.vue'
import ConfirmationModal from '../../components/common/ConfirmationModal.vue'

const authStore = useAuthStore()

const users = ref([])
const loading = ref(false)
const error = ref('')

const search = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)

const formModalOpen = ref(false)
const selectedUser = ref(null)
const savingUser = ref(false)
const formError = ref('')
const successMessage = ref('')

const confirmationModalOpen = ref(false)
const confirmationLoading = ref(false)
const confirmationError = ref('')

const userToConfirm = ref(null)
const selectedAction = ref('')

const pagination = ref({
  totalItems: 0,
  currentPage: 1,
  itemsPerPage: 10,
  totalPages: 0,
})

let searchTimeout

function openCreateModal() {
  selectedUser.value = null
  formError.value = ''
  formModalOpen.value = true
}

function openEditModal(user) {
  selectedUser.value = user
  formError.value = ''
  formModalOpen.value = true
}

function closeFormModal() {
  if (savingUser.value) {
    return
  }

  formModalOpen.value = false
  selectedUser.value = null
  formError.value = ''
}

async function handleUserSubmit(payload) {
  savingUser.value = true
  formError.value = ''
  successMessage.value = ''
  error.value = ''

  try {
    if (selectedUser.value?._id) {
      await updateUser(selectedUser.value._id, payload)

      successMessage.value = 'Podaci o zaposleniku uspješno su ažurirani.'
    } else {
      await createUser(payload)

      successMessage.value = 'Zaposlenik je uspješno dodan.'
    }

    formModalOpen.value = false
    selectedUser.value = null

    currentPage.value = 1
    await loadUsers()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Podatke o zaposleniku nije moguće spremiti.'
  } finally {
    savingUser.value = false
  }
}

function openConfirmation(user, action) {
  userToConfirm.value = user
  selectedAction.value = action
  confirmationError.value = ''
  confirmationModalOpen.value = true
}

function closeConfirmation() {
  if (confirmationLoading.value) {
    return
  }

  confirmationModalOpen.value = false
  confirmationError.value = ''
  userToConfirm.value = null
  selectedAction.value = ''
}

async function confirmUserStatusChange() {
  if (!userToConfirm.value) {
    return
  }

  confirmationLoading.value = true
  confirmationError.value = ''
  successMessage.value = ''
  error.value = ''

  try {
    const shouldActivate = selectedAction.value === 'activate'

    await changeUserActiveStatus(userToConfirm.value._id, shouldActivate)

    successMessage.value = shouldActivate
      ? 'Zaposlenik je uspješno aktiviran.'
      : 'Zaposlenik je uspješno deaktiviran.'

    confirmationModalOpen.value = false
    userToConfirm.value = null
    selectedAction.value = ''

    await loadUsers()
  } catch (err) {
    confirmationError.value =
      err.response?.data?.message || 'Status zaposlenika nije moguće promijeniti.'
  } finally {
    confirmationLoading.value = false
  }
}

const currentUserId = computed(() => {
  return authStore.user?.id || ''
})

function getInitials(user) {
  const firstInitial = user.firstName?.trim()?.charAt(0) || ''

  const lastInitial = user.lastName?.trim()?.charAt(0) || ''

  return `${firstInitial}${lastInitial}`.toUpperCase() || 'K'
}

function getFullName(user) {
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()

  return fullName || user.email || 'Nepoznat korisnik'
}

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

async function loadUsers() {
  loading.value = true
  error.value = ''

  try {
    const response = await getUsers({
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

    users.value = response.data
    pagination.value = receivedPagination
  } catch (err) {
    error.value = err.response?.data?.message || 'Zaposlenici nisu mogli biti dohvaćeni.'
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
    loadUsers()
  }, 350)
})

watch(currentPage, loadUsers)

watch(itemsPerPage, () => {
  currentPage.value = 1
  loadUsers()
})

onMounted(loadUsers)

onBeforeUnmount(() => {
  clearTimeout(searchTimeout)
})
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-brand-red-700">
          Upravljanje korisničkim računima
        </p>

        <h2 class="mt-1 text-3xl font-bold text-brand-brown-900">Zaposlenici</h2>

        <p class="mt-3 max-w-2xl text-stone-600">
          Pregled korisnika sustava, njihovih uloga, statusa računa i WhatsApp obavijesti.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-red-800"
        @click="openCreateModal"
      >
        <Plus :size="18" />
        Dodaj zaposlenika
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
            placeholder="Pretraži po imenu, emailu ili broju mobitela..."
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
            @click="loadUsers"
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
          class="h-20 animate-pulse rounded-xl bg-brand-cream-100"
        />
      </div>

      <div
        v-else-if="users.length === 0"
        class="flex flex-col items-center justify-center px-6 py-16 text-center"
      >
        <div
          class="flex size-14 items-center justify-center rounded-full bg-brand-cream-100 text-brand-brown-900"
        >
          <Users :size="27" />
        </div>

        <h3 class="mt-4 font-semibold text-brand-brown-900">Nema pronađenih zaposlenika</h3>

        <p class="mt-2 max-w-sm text-sm text-stone-500">
          Dodajte prvog zaposlenika ili promijenite pojam pretrage.
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-brand-border">
          <thead class="bg-brand-cream-100/70">
            <tr>
              <th
                class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6"
              >
                Zaposlenik
              </th>

              <th
                class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500"
              >
                Mobitel
              </th>

              <th
                class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500"
              >
                Uloga
              </th>

              <th
                class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500"
              >
                WhatsApp
              </th>

              <th
                class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500"
              >
                Status
              </th>

              <th
                class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500"
              >
                Dodan
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
              v-for="user in users"
              :key="user._id"
              :class="[
                'transition',
                user.active
                  ? 'hover:bg-brand-cream-50'
                  : 'bg-stone-50 opacity-70 hover:bg-stone-100',
              ]"
            >
              <td class="px-5 py-4 sm:px-6">
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-cream-200 text-sm font-bold text-brand-brown-900"
                  >
                    {{ getInitials(user) }}
                  </div>

                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="font-semibold text-brand-brown-900">
                        {{ getFullName(user) }}
                      </p>

                      <span
                        v-if="user._id === currentUserId"
                        class="rounded-full bg-brand-cream-200 px-2 py-0.5 text-[11px] font-semibold text-brand-brown-900"
                      >
                        Vi
                      </span>
                    </div>

                    <p class="mt-1 text-sm text-stone-500">
                      {{ user.email }}
                    </p>
                  </div>
                </div>
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-sm text-stone-700">
                {{ user.phone || '—' }}
              </td>

              <td class="whitespace-nowrap px-5 py-4">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                  :class="
                    user.role === 'ADMIN'
                      ? 'bg-brand-red-50 text-brand-red-700'
                      : 'bg-blue-50 text-blue-700'
                  "
                >
                  <ShieldCheck v-if="user.role === 'ADMIN'" :size="14" />

                  <UserRound v-else :size="14" />

                  {{ user.role === 'ADMIN' ? 'Administrator' : 'Zaposlenik' }}
                </span>
              </td>

              <td class="whitespace-nowrap px-5 py-4">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                  :class="
                    user.whatsappNotifications
                      ? 'bg-green-50 text-green-700'
                      : 'bg-stone-100 text-stone-600'
                  "
                >
                  <BellRing :size="14" />

                  {{ user.whatsappNotifications ? 'Prima obavijesti' : 'Ne prima' }}
                </span>
              </td>

              <td class="whitespace-nowrap px-5 py-4">
                <span
                  class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                  :class="
                    user.active ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'
                  "
                >
                  {{ user.active ? 'Aktivan' : 'Neaktivan' }}
                </span>
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-sm text-stone-700">
                {{ formatDate(user.createdAt) }}
              </td>

              <td class="whitespace-nowrap px-5 py-4 text-right sm:px-6">
                <div class="inline-flex items-center gap-2">
                  <button
                    type="button"
                    class="rounded-lg border border-brand-border px-3 py-2 text-xs font-semibold text-brand-brown-900 transition hover:border-brand-red-700 hover:text-brand-red-700"
                    @click="openEditModal(user)"
                  >
                    Uredi
                  </button>

                  <button
                    v-if="user.active"
                    type="button"
                    class="rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="user._id === currentUserId"
                    @click="openConfirmation(user, 'deactivate')"
                  >
                    Deaktiviraj
                  </button>

                  <button
                    v-else
                    type="button"
                    class="rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-50"
                    @click="openConfirmation(user, 'activate')"
                  >
                    Aktiviraj
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

          zaposlenika
        </p>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex size-9 items-center justify-center rounded-lg border border-brand-border text-brand-brown-900 transition hover:border-brand-red-700 hover:text-brand-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="currentPage <= 1"
            aria-label="Prethodna stranica"
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
            aria-label="Sljedeća stranica"
            @click="goToPage(currentPage + 1)"
          >
            <ChevronRight :size="18" />
          </button>
        </div>
      </div>
    </section>

    <UserFormModal
      :open="formModalOpen"
      :user="selectedUser"
      :current-user-id="currentUserId"
      :loading="savingUser"
      :server-error="formError"
      @close="closeFormModal"
      @submit="handleUserSubmit"
    />

    <ConfirmationModal
      :open="confirmationModalOpen"
      :loading="confirmationLoading"
      :error="confirmationError"
      :title="selectedAction === 'activate' ? 'Aktivacija zaposlenika' : 'Deaktivacija zaposlenika'"
      :message="
        selectedAction === 'activate'
          ? `Jeste li sigurni da želite ponovno aktivirati zaposlenika '${getFullName(userToConfirm || {})}'? Nakon aktivacije zaposlenik će se ponovno moći prijaviti u aplikaciju.`
          : `Jeste li sigurni da želite deaktivirati zaposlenika '${getFullName(userToConfirm || {})}'? Neaktivan zaposlenik više se neće moći prijaviti u aplikaciju.`
      "
      :confirm-text="selectedAction === 'activate' ? 'Aktiviraj' : 'Deaktiviraj'"
      :loading-text="selectedAction === 'activate' ? 'Aktiviranje...' : 'Deaktiviranje...'"
      cancel-text="Odustani"
      @confirm="confirmUserStatusChange"
      @cancel="closeConfirmation"
    />
  </section>
</template>
