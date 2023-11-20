use newton_core::Roots as R;
use wasm_bindgen::prelude::*;

use crate::{complex::Complex, polynomial::Polynomial};

#[wasm_bindgen]
pub struct Roots(pub(crate) R);

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
}
