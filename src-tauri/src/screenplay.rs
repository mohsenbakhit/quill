use serde::Deserialize;

#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum Block {
    Scene { text: String },
    Action { text: String },
    Character { text: String },
    Dialogue { text: String },
    Parenthetical { text: String },
    Transition { text: String },
}
