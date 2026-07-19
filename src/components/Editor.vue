<template>
  <div class="editor-wrapper h-full overflow-hidden">
    <editor-content :editor="editor" class="editor" />
  </div>
</template>

<script setup lang="ts">
 import { useEditor, EditorContent } from '@tiptap/vue-3'
 import StarterKit from '@tiptap/starter-kit'
 import { onMounted } from 'vue'

 const defaultContent = `<h1>Untitled Screenplay</h1>
<p></p>
<p><strong>INT. OFFICE - DAY</strong></p>
`

 const editor = useEditor({
     extensions: [
         StarterKit.configure({
             heading: {
                 levels: [1, 2, 3],
             },
         }),
     ],
     content: defaultContent,
     editorProps: {
         attributes: {
             class: 'prose prose-sm focus:outline-none',
         },
     },
 })

 onMounted(() => {
     // Focus editor on mount
     if (editor.value) {
         editor.value.commands.focus()
     }
 })
</script>

<style scoped>
 .editor-wrapper {
     display: flex;
     flex-direction: column;
     background: white;
 }

 .editor {
     flex: 1;
     overflow-y: auto;
     padding: 2rem;
 }

 :deep(.ProseMirror) {
     outline: none;
     font-family: 'Courier New', monospace;
     font-size: 13px;
     line-height: 1.8;
     color: #1f2937;
     word-wrap: break-word;
 }

 :deep(.ProseMirror p) {
     margin: 0.5rem 0;
 }

 :deep(.ProseMirror h1) {
     font-size: 18px;
     font-weight: 600;
     margin: 1rem 0 0.5rem 0;
     text-transform: uppercase;
 }

 :deep(.ProseMirror h2) {
     font-size: 16px;
     font-weight: 600;
     margin: 0.8rem 0 0.3rem 0;
     text-transform: uppercase;
 }

 :deep(.ProseMirror strong) {
     font-weight: 600;
     text-transform: uppercase;
 }

 /* Screenplay-specific formatting */
 :deep(.ProseMirror) .character {
     text-align: center;
     text-transform: uppercase;
     margin: 1rem 0 0 0;
 }

 :deep(.ProseMirror) .dialogue {
     margin-left: 2rem;
     margin-right: 2rem;
 }

 :deep(.ProseMirror) .parenthetical {
     margin-left: 2.5rem;
     font-style: italic;
 }
</style>
