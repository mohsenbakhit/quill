import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState, useCallback } from "react";
import {
  ScreenplayParagraph,
  SCREENPLAY_TYPES,
  type ScreenplayType,
} from "@/lib/screenplay-extension";

const STORAGE_KEY = "scenecraft:doc:v1";
const TITLE_KEY = "scenecraft:title:v1";

const STARTER_DOC = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      attrs: { screenplayType: "scene" },
      content: [{ type: "text", text: "INT. COFFEE SHOP - DAY" }],
    },
    {
      type: "paragraph",
      attrs: { screenplayType: "action" },
      content: [
        {
          type: "text",
          text: "Rain streaks the window. MAYA (28), notebook open, stares at a blinking cursor. She sighs, closes the laptop.",
        },
      ],
    },
    {
      type: "paragraph",
      attrs: { screenplayType: "character" },
      content: [{ type: "text", text: "MAYA" }],
    },
    {
      type: "paragraph",
      attrs: { screenplayType: "parenthetical" },
      content: [{ type: "text", text: "(to herself)" }],
    },
    {
      type: "paragraph",
      attrs: { screenplayType: "dialogue" },
      content: [
        { type: "text", text: "One more cup. Then the words come. That's the deal." },
      ],
    },
    {
      type: "paragraph",
      attrs: { screenplayType: "transition" },
      content: [{ type: "text", text: "CUT TO:" }],
    },
  ],
};

function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

export function ScreenplayEditor() {
  const hydrated = useHydrated();
  const [title, setTitle] = useState("Untitled Screenplay");
  const [currentType, setCurrentType] = useState<ScreenplayType>("action");
  const [wordCount, setWordCount] = useState(0);
  const [saved, setSaved] = useState(true);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        code: false,
        paragraph: false,
      }),
      ScreenplayParagraph,
      Placeholder.configure({
        placeholder: ({ node }) => {
          const t = (node.attrs.screenplayType as ScreenplayType) || "action";
          const map: Record<ScreenplayType, string> = {
            scene: "INT. LOCATION - DAY",
            action: "Describe the scene…",
            character: "CHARACTER NAME",
            parenthetical: "(beat)",
            dialogue: "What do they say?",
            transition: "CUT TO:",
            shot: "CLOSE ON —",
          };
          return map[t];
        },
      }),
    ],
    content: STARTER_DOC,
    editorProps: {
      attributes: {
        class: "sp-editor-content",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
      setSaved(false);
    },
    onSelectionUpdate: ({ editor }) => {
      const { $from } = editor.state.selection;
      const node = $from.node($from.depth);
      if (node?.type.name === "paragraph") {
        setCurrentType((node.attrs.screenplayType as ScreenplayType) || "action");
      }
    },
    immediatelyRender: false,
  });

  // Load persisted content on hydrate
  useEffect(() => {
    if (!editor || !hydrated) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const t = localStorage.getItem(TITLE_KEY);
      if (t) setTitle(t);
      if (raw) {
        editor.commands.setContent(JSON.parse(raw));
      }
      const text = editor.getText();
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
      setSaved(true);
    } catch {
      /* ignore */
    }
  }, [editor, hydrated]);

  // Autosave (debounced)
  useEffect(() => {
    if (!editor || !hydrated) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(editor.getJSON()));
        localStorage.setItem(TITLE_KEY, title);
        setSaved(true);
      } catch {
        /* ignore */
      }
    }, 600);
    return () => clearTimeout(id);
  }, [editor, title, wordCount, hydrated]);

  const applyType = useCallback(
    (t: ScreenplayType) => {
      if (!editor) return;
      // @ts-expect-error - custom command
      editor.chain().focus().setScreenplayType(t).run();
      setCurrentType(t);
    },
    [editor],
  );

  const pages = Math.max(1, Math.ceil(wordCount / 220)); // rough industry heuristic

  return (
    <div className="sp-app">
      <header className="sp-topbar">
        <div className="sp-topbar-inner">
          <div className="sp-brand">
            <span className="sp-brand-mark">SC</span>
            <span className="sp-brand-name">Scenecraft</span>
          </div>
          <input
            className="sp-title-input"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaved(false);
            }}
            aria-label="Screenplay title"
          />
          <div className="sp-meta">
            <span>{wordCount.toLocaleString()} words</span>
            <span className="sp-meta-dot">•</span>
            <span>~{pages} pg</span>
            <span className="sp-meta-dot">•</span>
            <span className={saved ? "sp-saved" : "sp-unsaved"}>
              {saved ? "Saved" : "Saving…"}
            </span>
          </div>
        </div>
        <div className="sp-toolbar" role="toolbar" aria-label="Element type">
          {SCREENPLAY_TYPES.map((t) => (
            <button
              key={t.type}
              type="button"
              className={`sp-tool ${currentType === t.type ? "sp-tool-active" : ""}`}
              onClick={() => applyType(t.type)}
              title={t.shortcut}
            >
              {t.label}
            </button>
          ))}
          <div className="sp-tool-hint">
            <kbd>Tab</kbd> cycle · <kbd>Enter</kbd> next
          </div>
        </div>
      </header>

      <main className="sp-canvas">
        <div className="sp-page">
          <EditorContent editor={editor} />
        </div>
      </main>
    </div>
  );
}