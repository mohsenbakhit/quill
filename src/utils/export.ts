// export/fountain.ts
import type { JSONContent } from '@tiptap/react';

type ScreenplayBlock = {
  type:
    | "scene"
    | "action"
    | "character"
    | "dialogue"
    | "parenthetical"
    | "transition";
  text: string;
};

const TIGHT_PAIRS = new Set([
  'character->dialogue',
  'character->parenthetical',
  'dialogue->parenthetical',
  'parenthetical->dialogue',
]);

function needsBlankLineBetween(currentType: string, nextType: string): boolean {
  return !TIGHT_PAIRS.has(`${currentType}->${nextType}`);
}

function extractText(node: JSONContent): string {
  if (!node.content) return ''
  return node.content
    .map(child => child.text ?? '')
    .join('');
}

function formatNode(node: JSONContent): string {
  const text = extractText(node)

  switch (node.type) {
    case 'sceneHeading':
      return `.${text}`;
    case 'action':
      return text;
    case 'character':
      return `@${text}`;
    case 'dialogue':
      return text;
    case 'parenthetical':
      return `(${text})`
    case 'transition':
      return `>${text}`;
    default:
      return text;
  }
}

export function exportToFountain(doc: JSONContent): string {
  const nodes = doc.content ?? [];

  const parts: string[] = [];

  nodes.forEach((node, index) => {
    parts.push(formatNode(node));

    const nextNode = nodes[index + 1];
    if (nextNode) {
      const separator = needsBlankLineBetween(node.type!, nextNode.type!)
        ? '\n\n'
        : '\n'
      parts.push(separator);
    }
  })

  return parts.join('');
}

export function formatEditorContent(doc: any): ScreenplayBlock[] {
  if (!doc?.content) {
    return [];
  }

  return doc.content
    .map((node: any): ScreenplayBlock | null => {
      const text =
        node.content
          ?.filter((child: any) => child.type === "text")
          .map((child: any) => child.text)
          .join("") ?? "";

      switch (node.type) {
        case "sceneHeading":
          return {
            type: "scene",
            text,
          };

        case "action":
          return {
            type: "action",
            text,
          };

        case "character":
          return {
            type: "character",
            text,
          };

        case "dialogue":
          return {
            type: "dialogue",
            text,
          };

        case "parenthetical":
          return {
            type: "parenthetical",
            text,
          };

        case "transition":
          return {
            type: "transition",
            text,
          };

        default:
          console.warn(`Unknown node type: ${node.type}`);
          return null;
      }
    })
    .filter((block: ScreenplayBlock): block is ScreenplayBlock => block !== null);
}
