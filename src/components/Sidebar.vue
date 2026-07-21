<template>
  <div class="w-60 bg-gray-50 border-r border-gray-200 flex flex-col">
    <!-- Scenes section -->
    <div class="flex-1 overflow-y-auto">
      <div class="px-4 py-4">
        <h3 class="text-xs font-medium text-gray-600 uppercase tracking-wide">Scenes</h3>
        <div class="mt-3 space-y-1">
          <button
            v-for="(scene, index) in scenes"
            :key="index"
            @click="selectScene(index)"
            :class="[
              'w-full text-left px-3 py-2 rounded text-sm transition-colors',
              activeScene === index
                ? 'bg-blue-100 text-blue-900 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            ]"
          >
            <span class="text-gray-500 text-xs">{{ index + 1 }}.</span>
            {{ scene.heading }}
          </button>
        </div>
      </div>

      <div class="border-t border-gray-200 px-4 py-4">
        <h3 class="text-xs font-medium text-gray-600 uppercase tracking-wide">Pages</h3>
        <div class="mt-3 space-y-1">
          <button
            v-for="(page, index) in pageRanges"
            :key="index"
            @click="selectPage(index)"
            :class="[
              'w-full text-left px-3 py-2 rounded text-sm transition-colors',
              activePage === index
                ? 'bg-blue-100 text-blue-900 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            ]"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
 import { ref, computed } from 'vue'
 import { useScreenplayStore } from '../state/screenplayState'

 const props = defineProps<{
     activeScene: number
 }>()

 const emit = defineEmits<{
     'select-scene': [index: number]
 }>()
 const store = useScreenplayStore()
 const activePage = ref(0)

 interface Scene {
     heading: string
     startLine: number
 }

 const scenes = computed<Scene[]>(() => {
     // Parse scenes from the screenplay content
     // For now, return mock data
     return [
         { heading: 'INT. OFFICE - DAY', startLine: 0 },
         { heading: 'INT. HALLWAY - MORNING', startLine: 15 },
         { heading: 'INT. CONFERENCE ROOM - DAY', startLine: 35 },
         { heading: 'EXT. STREET - NIGHT', startLine: 52 },
         { heading: 'INT. APARTMENT - EVENING', startLine: 68 }
     ]
 })

 const pageRanges = computed(() => {
     const ranges = []
     for (let i = 0; i < store.totalPages; i += 5) {
         const end = Math.min(i + 5, store.totalPages)
         ranges.push(`${i + 1} - ${end}`)
     }
     return ranges
 })

 const selectScene = (index: number) => {
     emit('select-scene', index)
 }

 const selectPage = (index: number) => {
     activePage.value = index
 }
</script>

<style scoped>
</style>
