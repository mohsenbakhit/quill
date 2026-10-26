export type ScreenplayBlock = {
  type:
    | "scene"
    | "action"
    | "character"
    | "dialogue"
    | "parenthetical"
    | "transition";
  text: string;
};
