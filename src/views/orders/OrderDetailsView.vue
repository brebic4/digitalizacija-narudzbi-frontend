<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <section>
    <p class="text-sm font-semibold uppercase tracking-[0.18em] text-brand-red-700">
      Detalji narudžbe
    </p>

    <h2 class="mt-1 text-3xl font-bold text-brand-brown-900">Narudžba</h2>

    <p class="mt-3 text-stone-600">ID narudžbe: {{ route.params.id }}</p>
  </section>
</template>
