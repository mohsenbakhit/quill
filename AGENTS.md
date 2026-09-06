# Agent Guide

## Commands

- Install dependencies with `npm install`; keep `package-lock.json` in sync with `package.json`.
- Run the browser frontend with `npm run dev` at `http://localhost:1420`.
- Run the desktop app with `npm run tauri dev`; Tauri starts the Vite server using the fixed port in `vite.config.ts`.
- Run `npm run build` for the main verification step. It runs strict TypeScript checking before `vite build`.
- Build the packaged desktop app with `npm run tauri build`.
- Check Rust changes with `cargo check` from `src-tauri/`.
- There are currently no test, lint, or formatter scripts configured.

## Structure

- `src/main.tsx` mounts the React app; `src/App.tsx` wires the Tiptap editor, toolbar, and editor view.
- Screenplay document types and transitions are defined in `src/nodes/` and `src/extensions/`; update `screenplayExtensions` when adding editor behavior.
- `src/components/` contains UI, while `src/utils/` and `src/lib/` contain export, pagination, storage, and shared types.
- `src-tauri/src/lib.rs` registers native commands and plugins. `screenplay.rs` defines the JSON payload for Rust commands and `pdf.rs` implements PDF generation.
- Frontend PDF export calls the Rust `export_to_pdf` command; Fountain export is implemented in `src/utils/export.ts`.
- Tauri filesystem and dialog access is permissioned in `src-tauri/capabilities/default.json`; update it when adding new plugin APIs.

## Change Constraints

- Keep the Tauri frontend contract aligned: Rust `Block` uses camelCase tagged JSON, and frontend `formatEditorContent` must produce the matching block types.
- Tauri expects the frontend dev server on port `1420`; preserve the strict-port and HMR settings unless changing the Tauri config with them.
- `npm run build` typechecks only files included by `tsconfig.json` (`src`) plus the referenced Vite config; Rust verification is separate.
