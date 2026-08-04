<script setup>
import { computed } from 'vue'

import {
  Bot,
  Boxes,
  FileSearch,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  X,
  UserCog,
} from 'lucide-vue-next'

import { useAuthStore } from '../../stores/auth'

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])
const authStore = useAuthStore()

const navigation = [
  {
    name: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Narudžbe',
    to: '/orders',
    icon: ShoppingCart,
  },
  {
    name: 'AI obrada PDF-a',
    to: '/ai-processing',
    icon: FileSearch,
  },
  {
    name: 'Kupci',
    to: '/customers',
    icon: Users,
  },
  {
    name: 'Proizvodi',
    to: '/products',
    icon: Package,
  },
  {
    name: 'Zaposlenici',
    to: '/users',
    icon: UserCog,
    adminOnly: true,
  },
  {
    name: 'Chatbot',
    to: '/chatbot',
    icon: Bot,
  },
]

const visibleNavigation = computed(() => {
  return navigation.filter((item) => {
    if (item.adminOnly && authStore.user?.role !== 'ADMIN') {
      return false
    }

    return true
  })
})
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-40 bg-black/50 lg:hidden" @click="emit('close')" />

  <aside
    class="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-brand-brown-900 text-white shadow-xl transition-transform duration-200 lg:translate-x-0"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex h-20 items-center justify-between border-b border-white/10 px-6">
      <RouterLink to="/dashboard" class="flex items-center gap-3" @click="emit('close')">
        <div class="flex size-11 items-center justify-center rounded-xl bg-brand-red-700">
          <Boxes :size="23" />
        </div>

        <div>
          <p class="text-lg font-bold">Pršutana Barić</p>

          <p class="text-xs text-brand-cream-200">Upravljanje narudžbama</p>
        </div>
      </RouterLink>

      <button
        type="button"
        class="rounded-lg p-2 text-brand-cream-200 hover:bg-white/10 lg:hidden"
        aria-label="Zatvori navigaciju"
        @click="emit('close')"
      >
        <X :size="22" />
      </button>
    </div>

    <nav class="flex-1 space-y-2 overflow-y-auto p-4">
      <RouterLink
        v-for="item in visibleNavigation"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-brand-cream-200 transition hover:bg-white/10 hover:text-white"
        active-class="bg-brand-red-700 text-white shadow-md"
        @click="emit('close')"
      >
        <component :is="item.icon" :size="20" />

        <span>{{ item.name }}</span>
      </RouterLink>
    </nav>

    <div class="border-t border-white/10 p-5">
      <p class="text-xs leading-5 text-brand-cream-200/70">
        Digitalizacija procesa zaprimanja i obrade narudžbi
      </p>
    </div>
  </aside>
</template>
