use serde::Deserialize;
use wasm_bindgen::prelude::*;

use crate::TryFromJs;

#[wasm_bindgen]
#[derive(Deserialize)]
pub struct Transform {
    pub scale: f32,
    pub translate: Point,
}

#[wasm_bindgen]
#[derive(Deserialize, Clone, Copy)]
pub struct Point {
    pub x: f32,
    pub y: f32,
}

impl TryFromJs<Transform> for JsValue {}

#[wasm_bindgen(module = "@app/(util)/transform.ts")]
extern "C" {
    #[wasm_bindgen(js_name = "newTransform")]
    fn new_transform(scale: f32, x: f32, y: f32) -> JsValue;
}

impl Transform {
    pub fn to_js(&self) -> JsValue {
        new_transform(self.scale, self.translate.x, self.translate.y)
    }
}
