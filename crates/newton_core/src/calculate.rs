use num_complex::Complex32;

use crate::polynomial::{FPolynomial, Polynomial, TPolynomial};

// All calculations are done within the window:
// (-COMPLEX_WINDOW - i * COMPLEX_WINDOW) to (COMPLEX_WINDOW + i * COMPLEX_WINDOW)
const COMPLEX_WINDOW: f32 = 1.5;

pub fn calculate_row(fz: &FPolynomial, row: u32, width: u32, height: u32, pixel_data: &mut [u8]) {
    let z_im = (row as f32 / height as f32).lerp(-COMPLEX_WINDOW, COMPLEX_WINDOW);
    let delta_re = 2.0 * COMPLEX_WINDOW / width as f32;
    let mut z_re = -COMPLEX_WINDOW;

    pixel_data.chunks_mut(4).for_each(|pixel| {
        calculate_pixel(fz, z_re, z_im, pixel);
        z_re += delta_re;
    });
}

fn calculate_pixel(fz: &FPolynomial, z_re: f32, z_im: f32, pixel: &mut [u8]) {
    let (z, count) = newtons_method(fz, Complex32::new(z_re, z_im));

    // Turn the complex value to a hue
    let h = z.arg().to_degrees();
    let v = count / 20.;
    let v = 1. - v.sqrt(); // lower counts yield brighter colors

    // Transform the HSV to RGBA
    let rgba = hsv_to_rgba(h, 1., v);
    pixel.copy_from_slice(&rgba[..]);
}

// Calls Newton's method: z := z - f(z) / f'(z)
pub fn newtons_method<T>(fz: &Polynomial<T>, mut z: Complex32) -> (Complex32, f32)
where
    T: TPolynomial,
{
    const LOG_EPSILON: f32 = -5.; // "zero" value, 1e-5
    let mut count = 0.;
    let mut prev_log_norm = LOG_EPSILON;
    while count < 20. {
        let f0 = fz.f0(z);
        let log_norm = f0.norm_sqr().log10();
        if log_norm <= LOG_EPSILON {
            count += ilerp(LOG_EPSILON, prev_log_norm, log_norm);
            break;
        }
        z -= f0 / fz.f1(z);
        count += 1.;
        prev_log_norm = log_norm;
    }

    (z, count)
}

/// Transforms a hue, saturation and value color to RGBA
/// https://www.rapidtables.com/convert/color/hsv-to-rgb.html
fn hsv_to_rgba(h: f32, s: f32, v: f32) -> [u8; 4] {
    let h = (h + 360.) % 360.;

    let c = v * s;
    let x = c * (1. - ((h / 60.) % 2. - 1.).abs());
    let m = v - c;

    let (r, g, b) = match h as i32 {
        0..=59 => (c, x, 0.),
        60..=119 => (x, c, 0.),
        120..=179 => (0., c, x),
        180..=239 => (0., x, c),
        240..=299 => (x, 0., c),
        _ => (c, 0., x),
    };

    let r = (r + m) * 255.;
    let g = (g + m) * 255.;
    let b = (b + m) * 255.;
    [r as u8, g as u8, b as u8, 255]
}

trait Lerp {
    fn lerp(self, a: Self, b: Self) -> Self;
}

impl Lerp for f32 {
    fn lerp(self, a: Self, b: Self) -> Self {
        (1.0 - self) * a + self * b
    }
}

// Perform an inverse-linear-interpolation. Transforms an A to B range into 0 to 1.
fn ilerp(v: f32, a: f32, b: f32) -> f32 {
    ((v - a) / (b - a)).clamp(0., 1.)
}
