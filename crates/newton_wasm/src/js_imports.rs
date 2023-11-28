use serde::Deserialize;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(typescript_custom_section)]
const TS_APPEND: &'static str = r#"

import { Complex, OklchColor, Transform } from '@/app/(newton)/(wrapper)/structs';

type OklchColorArray = OklchColor[];

"#;

#[wasm_bindgen(module = "@/app/(newton)/(wrapper)/structs")]
extern "C" {
    #[wasm_bindgen(typescript_type = "Complex")]
    pub type JsComplex;

    #[wasm_bindgen(typescript_type = "OklchColor")]
    pub type JsOklchColor;

    #[wasm_bindgen(typescript_type = "OklchColorArray")]
    pub type JsOklchColorArray;

    #[wasm_bindgen(typescript_type = "Transform")]
    pub type JsTransform;

    #[wasm_bindgen(js_name = "__newComplex")]
    pub fn new_complex(re: f32, im: f32) -> JsComplex;

    #[wasm_bindgen(js_name = "__newOklchColor")]
    pub fn new_oklch_color(h: f32, c: f32) -> JsOklchColor;

    #[wasm_bindgen(js_name = "__newTransform")]
    pub fn new_transform(scale: f32, x: f32, y: f32) -> JsTransform;
}

///////////////////////////////////////////////////////////////////

pub trait JsTryInto<T> {
    fn js_try_into(self) -> Result<T, JsError>;
}

impl<T: for<'de> Deserialize<'de>, U: Sized + Into<JsValue>> JsTryInto<T> for U {
    fn js_try_into(self) -> Result<T, JsError> {
        serde_wasm_bindgen::from_value(self.into()).map_err(|e| e.into())
    }
}

///////////////////////////////////////////////////////////////////

impl From<num_complex::Complex32> for JsComplex {
    fn from(value: num_complex::Complex32) -> Self {
        new_complex(value.re, value.im)
    }
}

///////////////////////////////////////////////////////////////////

impl From<newton_core::OklchColor> for JsOklchColor {
    fn from(value: newton_core::OklchColor) -> Self {
        new_oklch_color(value.h, value.c)
    }
}

///////////////////////////////////////////////////////////////////

#[derive(Deserialize)]
pub struct Transform {
    pub scale: f32,
    pub translate: Point,
}

#[derive(Deserialize, Clone, Copy)]
pub struct Point {
    pub x: f32,
    pub y: f32,
}

///////////////////////////////////////////////////////////////////

impl From<Transform> for JsTransform {
    fn from(value: Transform) -> Self {
        new_transform(value.scale, value.translate.x, value.translate.y)
    }
}
