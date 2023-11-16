use num::complex::Complex64 as Complex;
use crate::config::Config;
use crate::raster::Color;

#[derive(Clone)]
pub struct Root {
    pub z: Complex,
    pub color: Color
}

pub struct Roots {
    roots: Vec<Root>
}

impl Roots {
    pub fn new() -> Self {
        Roots { roots: Vec::new() }
    }

    pub fn find_root(&mut self, config: &Config, z: &Complex) -> Root {
        let mut min_root_dist = 0.05;
        let mut min_root = -1;

        // Find the nearest existing root within 0.05 of our final z value.
        for (i, root) in self.roots.iter().enumerate() {
            let dist = (root.z - z).norm_sqr();
            if dist >= min_root_dist { continue; }

            min_root_dist = dist;
            min_root = i as i32;
        }

        // If we couldn't find an existing root within 0.05 of our z value, make a new one!
        if min_root < 0 {
            self.roots.push(Root { z: *z, color: calc_color(config, z) });
            min_root = self.roots.len() as i32 - 1;
        }

        self.roots[min_root as usize].clone()
    }
}

// Returns (r,g,b) from a hue from 0 to 360.
// 0 degrees == blue
// 120 degrees == red
// 240 degrees == green
fn calc_color(config: &Config, z: &Complex) -> Color {
    let mut hue = (z.arg() * 180.0 / std::f64::consts::PI) as i32;

    while hue < 0 { hue += 360; }

    let (r, g, b);
    if hue < 120 { g=0; r=hue; b=120-hue; }
    else if hue < 240 { b=0; g=hue-120; r=240-hue; }
    else { r=0; b=hue-240; g=360-hue; }

    let mut r = r as f64 / 120.0;
    let mut g = g as f64 / 120.0;
    let mut b = b as f64 / 120.0;

    let m = 255.0 / f64::max(f64::max(r, g), b);
    r *= m; g *= m; b *= m;

    let m = f64::max(f64::max(r, g), b);
    let s = f64::min(1., z.norm() / config.saturation);

    // println!("New root: s = {}, init rgb = {}, {}, {}", s, r, g, b);

    r = m*(1.-s) + r*s;
    g = m*(1.-s) + g*s;
    b = m*(1.-s) + b*s;

    r = f64::min(r, 255.);
    g = f64::min(g, 255.);
    b = f64::min(b, 255.);

    let (r, g, b) = (r as u8, g as u8, b as u8);

    Color { r, g, b, a: 0 }
}
