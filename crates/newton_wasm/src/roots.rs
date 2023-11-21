use newton_core::Roots as R;
use serde::Deserialize;
use wasm_bindgen::prelude::*;
use web_sys::js_sys::Array;

use crate::{complex::Complex, polynomial::Polynomial};

#[wasm_bindgen]
pub struct Roots(pub(crate) R);

#[wasm_bindgen]
#[derive(Deserialize)]
pub struct OklchColor {
    pub h: f32,
    pub c: f32,
}

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
    pub fn roots(&self) -> Vec<Complex> {
        self.0.roots.iter().cloned().map(From::from).collect()
    }

    #[wasm_bindgen]
    pub fn colors(&self) -> Vec<OklchColor> {
        self.0.colors.iter().cloned().map(From::from).collect()
    }

    #[wasm_bindgen]
    pub fn set_colors(&mut self, colors: &Array) -> Result<(), JsError> {
        if colors.length() != self.0.colors.len() as u32 {
            return Err(JsError::new(&format!(
                "There should be {} colors for the roots",
                self.0.colors.len()
            )));
        }

        for (index, color) in colors.iter().enumerate() {
            let color: OklchColor = serde_wasm_bindgen::from_value(color)?;
            self.0.colors[index] = color.into();
        }

        Ok(())
    }
}

impl From<newton_core::OklchColor> for OklchColor {
    fn from(value: newton_core::OklchColor) -> Self {
        Self {
            h: value.h,
            c: value.c,
        }
    }
}

impl From<OklchColor> for newton_core::OklchColor {
    fn from(value: OklchColor) -> Self {
        Self {
            h: value.h,
            c: value.c,
        }
    }
}
