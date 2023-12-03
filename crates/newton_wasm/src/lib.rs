mod js_imports;
mod pixel_data_buffer;
mod polynomial;
mod render;
mod roots;
mod scale_row;

use wasm_bindgen::prelude::*;

///////////////////////////////////////////////////////////////////

// SAFETY: This application is single threaded, so using AssumeSingleThreaded is allowed.
#[cfg(target_arch = "wasm32")]
#[global_allocator]
static ALLOCATOR: lol_alloc::AssumeSingleThreaded<lol_alloc::FreeListAllocator> =
    unsafe { lol_alloc::AssumeSingleThreaded::new(lol_alloc::FreeListAllocator::new()) };

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
