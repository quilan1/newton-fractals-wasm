use serde::Deserialize;
use wasm_bindgen::prelude::*;

use crate::TryFromJs;

#[wasm_bindgen]
#[derive(Deserialize)]
pub struct Transform {
    pub s: f32,
    pub tx: f32,
    pub ty: f32,
}

impl TryFromJs<Transform> for JsValue {}

#[wasm_bindgen(module = "@app/(util)/transform.ts")]
extern "C" {
    #[wasm_bindgen(js_name = "newTransform")]
    fn new_transform(scale: f32, x: f32, y: f32) -> JsValue;
}

impl Transform {
    pub fn to_js(&self) -> JsValue {
        new_transform(self.s, self.tx, self.ty)
    }
}
