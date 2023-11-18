use num_complex::Complex32;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Complex {
    pub re: f32,
    pub im: f32,
}

impl From<Complex32> for Complex {
    fn from(value: Complex32) -> Self {
        Self {
            re: value.re,
            im: value.im,
        }
    }
}
