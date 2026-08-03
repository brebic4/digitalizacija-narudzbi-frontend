<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function logout() {
  authStore.logout()

  router.push('/login')
}
</script>

<template>
  <main class="min-h-screen bg-brand-cream-50 p-8">
    <h1 class="text-3xl font-bold">Dashboard</h1>

    <button class="mt-6 rounded bg-brand-red-700 px-5 py-3 text-white" @click="logout">
      Odjava
    </button>
  </main>
</template>
