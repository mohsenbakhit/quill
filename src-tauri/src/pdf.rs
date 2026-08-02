use printpdf::{Mm, Pt};

use crate::screenplay::Block;
use std::fs;

const POINTS_PER_INCH: f64 = 72.0;
const PAGE_HEIGHT_IN: f64 = 11.0;
const TOP_MARGIN_IN: f64 = 1.0;
const BOTTOM_MARGIN_IN: f64 = 1.0;
const PAGE_CONTENT_HEIGHT_PT: f64 =
    (PAGE_HEIGHT_IN - TOP_MARGIN_IN - BOTTOM_MARGIN_IN) * POINTS_PER_INCH;
const LINE_HEIGHT_PT: f64 = 12.0;

fn count_wrapped_lines(text: &str, max_chars: usize) -> usize {
    if text.is_empty() {
        return 1;
    }

    let mut lines = 1;
    let mut chars = 0;

    for word in text.split(' ') {
        let addition = if chars == 0 {
            word.len()
        } else {
            word.len() + 1
        };

        if chars + addition > max_chars {
            lines += 1;
            chars = word.len();
        } else {
            chars += addition;
        }
    }

    lines
}

pub fn export(blocks: Vec<Block>) -> Result<(), Box<dyn std::error::Error>> {
    let mut file = fs::File::open("temp.pdf");
    Ok(())
}

pub fn move_down(y: &mut Mm, distance: Mm) {
    *y -= distance;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_string_is_one_line() {
        assert_eq!(count_wrapped_lines("", 60), 1);
    }

    #[test]
    fn short_line_fits_on_one_line() {
        assert_eq!(count_wrapped_lines("short line", 60), 1);
    }

    #[test]
    fn long_paragraph_wraps_correctly() {
        let text = "Sarah enters the coffee shop, glancing around nervously before spotting Marcus in the corner booth.";
        assert_eq!(count_wrapped_lines(text, 60), 2);
    }
}
