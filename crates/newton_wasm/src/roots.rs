use newton_core::Roots as R;
use wasm_bindgen::prelude::*;
use web_sys::js_sys::Array;

use crate::{
    js_imports::JsComplex,
    js_imports::{JsOklchColor, JsOklchColorArray, JsTryInto},
    polynomial::Polynomial,
};

///////////////////////////////////////////////////////////////////

#[wasm_bindgen]
pub struct Roots(pub(crate) R);

///////////////////////////////////////////////////////////////////

#[wasm_bindgen]
impl Roots {
    #[wasm_bindgen(constructor)]
    pub fn new(fz: &Polynomial) -> Result<Roots, JsError> {
        match R::new(&fz.poly) {
            Some(r) => Ok(Roots(r)),
            None => Err(JsError::new("No roots found for polynomial")),
        }
    }

    #[wasm_bindgen]
    pub fn roots(&self) -> Vec<JsComplex> {
        self.0.roots.iter().cloned().map(Into::into).collect()
    }

    #[wasm_bindgen]
    pub fn colors(&self) -> Vec<JsOklchColor> {
        self.0.colors.iter().cloned().map(Into::into).collect()
    }

    #[wasm_bindgen(js_name = "setColors")]
    pub fn set_colors(&mut self, colors: JsOklchColorArray) -> Result<(), JsError> {
        let colors: JsValue = colors.into();
        let colors: Array = colors.into();
        if colors.length() != self.0.colors.len() as u32 {
            return Err(JsError::new(&format!(
                "There should be {} colors for the roots",
                self.0.colors.len()
            )));
        }

        for (index, color) in colors.iter().enumerate() {
            self.0.colors[index] = color.js_try_into()?;
        }

        Ok(())
    }
}
