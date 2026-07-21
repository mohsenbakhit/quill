import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Screenplay {
  title: string
  content: string
  authors: string[]
  pages: number
  lastModified: Date
}

export const useScreenplayStore = defineStore('screenplay', () => {
  // State
  const screenplay = ref<Screenplay>({
    title: 'Untitled Screenplay',
    content: '',
    authors: [],
    pages: 1,
    lastModified: new Date(),
  })

  const isSaved = ref(true)
  const isLoading = ref(false)

  // Computed
  const totalPages = computed(() => {
    // Roughly 55 lines per page in screenplay format
    const lineCount = screenplay.value.content.split('\n').length
    return Math.ceil(lineCount / 55)
  })

  const hasUnsavedChanges = computed(() => !isSaved.value)

  // Actions
  const setContent = (content: string) => {
    screenplay.value.content = content
    screenplay.value.lastModified = new Date()
    isSaved.value = false
  }

  const setTitle = (title: string) => {
    screenplay.value.title = title
  }

  const markAsSaved = () => {
    isSaved.value = true
  }

  const saveScreenplay = async () => {
    isLoading.value = true
    try {
      // Call Tauri command to save
      // const result = await invoke('save_screenplay', { screenplay: screenplay.value })
      markAsSaved()
    } catch (error) {
      console.error('Failed to save screenplay:', error)
    } finally {
      isLoading.value = false
    }
  }

  const loadScreenplay = async (filePath: string) => {
    isLoading.value = true
    try {
      // Call Tauri command to load
      // const result = await invoke('load_screenplay', { path: filePath })
      // screenplay.value = result
    } catch (error) {
      console.error('Failed to load screenplay:', error)
    } finally {
      isLoading.value = false
    }
  }

  const exportScreenplay = async (format: 'pdf' | 'docx' | 'fountain') => {
    try {
      // Call Tauri command to export
      // const result = await invoke('export_screenplay', {
      //   screenplay: screenplay.value,
      //   format
      // })
      return result
    } catch (error) {
      console.error('Failed to export screenplay:', error)
    }
  }

  return {
    screenplay,
    isSaved,
    isLoading,
    totalPages,
    hasUnsavedChanges,
    setContent,
    setTitle,
    markAsSaved,
    saveScreenplay,
    loadScreenplay,
    exportScreenplay,
  }
})
