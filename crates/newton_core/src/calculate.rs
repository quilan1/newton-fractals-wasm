use num_complex::Complex32;

use crate::{
    colors::write_pixel,
    pixel_data::PixelData16,
    polynomial::{Polynomial, TPolynomial},
    COMPLEX_WINDOW, LOG_EPSILON, MAX_NEWTON_COUNT,
};

type PixelData = PixelData16;

pub fn calculate_row<T: TPolynomial>(
    fz: &Polynomial<T>,
    row: u32,
    width: u32,
    height: u32,
    pixel_data: &mut [u8],
) {
    let z_im = (row as f32 / height as f32).lerp(-COMPLEX_WINDOW, COMPLEX_WINDOW);
    let delta_re = 2.0 * COMPLEX_WINDOW / width as f32;
    let mut z_re = -COMPLEX_WINDOW;

    pixel_data.chunks_mut(4).for_each(|pixel| {
        calculate_pixel(fz, z_re, z_im, pixel);
        z_re += delta_re;
    });
}

fn calculate_pixel<T: TPolynomial>(fz: &Polynomial<T>, z_re: f32, z_im: f32, pixel: &mut [u8]) {
    let (z, frac) = newtons_method(fz, Complex32::new(z_re, z_im));
    let root_index = nearest_root(z, &fz.roots);
    let pixel_data: PixelData = (root_index, frac).into();
    write_pixel(pixel, pixel_data, &fz.roots);
}

fn nearest_root(z: Complex32, roots: &[Complex32]) -> usize {
    let dist = |i: usize| (z - roots[i]).norm_sqr();
    (0..roots.len())
        .min_by_key(|&i| (100000. * dist(i)) as u32)
        .unwrap()
}

// Calls Newton's method: z := z - f(z) / f'(z)
pub fn newtons_method<T: TPolynomial>(fz: &Polynomial<T>, mut z: Complex32) -> (Complex32, f32) {
    let mut count = 0.;
    let mut prev_log_norm = LOG_EPSILON;
    while count < MAX_NEWTON_COUNT {
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

    (z, count / MAX_NEWTON_COUNT)
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
