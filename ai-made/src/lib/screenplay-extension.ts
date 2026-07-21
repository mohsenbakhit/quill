import Paragraph from "@tiptap/extension-paragraph";

export type ScreenplayType =
  | "scene"
  | "action"
  | "character"
  | "parenthetical"
  | "dialogue"
  | "transition"
  | "shot";

export const SCREENPLAY_TYPES: { type: ScreenplayType; label: string; shortcut?: string }[] = [
  { type: "scene", label: "Scene Heading", shortcut: "⌘⌥1" },
  { type: "action", label: "Action", shortcut: "⌘⌥2" },
  { type: "character", label: "Character", shortcut: "⌘⌥3" },
  { type: "parenthetical", label: "Parenthetical", shortcut: "⌘⌥4" },
  { type: "dialogue", label: "Dialogue", shortcut: "⌘⌥5" },
  { type: "transition", label: "Transition", shortcut: "⌘⌥6" },
  { type: "shot", label: "Shot", shortcut: "⌘⌥7" },
];

// Tab cycles forward through the most common writing rhythm.
const TAB_CYCLE: Record<ScreenplayType, ScreenplayType> = {
  scene: "action",
  action: "character",
  character: "dialogue",
  parenthetical: "dialogue",
  dialogue: "character",
  transition: "scene",
  shot: "action",
};

// What Enter should produce after a given block.
const ENTER_NEXT: Record<ScreenplayType, ScreenplayType> = {
  scene: "action",
  action: "action",
  character: "dialogue",
  parenthetical: "dialogue",
  dialogue: "action",
  transition: "scene",
  shot: "action",
};

export const ScreenplayParagraph = Paragraph.extend({
  name: "paragraph",
  priority: 1000,

  addAttributes() {
    return {
      screenplayType: {
        default: "action" as ScreenplayType,
        parseHTML: (el) => (el.getAttribute("data-sp") as ScreenplayType) || "action",
        renderHTML: (attrs) => {
          const t = (attrs.screenplayType as ScreenplayType) || "action";
          return { "data-sp": t, class: `sp-block sp-${t}` };
        },
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setScreenplayType:
        (type: ScreenplayType) =>
        ({ commands }: { commands: { updateAttributes: (name: string, attrs: Record<string, unknown>) => boolean } }) => {
          return commands.updateAttributes("paragraph", { screenplayType: type });
        },
    } as never;
  },

  addKeyboardShortcuts() {
    const setType = (type: ScreenplayType) => () =>
      // @ts-expect-error - custom command
      this.editor.commands.setScreenplayType(type);

    return {
      "Mod-Alt-1": setType("scene"),
      "Mod-Alt-2": setType("action"),
      "Mod-Alt-3": setType("character"),
      "Mod-Alt-4": setType("parenthetical"),
      "Mod-Alt-5": setType("dialogue"),
      "Mod-Alt-6": setType("transition"),
      "Mod-Alt-7": setType("shot"),
      Tab: () => {
        const { $from } = this.editor.state.selection;
        const node = $from.node($from.depth);
        if (node.type.name !== "paragraph") return false;
        const current = (node.attrs.screenplayType as ScreenplayType) || "action";
        const next = TAB_CYCLE[current];
        // @ts-expect-error - custom command
        return this.editor.chain().focus().setScreenplayType(next).run();
      },
      "Shift-Tab": () => {
        const { $from } = this.editor.state.selection;
        const node = $from.node($from.depth);
        if (node.type.name !== "paragraph") return false;
        const current = (node.attrs.screenplayType as ScreenplayType) || "action";
        // Reverse: cycle backwards through the primary chain
        const order: ScreenplayType[] = [
          "scene",
          "action",
          "character",
          "parenthetical",
          "dialogue",
          "transition",
          "shot",
        ];
        const i = order.indexOf(current);
        const prev = order[(i - 1 + order.length) % order.length];
        // @ts-expect-error - custom command
        return this.editor.chain().focus().setScreenplayType(prev).run();
      },
      Enter: () => {
        const { $from, empty } = this.editor.state.selection;
        const node = $from.node($from.depth);
        if (node.type.name !== "paragraph") return false;
        const current = (node.attrs.screenplayType as ScreenplayType) || "action";

        // On an empty block, Enter falls back to Action (like Final Draft).
        if (empty && node.content.size === 0) {
          if (current === "action") return false;
          // @ts-expect-error - custom command
          return this.editor.chain().focus().setScreenplayType("action").run();
        }

        const next = ENTER_NEXT[current];
        return this.editor
          .chain()
          .focus()
          .splitBlock()
          .updateAttributes("paragraph", { screenplayType: next })
          .run();
      },
    };
  },
});