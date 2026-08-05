import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAiProcessingStore = defineStore('aiProcessing', () => {
  const selectedFile = ref(null)
  const uploadedFile = ref(null)
  const analysisResult = ref(null)

  const uploading = ref(false)
  const analyzing = ref(false)
  const deleting = ref(false)

  const error = ref('')
  const successMessage = ref('')

  function setSelectedFile(file) {
    selectedFile.value = file
  }

  function setUploadedFile(fileData) {
    uploadedFile.value = fileData
  }

  function setAnalysisResult(result) {
    analysisResult.value = result
  }

  function setUploading(value) {
    uploading.value = Boolean(value)
  }

  function setAnalyzing(value) {
    analyzing.value = Boolean(value)
  }

  function setDeleting(value) {
    deleting.value = Boolean(value)
  }

  function setError(message = '') {
    error.value = message
  }

  function setSuccessMessage(message = '') {
    successMessage.value = message
  }

  function clearMessages() {
    error.value = ''
    successMessage.value = ''
  }

  function clearAnalysis() {
    selectedFile.value = null
    uploadedFile.value = null
    analysisResult.value = null

    uploading.value = false
    analyzing.value = false
    deleting.value = false

    error.value = ''
    successMessage.value = ''
  }

  return {
    selectedFile,
    uploadedFile,
    analysisResult,

    uploading,
    analyzing,
    deleting,

    error,
    successMessage,

    setSelectedFile,
    setUploadedFile,
    setAnalysisResult,

    setUploading,
    setAnalyzing,
    setDeleting,

    setError,
    setSuccessMessage,

    clearMessages,
    clearAnalysis,
  }
})
