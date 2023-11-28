mod js_imports;
mod pixel_data_buffer;
mod polynomial;
mod render;
mod roots;
mod scale_row;

use wasm_bindgen::prelude::*;

///////////////////////////////////////////////////////////////////

#[wasm_bindgen(start)]
pub fn run() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
    console_log::init().expect("Error intializing log");
}

#[wasm_bindgen(js_name = __complexWindow)]
pub fn complex_window() -> f32 {
    newton_core::COMPLEX_WINDOW
}

#[wasm_bindgen(js_name = __canvasSize)]
pub fn canvas_size() -> usize {
    newton_core::CANVAS_SIZE
}

#[wasm_bindgen(js_name = __unitsPerPixelBase)]
pub fn units_per_pixel_base() -> f32 {
    units_per_pixel_scaled(newton_core::CANVAS_SIZE)
}

pub fn units_per_pixel_scaled(num_pixels: usize) -> f32 {
    2.0 * newton_core::COMPLEX_WINDOW / num_pixels as f32
}
