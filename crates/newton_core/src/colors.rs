use num_complex::Complex32;

use crate::pixel_data::PixelDataDetail;

pub fn write_pixel<P: Into<PixelDataDetail>>(pixel: &mut [u8], pixel_data: P, roots: &[Complex32]) {
    let PixelDataDetail { root_index, frac } = pixel_data.into();

    // Turn the complex value to a hue
    let z = roots[root_index];
    let h = z.arg().to_degrees();
    let v = 1. - frac.sqrt(); // lower counts yield brighter colors

    // Transform the HSV to RGBA
    let rgba = hsv_to_rgba(h, 1., v);
    pixel.copy_from_slice(&rgba[..]);
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
