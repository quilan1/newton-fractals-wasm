mod complex;
mod pixel_data_buffer;
mod polynomial;
mod render;
mod roots;
mod scale_row;
mod transform;

use newton_core::{CANVAS_SIZE, COMPLEX_WINDOW};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn run() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
    console_log::init().expect("Error intializing log");
}

#[wasm_bindgen(js_name = __complexWindow)]
pub fn complex_window() -> f32 {
    COMPLEX_WINDOW
}

#[wasm_bindgen(js_name = __canvasSize)]
pub fn canvas_size() -> usize {
    CANVAS_SIZE
}

#[wasm_bindgen(js_name = __unitsPerPixelBase)]
pub fn units_per_pixel_base() -> f32 {
    units_per_pixel_scaled(CANVAS_SIZE)
}

pub fn units_per_pixel_scaled(num_pixels: usize) -> f32 {
    2.0 * COMPLEX_WINDOW / num_pixels as f32
}

pub trait ToJsValue {
    fn to_js_value(self) -> JsValue;
}

impl ToJsValue for JsValue {
    fn to_js_value(self) -> JsValue {
        self
    }
}

pub trait TryFromJs<T> {
    fn try_from_js(self) -> Result<T, JsError>
    where
        Self: Sized + ToJsValue,
        T: for<'de> serde::Deserialize<'de>,
    {
        serde_wasm_bindgen::from_value(self.to_js_value()).map_err(|e| e.into())
    }
}
