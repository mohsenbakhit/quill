import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    clearScreen: false,
    server: {
      port: 1420,
      strictPort: true,
      watch: { ignored: ["**/src-tauri/**"] },
    },
  },
});
