<script setup lang="ts">
 import { ref, computed } from 'vue'
 import Sidebar from './components/Sidebar.vue'
 import Toolbar from './components/Toolbar.vue'
 import Editor from './components/Editor.vue'
 import { useScreenplayStore } from './stores/screenplayStore'

 const store = useScreenplayStore()
 const editorRef = ref()

 const currentScene = ref(0)
 const currentPage = ref(1)
 const totalPages = computed(() => store.totalPages)
 const lineNumber = ref(1)
 const columnNumber = ref(1)

 const saveScript = () => {
     console.log('Saving script...')
     // Trigger Tauri command to save
 }

 const exportScript = () => {
     console.log('Exporting script...')
     // Trigger Tauri command to export
 }

</script>

<template>
    <div class="flex h-screen bg-white"?
        <Sidebar />
        <div class="flex-1 flex flex-col">
            <Toolbar />

            <div class="flex-1 overflow-hidden">
                <Editor ref="editorRef" :key="currentScene" />
            </div>
            <div class="h-8 bg-gray-50 border-t border-gray-200 px-6 flex items-center
                        justify-between text-xs text-gray-500">
                <div> Page {{currentPage}} of {{totalPages}} </div>
                <div> Ln {{lineNo}}, Col {{colNo}} </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
</style>
