<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import { login } from '../../services/auth.service'
import { useAuthStore } from '../../stores/auth'

const email = ref('')
const password = ref('')
const error = ref('')

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const handleLogin = async () => {
  error.value = ''

  try {
    const response = await login(email.value, password.value)

    authStore.setAuth(response.data.token, response.data.user)

    const redirectPath =
      typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'

    router.push(redirectPath)
  } catch (err) {
    error.value = err.response?.data?.message || 'Prijava nije uspjela.'
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-brand-cream-100 px-4">
    <div class="w-full max-w-md rounded-xl bg-white p-8 shadow">
      <h1 class="mb-6 text-3xl font-bold">Prijava</h1>

      <input v-model="email" class="mb-4 w-full rounded border p-3" placeholder="Email" />

      <input
        v-model="password"
        type="password"
        class="mb-4 w-full rounded border p-3"
        placeholder="Lozinka"
      />

      <button class="w-full rounded bg-brand-red-700 p-3 text-white" @click="handleLogin">
        Prijavi se
      </button>

      <p v-if="error" class="mt-4 text-red-600">
        {{ error }}
      </p>
    </div>
  </main>
</template>
