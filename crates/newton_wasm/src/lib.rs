mod complex;
mod pixel_data_buffer;
mod polynomial;
mod render;
mod roots;
mod scale_row;

use newton_core::{CANVAS_SIZE, COMPLEX_WINDOW};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn run() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
    console_log::init().expect("Error intializing log");
}

#[wasm_bindgen(js_name = complexWindow)]
pub fn complex_window() -> f32 {
    COMPLEX_WINDOW
}

#[wasm_bindgen(js_name = canvasSize)]
pub fn canvas_size() -> usize {
    CANVAS_SIZE
}
