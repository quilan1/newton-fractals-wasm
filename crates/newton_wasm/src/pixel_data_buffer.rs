use newton_core::PixelData;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct PixelDataBuffer {
    pub(crate) pixel_data: Vec<PixelData>,
}

impl PixelDataBuffer {
    pub fn new(pixel_data: Vec<PixelData>) -> Self {
        Self { pixel_data }
    }
}
