<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  LoaderCircle,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
  AlertTriangle,
  CalendarDays,
  Check,
  CircleAlert,
  ClipboardCheck,
  Hash,
  PackageCheck,
  UserRound,
  WandSparkles,
  RotateCcw,
} from 'lucide-vue-next'

import { deleteOrderPdf, extractOrderFromPdf, uploadOrderPdf } from '../../services/ai.service'
import { useAiProcessingStore } from '../../stores/aiProcessing'
import ConfirmationModal from '../../components/common/ConfirmationModal.vue'

const aiProcessingStore = useAiProcessingStore()

const {
  selectedFile,
  uploadedFile,
  analysisResult,
  uploading,
  analyzing,
  deleting,
  error,
  successMessage,
} = storeToRefs(aiProcessingStore)

const fileInput = ref(null)
const isDragging = ref(false)
const showResetConfirmation = ref(false)

const MAX_FILE_SIZE = 10 * 1024 * 1024

const busy = computed(() => {
  return uploading.value || analyzing.value || deleting.value
})

const canUpload = computed(() => {
  return Boolean(selectedFile.value) && !uploadedFile.value && !busy.value
})

const canAnalyze = computed(() => {
  return Boolean(uploadedFile.value?.fileName) && !busy.value
})

const extraction = computed(() => {
  return analysisResult.value?.extraction || null
})

const matchingSummary = computed(() => {
  return (
    analysisResult.value?.matchingSummary || {
      customerMatched: false,
      totalItems: 0,
      matchedItems: 0,
      unmatchedItems: 0,
      allItemsMatched: false,
    }
  )
})

const confidenceSummary = computed(() => {
  return (
    analysisResult.value?.confidenceSummary || {
      customerMatched: false,
      productMatchingRate: 0,
    }
  )
})

const warnings = computed(() => {
  return Array.isArray(analysisResult.value?.warnings) ? analysisResult.value.warnings : []
})

const canCreateOrder = computed(() => {
  return Boolean(analysisResult.value?.canCreateOrder)
})

const productMatchingPercentage = computed(() => {
  return Math.round(Number(confidenceSummary.value.productMatchingRate || 0) * 100)
})

const matchedCustomerName = computed(() => {
  return (
    extraction.value?.customerMatch?.customer?.name ||
    extraction.value?.customerName ||
    'Kupac nije prepoznat'
  )
})

const matchedCustomerOib = computed(() => {
  return extraction.value?.customerMatch?.customer?.oib || extraction.value?.customerOib || '—'
})

function startNewAnalysis() {
  if (busy.value) {
    return
  }

  showResetConfirmation.value = true
}

function confirmStartNewAnalysis() {
  aiProcessingStore.clearAnalysis()

  if (fileInput.value) {
    fileInput.value.value = ''
  }

  isDragging.value = false

  showResetConfirmation.value = false
}

function formatFileSize(bytes) {
  const numericBytes = Number(bytes || 0)

  if (numericBytes < 1024) {
    return `${numericBytes} B`
  }

  if (numericBytes < 1024 * 1024) {
    return `${(numericBytes / 1024).toFixed(1)} KB`
  }

  return `${(numericBytes / 1024 / 1024).toFixed(2)} MB`
}

function formatDate(value) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('hr-HR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatNumber(value) {
  return new Intl.NumberFormat('hr-HR').format(Number(value || 0))
}

function getMatchMethodLabel(method) {
  const labels = {
    oib: 'OIB',
    barcode: 'Barkod',
    code: 'Šifra',
    exact_name: 'Točan naziv',
  }

  return labels[method] || 'Nije povezano'
}

function getWarningClasses(severity) {
  if (severity === 'error') {
    return {
      wrapper: 'border-red-200 bg-red-50',
      icon: 'text-red-700',
      title: 'text-red-900',
      text: 'text-red-700',
    }
  }

  return {
    wrapper: 'border-amber-200 bg-amber-50',
    icon: 'text-amber-700',
    title: 'text-amber-900',
    text: 'text-amber-700',
  }
}

function resetMessages() {
  aiProcessingStore.clearMessages()
}

function validateFile(file) {
  if (!file) {
    return 'PDF datoteka nije odabrana.'
  }

  const extension = file.name.split('.').pop()?.toLowerCase()

  if (file.type !== 'application/pdf' || extension !== 'pdf') {
    return 'Dozvoljene su samo PDF datoteke.'
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'PDF datoteka ne smije biti veća od 10 MB.'
  }

  return ''
}

function setSelectedFile(file) {
  resetMessages()
  analysisResult.value = null

  const validationError = validateFile(file)

  if (validationError) {
    selectedFile.value = null
    error.value = validationError
    return
  }

  selectedFile.value = file
}

function handleFileInput(event) {
  const [file] = event.target.files || []

  setSelectedFile(file)

  event.target.value = ''
}

function handleDrop(event) {
  isDragging.value = false

  if (busy.value || uploadedFile.value) {
    return
  }

  const [file] = event.dataTransfer.files || []

  setSelectedFile(file)
}

function openFilePicker() {
  if (busy.value || uploadedFile.value) {
    return
  }

  fileInput.value?.click()
}

function removeSelectedFile() {
  if (busy.value) {
    return
  }

  selectedFile.value = null
  analysisResult.value = null
  resetMessages()
}

async function handleUpload() {
  if (!selectedFile.value || !canUpload.value) {
    return
  }

  uploading.value = true
  resetMessages()

  try {
    const response = await uploadOrderPdf(selectedFile.value)

    uploadedFile.value = response.data

    successMessage.value = 'PDF datoteka uspješno je učitana.'
  } catch (err) {
    error.value = err.response?.data?.message || 'PDF datoteku nije moguće učitati.'
  } finally {
    uploading.value = false
  }
}

async function handleAnalyze() {
  if (!uploadedFile.value?.fileName) {
    return
  }

  analyzing.value = true
  resetMessages()
  analysisResult.value = null

  try {
    const response = await extractOrderFromPdf(uploadedFile.value.fileName)

    analysisResult.value = response.data
    successMessage.value = 'AI analiza PDF narudžbe uspješno je završena.'
  } catch (err) {
    error.value = err.response?.data?.message || 'PDF narudžbu nije moguće analizirati.'
  } finally {
    analyzing.value = false
  }
}

async function handleDeleteUploadedFile() {
  if (!uploadedFile.value?.fileName) {
    return
  }

  deleting.value = true
  resetMessages()

  try {
    await deleteOrderPdf(uploadedFile.value.fileName)

    selectedFile.value = null
    uploadedFile.value = null
    analysisResult.value = null

    successMessage.value = 'PDF datoteka uspješno je uklonjena.'
  } catch (err) {
    error.value = err.response?.data?.message || 'PDF datoteku nije moguće ukloniti.'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <section class="space-y-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-brand-red-700">
          Automatska obrada dokumenta
        </p>

        <h2 class="mt-1 text-3xl font-bold text-brand-brown-900">AI obrada PDF narudžbe</h2>

        <p class="mt-3 max-w-2xl text-stone-600">
          Učitajte PDF narudžbu. Sustav će izdvojiti kupca, broj narudžbe, datum isporuke, proizvode
          i količine.
        </p>
      </div>

      <button
        v-if="selectedFile || uploadedFile || analysisResult"
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm font-semibold text-brand-brown-900 shadow-sm transition hover:border-brand-red-700 hover:text-brand-red-700 disabled:opacity-50"
        :disabled="busy"
        @click="startNewAnalysis"
      >
        <RotateCcw :size="18" />

        Nova AI analiza
      </button>
    </header>

    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <div class="flex items-start gap-2">
        <AlertCircle :size="19" class="mt-0.5 shrink-0" />

        <span>{{ error }}</span>
      </div>
    </div>

    <div
      v-if="successMessage"
      class="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
    >
      <div class="flex items-start gap-2">
        <CheckCircle2 :size="19" class="mt-0.5 shrink-0" />

        <span>{{ successMessage }}</span>
      </div>
    </div>

    <section class="rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-6">
      <div class="flex items-center gap-3 border-b border-brand-border pb-5">
        <div
          class="flex size-11 items-center justify-center rounded-xl bg-brand-cream-100 text-brand-red-700"
        >
          <UploadCloud :size="23" />
        </div>

        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red-700">
            Ulazni dokument
          </p>

          <h3 class="mt-1 text-xl font-bold text-brand-brown-900">Učitavanje PDF-a</h3>
        </div>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept="application/pdf,.pdf"
        class="hidden"
        @change="handleFileInput"
      />

      <div
        v-if="!selectedFile"
        class="mt-6 flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition"
        :class="
          isDragging
            ? 'border-brand-red-700 bg-brand-red-50'
            : 'border-brand-border bg-brand-cream-50 hover:border-brand-red-700 hover:bg-brand-red-50/40'
        "
        @click="openFilePicker"
        @dragenter.prevent="isDragging = true"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <div
          class="flex size-16 items-center justify-center rounded-full bg-white text-brand-red-700 shadow-sm"
        >
          <UploadCloud :size="30" />
        </div>

        <h4 class="mt-5 text-lg font-bold text-brand-brown-900">Povucite PDF datoteku ovdje</h4>

        <p class="mt-2 text-sm text-stone-500">ili kliknite za odabir datoteke</p>

        <p class="mt-4 text-xs text-stone-400">Dopušten je jedan PDF, najviše 10 MB.</p>
      </div>

      <article
        v-else
        class="mt-6 rounded-2xl border border-brand-border bg-brand-cream-50 p-4 sm:p-5"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex min-w-0 items-center gap-4">
            <div
              class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-brand-red-700 shadow-sm"
            >
              <FileText :size="24" />
            </div>

            <div class="min-w-0">
              <p class="truncate font-semibold text-brand-brown-900">
                {{ uploadedFile?.originalName || selectedFile.name }}
              </p>

              <p class="mt-1 text-sm text-stone-500">
                {{ uploadedFile ? `${uploadedFile.sizeMb} MB` : formatFileSize(selectedFile.size) }}
              </p>

              <p
                class="mt-1 text-xs font-medium"
                :class="uploadedFile ? 'text-green-700' : 'text-amber-700'"
              >
                {{
                  uploadedFile
                    ? 'Datoteka je učitana na poslužitelj.'
                    : 'Datoteka je spremna za učitavanje.'
                }}
              </p>
            </div>
          </div>

          <button
            v-if="!uploadedFile"
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            :disabled="busy"
            @click="removeSelectedFile"
          >
            <X :size="18" />
            Ukloni
          </button>

          <button
            v-else
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            :disabled="busy"
            @click="handleDeleteUploadedFile"
          >
            <LoaderCircle v-if="deleting" :size="18" class="animate-spin" />

            <Trash2 v-else :size="18" />

            {{ deleting ? 'Uklanjanje...' : 'Ukloni PDF' }}
          </button>
        </div>
      </article>

      <div v-if="selectedFile" class="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          v-if="!uploadedFile"
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-red-800 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="!canUpload"
          @click="handleUpload"
        >
          <LoaderCircle v-if="uploading" :size="19" class="animate-spin" />

          <UploadCloud v-else :size="19" />

          {{ uploading ? 'Učitavanje...' : 'Učitaj PDF' }}
        </button>

        <button
          v-else
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-red-800 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="!canAnalyze"
          @click="handleAnalyze"
        >
          <LoaderCircle v-if="analyzing" :size="19" class="animate-spin" />

          <Sparkles v-else :size="19" />

          {{ analyzing ? 'AI analizira dokument...' : 'Pokreni AI analizu' }}
        </button>
      </div>
    </section>

    <template v-if="analysisResult">
      <!-- Glavni status analize -->
      <section
        class="rounded-2xl border p-5 shadow-sm sm:p-6"
        :class="canCreateOrder ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-3">
            <div
              class="flex size-11 shrink-0 items-center justify-center rounded-xl"
              :class="
                canCreateOrder ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              "
            >
              <ClipboardCheck v-if="canCreateOrder" :size="23" />

              <CircleAlert v-else :size="23" />
            </div>

            <div>
              <h3
                class="text-lg font-bold"
                :class="canCreateOrder ? 'text-green-900' : 'text-amber-900'"
              >
                {{
                  canCreateOrder ? 'Narudžba je spremna za pregled' : 'Potrebna je ručna provjera'
                }}
              </h3>

              <p
                class="mt-1 text-sm leading-6"
                :class="canCreateOrder ? 'text-green-800' : 'text-amber-800'"
              >
                {{
                  canCreateOrder
                    ? 'Kupac i svi proizvodi uspješno su povezani s podacima u bazi.'
                    : 'Dio izdvojenih podataka nije moguće automatski povezati s bazom.'
                }}
              </p>
            </div>
          </div>

          <span
            class="inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
            :class="
              canCreateOrder
                ? 'border-green-300 bg-white text-green-700'
                : 'border-amber-300 bg-white text-amber-700'
            "
          >
            <Check v-if="canCreateOrder" :size="17" />

            <AlertTriangle v-else :size="17" />

            {{ canCreateOrder ? 'Spremno za kreiranje' : 'Provjerite podatke' }}
          </span>
        </div>
      </section>

      <!-- Statističke kartice -->
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article class="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-stone-500">Kupac</p>

              <p class="mt-2 text-lg font-bold text-brand-brown-900">
                {{ confidenceSummary.customerMatched ? 'Povezan' : 'Nije povezan' }}
              </p>
            </div>

            <div
              class="flex size-12 items-center justify-center rounded-xl"
              :class="
                confidenceSummary.customerMatched
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              "
            >
              <UserRound :size="23" />
            </div>
          </div>
        </article>

        <article class="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-stone-500">Povezanost proizvoda</p>

              <p class="mt-2 text-3xl font-bold text-brand-brown-900">
                {{ productMatchingPercentage }}%
              </p>
            </div>

            <div
              class="flex size-12 items-center justify-center rounded-xl"
              :class="
                matchingSummary.allItemsMatched
                  ? 'bg-green-50 text-green-700'
                  : 'bg-amber-50 text-amber-700'
              "
            >
              <PackageCheck :size="23" />
            </div>
          </div>
        </article>

        <article class="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-stone-500">Pronađene stavke</p>

              <p class="mt-2 text-3xl font-bold text-brand-brown-900">
                {{ matchingSummary.matchedItems }}
                /
                {{ matchingSummary.totalItems }}
              </p>
            </div>

            <div
              class="flex size-12 items-center justify-center rounded-xl bg-brand-cream-100 text-brand-red-700"
            >
              <FileText :size="23" />
            </div>
          </div>
        </article>

        <article class="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-stone-500">Upozorenja</p>

              <p class="mt-2 text-3xl font-bold text-brand-brown-900">
                {{ warnings.length }}
              </p>
            </div>

            <div
              class="flex size-12 items-center justify-center rounded-xl"
              :class="
                warnings.length === 0 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
              "
            >
              <AlertTriangle :size="23" />
            </div>
          </div>
        </article>
      </div>

      <!-- Upozorenja -->
      <section class="rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-6">
        <div class="flex items-center gap-3">
          <div
            class="flex size-11 items-center justify-center rounded-xl bg-brand-cream-100 text-brand-red-700"
          >
            <AlertTriangle :size="22" />
          </div>

          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red-700">
              Provjera rezultata
            </p>

            <h3 class="mt-1 text-xl font-bold text-brand-brown-900">Upozorenja</h3>
          </div>
        </div>

        <div
          v-if="warnings.length === 0"
          class="mt-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4"
        >
          <CheckCircle2 :size="20" class="mt-0.5 shrink-0 text-green-700" />

          <div>
            <p class="font-semibold text-green-900">Nema upozorenja</p>

            <p class="mt-1 text-sm text-green-700">
              Svi izdvojeni podaci uspješno su povezani s podacima u sustavu.
            </p>
          </div>
        </div>

        <div v-else class="mt-5 space-y-3">
          <article
            v-for="(warning, index) in warnings"
            :key="`${warning.type}-${index}`"
            class="rounded-xl border p-4"
            :class="getWarningClasses(warning.severity).wrapper"
          >
            <div class="flex items-start gap-3">
              <AlertCircle
                :size="20"
                class="mt-0.5 shrink-0"
                :class="getWarningClasses(warning.severity).icon"
              />

              <div>
                <p class="font-semibold" :class="getWarningClasses(warning.severity).title">
                  {{ warning.severity === 'error' ? 'Greška pri obradi' : 'Potrebna provjera' }}
                </p>

                <p class="mt-1 text-sm" :class="getWarningClasses(warning.severity).text">
                  {{ warning.message }}
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- Izdvojeni podaci -->
      <section class="rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-6">
        <div class="flex items-center gap-3">
          <div
            class="flex size-11 items-center justify-center rounded-xl bg-brand-cream-100 text-brand-red-700"
          >
            <WandSparkles :size="22" />
          </div>

          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red-700">
              Rezultat ekstrakcije
            </p>

            <h3 class="mt-1 text-xl font-bold text-brand-brown-900">Izdvojeni podaci narudžbe</h3>
          </div>
        </div>

        <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article class="rounded-xl bg-brand-cream-50 p-4">
            <div class="flex items-center gap-2 text-sm text-stone-500">
              <UserRound :size="17" />
              Kupac
            </div>

            <p class="mt-3 font-bold text-brand-brown-900">
              {{ matchedCustomerName }}
            </p>

            <p class="mt-1 text-xs text-stone-500">OIB: {{ matchedCustomerOib }}</p>

            <p class="mt-1 text-xs text-stone-500">
              Povezano prema:
              {{ getMatchMethodLabel(extraction?.customerMatch?.matchMethod) }}
            </p>
          </article>

          <article class="rounded-xl bg-brand-cream-50 p-4">
            <div class="flex items-center gap-2 text-sm text-stone-500">
              <Hash :size="17" />
              Broj narudžbe
            </div>

            <p class="mt-3 text-xl font-bold text-brand-brown-900">
              {{ extraction?.orderNumber || '—' }}
            </p>
          </article>

          <article class="rounded-xl bg-brand-cream-50 p-4">
            <div class="flex items-center gap-2 text-sm text-stone-500">
              <CalendarDays :size="17" />
              Datum isporuke
            </div>

            <p class="mt-3 text-xl font-bold text-brand-brown-900">
              {{ formatDate(extraction?.deliveryDate) }}
            </p>
          </article>

          <article class="rounded-xl bg-brand-cream-50 p-4">
            <div class="flex items-center gap-2 text-sm text-stone-500">
              <FileText :size="17" />
              Napomena
            </div>

            <p class="mt-3 font-semibold text-brand-brown-900">
              {{ extraction?.note || 'Nema napomene' }}
            </p>
          </article>
        </div>
      </section>

      <!-- Izdvojene stavke -->
      <section class="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm">
        <header
          class="flex flex-col gap-3 border-b border-brand-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red-700">
              Prepoznati proizvodi
            </p>

            <h3 class="mt-1 text-xl font-bold text-brand-brown-900">Stavke narudžbe</h3>
          </div>

          <span
            class="w-fit rounded-lg bg-brand-cream-100 px-3 py-2 text-xs font-semibold text-brand-brown-900"
          >
            {{ matchingSummary.totalItems }} stavki
          </span>
        </header>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-brand-border">
            <thead class="bg-brand-cream-100/70">
              <tr>
                <th
                  class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6"
                >
                  Naziv iz PDF-a
                </th>

                <th
                  class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500"
                >
                  Povezani proizvod
                </th>

                <th
                  class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500"
                >
                  Način povezivanja
                </th>

                <th
                  class="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-500"
                >
                  Količina
                </th>

                <th
                  class="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6"
                >
                  Status
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-brand-border">
              <tr
                v-for="(item, index) in extraction?.items || []"
                :key="`${item.customerProductCode}-${index}`"
                class="transition hover:bg-brand-cream-50"
              >
                <td class="px-5 py-4 sm:px-6">
                  <p class="font-semibold text-brand-brown-900">
                    {{ item.originalProductName || '—' }}
                  </p>

                  <p class="mt-1 text-xs text-stone-500">
                    Šifra kupca:
                    {{ item.customerProductCode || '—' }}
                  </p>

                  <p class="mt-1 text-xs text-stone-500">
                    Barkod:
                    {{ item.customerBarcode || '—' }}
                  </p>
                </td>

                <td class="px-5 py-4 text-sm text-stone-700">
                  <template v-if="item.matchedProduct">
                    <p class="font-semibold text-brand-brown-900">
                      {{ item.matchedProduct.name }}
                    </p>

                    <p class="mt-1 text-xs text-stone-500">
                      {{ item.matchedProduct.code }}
                      ·
                      {{ item.matchedProduct.packageWeightGrams }}
                      g
                    </p>
                  </template>

                  <span v-else class="text-red-700"> Proizvod nije pronađen </span>
                </td>

                <td class="whitespace-nowrap px-5 py-4 text-sm text-stone-700">
                  {{ getMatchMethodLabel(item.matchMethod) }}
                </td>

                <td
                  class="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-brand-brown-900"
                >
                  {{ formatNumber(item.quantity) }}
                </td>

                <td class="whitespace-nowrap px-5 py-4 text-right sm:px-6">
                  <span
                    class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                    :class="
                      item.matched ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    "
                  >
                    <Check v-if="item.matched" :size="14" />

                    <X v-else :size="14" />

                    {{ item.matched ? 'Povezano' : 'Nije povezano' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- OpenAI potrošnja -->
      <section
        v-if="analysisResult.usage"
        class="rounded-2xl border border-brand-border bg-white px-5 py-4 shadow-sm sm:px-6"
      >
        <div
          class="flex flex-col gap-3 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            Ulazni tokeni:
            <strong class="text-brand-brown-900">
              {{ formatNumber(analysisResult.usage.inputTokens) }}
            </strong>
          </span>

          <span>
            Izlazni tokeni:
            <strong class="text-brand-brown-900">
              {{ formatNumber(analysisResult.usage.outputTokens) }}
            </strong>
          </span>

          <span>
            Ukupno tokena:
            <strong class="text-brand-brown-900">
              {{ formatNumber(analysisResult.usage.totalTokens) }}
            </strong>
          </span>
        </div>
      </section>
    </template>
  </section>
  <ConfirmationModal
    :open="showResetConfirmation"
    :loading="false"
    title="Nova AI analiza"
    message="Jeste li sigurni da želite započeti novu AI analizu? Trenutni rezultat analize i učitani PDF bit će uklonjeni."
    confirm-text="Započni novu analizu"
    loading-text="Pokretanje..."
    cancel-text="Odustani"
    @confirm="confirmStartNewAnalysis"
    @cancel="showResetConfirmation = false"
  />
</template>
