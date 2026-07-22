# Quill

A modern, web-based screenwriting editor built for speed, correctness, and industry-standard formatting — without the bloat or the cost of legacy desktop software.

Screenwriting has strict formatting rules (scene headings, character cues, dialogue, parentheticals, transitions) that most rich text editors weren't built to enforce. Quill treats the screenplay as a structured document — not free-form text — so writers get correct formatting automatically, every time.

## Features

### Core Editing
- **Industry-standard element types** — Scene Heading, Action, Character, Dialogue, Parenthetical, Transition, Shot, and General, each with correct formatting, casing, and indentation applied automatically.
- **Smart element transitions** — Enter and Tab move between element types the way professional screenwriting tools do (e.g. Character → Dialogue on Enter, Dialogue → Parenthetical on Tab).
- **Auto-formatting** — Scene headings and character cues auto-capitalize as you type; margins and spacing follow the Courier Prime / 12pt standard (1.5" left margin, 1" right margin).
- **Scene numbering** — Automatic scene numbers with manual override support for production drafts.
- **Character & location tracking** — Running index of characters and locations extracted live from the script, with autocomplete when typing Scene Headings or Character cues.

### Formatting & Output
- **Accurate pagination** — Real-time page count that mirrors the "1 page ≈ 1 minute of screen time" industry convention.
- **Title page generation** — Standard title page layout (title, byline, contact info, draft date).
- **Revision mode** — Colored revision pages and change bars for production/tracked drafts (White, Blue, Pink, Yellow, Green, etc.).
- **Export formats**
  - PDF (industry-standard formatting)
  - Final Draft (`.fdx`)
  - Fountain (plain-text screenplay markup)
  - Plain text

### Platform
- Native desktop app — Built with Tauri for a lightweight, fast, cross-platform (Windows/macOS/Linux) experience with a small binary size and native OS integration.
- Local-first storage — Scripts are saved to disk via Tauri's filesystem APIs, with optional cloud sync layered on top.
- Autosave — Continuous autosave to the local filesystem, with version snapshots.
- Keyboard-first workflow — Full keyboard shortcut support matching conventions from Final Draft/WriterDuet for a low-friction transition.

## Tech Stack

- **Editor core:** [Tiptap](https://tiptap.dev/) (built on ProseMirror) — custom node schema for screenplay elements
- **Frontend:** React + TypeScript
- **Styling:** Tailwind CSS
- **App Shell:** App shell: Tauri (Rust backend + native webview)
- **Local storage**: Filesystem-based project files (via Tauri APIs), with SQLite for indexing/search
- **Export pipeline:** Custom `.fdx`/Fountain/PDF generators

## Getting Started

```bash
# Clone the repo
git clone https://github.com/mohsenbakhit/quill.git
cd quill

# Install dependencies
npm install

# Run the dev server
npm run tauri build dev
```

The app will be available at `http://localhost:1420`.

## Project Structure
quill/
├── src/                    # React frontend
│   ├── editor/                # Tiptap schema, extensions, and node types
│   ├── components/             # React UI components
│   ├── export/                    # PDF / FDX / Fountain export logic
│   └── pages/                        # App views/routes
├── src-tauri/               # Rust backend (Tauri commands, filesystem, native APIs)
└── docs/                          # Architecture and formatting spec docs

## Roadmap

- [x] Core screenplay schema (Scene Heading, Action, Character, Dialogue, Parenthetical, Transition)
- [x] Auto-formatting and element transitions
- [ ] PDF export
- [ ] FDX import/export
- [ ] Revision mode with colored pages

## Contributing

Contributions are welcome! Please open an issue to discuss significant changes before submitting a PR.

## License

[MIT](LICENSE)
