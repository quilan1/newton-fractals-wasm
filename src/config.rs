use wasm_bindgen::prelude::*;

#[derive(Copy, Clone)]
pub(crate) struct Window {
    pub(crate) re0: f64,
    pub(crate) im0: f64,
    pub(crate) re1: f64,
    pub(crate) im1: f64,
}

#[wasm_bindgen]
#[derive(Copy, Clone)]
pub struct Config {
    pub(crate) width: usize,                 // Width of the rendered image
    pub(crate) height: usize,                // Height of the rendered image
    pub(crate) window: Window,             // Coordinates for the complex window
    pub(crate) zero: f64,                  // When we consider having reached a zero. if |f(z)| < zero, it's a zero.
    pub(crate) loopmax: usize,             // How far we calculate before bailing.
    pub(crate) shading_stddev: f64,        // Shading. Higher == bright+low contrast, Lower == dark, more contrast
    pub(crate) saturation: f64,
    pub(crate) show_loops: bool,
}

#[wasm_bindgen]
impl Config {
    pub fn new(width: usize, height: usize, loopmax: usize, saturation: f64, show_loops: bool) -> Config {
        Config {
            width,
            height,
            window: Window { re0: -1.5, im0: -1.5, re1: 1.5, im1: 1.5 },
            zero: 1e-5,
            loopmax,
            shading_stddev: 20.,
            saturation,
            show_loops,
        }
    }
}