mod complex;
mod polynomial;
mod render;
mod roots;

use newton_core::{CANVAS_SIZE, COMPLEX_WINDOW};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn run() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
    console_log::init().expect("Error intializing log");
}

#[wasm_bindgen]
pub fn complex_window() -> f32 {
    COMPLEX_WINDOW
}

#[wasm_bindgen]
pub fn canvas_size() -> usize {
    CANVAS_SIZE
}
