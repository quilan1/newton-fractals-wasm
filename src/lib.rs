// A macro to provide `println!(..)`-style syntax for `console.log` logging.
macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

mod roots;
mod func;
mod newton;
mod generate;
mod raster;
mod config;

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
