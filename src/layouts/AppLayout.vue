<script setup>
import { ref } from 'vue'
import { RouterView } from 'vue-router'

import AppSidebar from '../components/layout/AppSidebar.vue'
import AppHeader from '../components/layout/AppHeader.vue'

const sidebarOpen = ref(false)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}
</script>

<template>
  <div class="min-h-screen bg-brand-cream-50">
    <AppSidebar :open="sidebarOpen" @close="closeSidebar" />

    <div class="lg:pl-72">
      <AppHeader @toggle-sidebar="toggleSidebar" />

      <main class="p-4 sm:p-6 lg:p-8">
        <RouterView />
      </main>
    </div>
  </div>
</template>
