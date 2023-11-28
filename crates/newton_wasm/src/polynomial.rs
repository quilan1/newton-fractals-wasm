use wasm_bindgen::prelude::*;

use newton_core::Polynomial as P;

use crate::{js_imports::JsComplex, js_imports::JsTryInto};

///////////////////////////////////////////////////////////////////

#[wasm_bindgen]
pub struct Polynomial {
    pub(crate) poly: P,
}

///////////////////////////////////////////////////////////////////

#[wasm_bindgen]
impl Polynomial {
    #[wasm_bindgen(constructor)]
    pub fn new(formula: &str) -> Result<Polynomial, JsError> {
        Ok(Self {
            poly: P::parse(formula).map_err(|err| JsError::new(&err.to_string()))?,
        })
    }

    pub fn eval_f0(&self, z: JsComplex) -> Result<JsComplex, JsError> {
        Ok(self.poly.f0(z.js_try_into()?).into())
    }

    pub fn eval_f1(&self, z: JsComplex) -> Result<JsComplex, JsError> {
        Ok(self.poly.f1(z.js_try_into()?).into())
    }
}
