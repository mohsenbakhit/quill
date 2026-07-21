<template>
  <div class="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
    <!-- Left: Document title -->
    <div class="flex items-center gap-3">
      <input
        v-model="documentTitle"
        type="text"
        placeholder="Untitled Screenplay"
        class="text-sm font-medium bg-transparent border-0 border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 transition-colors"
      />
    </div>

    <!-- Right: Action buttons -->
    <div class="flex items-center gap-2">
      <button
        @click="save"
        class="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
        title="Save (Ctrl+S)"
      >
        <span>💾</span>
      </button>

      <button
        @click="exportScreenplay"
        class="px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded border border-blue-600 transition-colors"
      >
        Export
      </button>

      <button
        @click="openSettings"
        class="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
        title="Settings"
      >
        <span>⚙️</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
 import { ref } from 'vue'

 const documentTitle = ref('Untitled Screenplay')

 const emit = defineEmits<{
     save: []
     'export': []
     'open-settings': []
 }>()

 const save = () => {
     emit('save')
     console.log('Saved:', documentTitle.value)
 }

 const exportScreenplay = () => {
     emit('export')
 }

 const openSettings = () => {
     emit('open-settings')
 }
</script>

<style scoped>
 input::placeholder {
     color: #d1d5db;
 }
</style>
