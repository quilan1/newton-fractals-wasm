use wasm_bindgen::prelude::*;

use newton_core::Polynomial as P;

use crate::complex::Complex;

#[wasm_bindgen]
pub struct Polynomial {
    pub(crate) poly: P,
}

#[wasm_bindgen]
impl Polynomial {
    #[wasm_bindgen(constructor)]
    pub fn new(formula: &str) -> Result<Polynomial, JsError> {
        Ok(Self {
            poly: P::parse(formula).map_err(|err| JsError::new(&err.to_string()))?,
        })
    }

    pub fn eval(&self, z: Complex) -> Complex {
        self.poly.f0(z.into()).into()
    }
}
