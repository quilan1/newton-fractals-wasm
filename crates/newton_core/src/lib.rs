// A macro to provide `println!(..)`-style syntax for `console.log` logging.
macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

mod config;
mod func;
mod generate;
mod newton;
mod raster;
mod roots;

use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn run() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn render(polynomial: &str, config: config::Config, method: i32) -> raster::Image {
    crate::generate::generate_saved(polynomial, &config, method)
}

#[wasm_bindgen]
pub fn render2(ctx: &web_sys::CanvasRenderingContext2d, row: i32) -> Result<(), JsValue> {
    generate::generate_row(ctx, row)
}
