mod complex;
mod polynomial;
mod render;

use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn run() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();

    // use log::Level;
    console_log::init().expect("Error intializing log");
    // console_log::init_with_level(Level::Debug).expect("Error initializing log");
}
