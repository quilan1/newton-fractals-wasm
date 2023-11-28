use num_complex::Complex32;

use crate::{
    pixel_data::PixelData,
    polynomial::{Polynomial, TPolynomial},
    Lerp, LOG_EPSILON, MAX_NEWTON_COUNT,
};

///////////////////////////////////////////////////////////////////

pub fn calculate_row<T: TPolynomial>(
    fz: &Polynomial<T>,
    roots: &[Complex32],
    mut z: Complex32,
    units_per_pixel: f32,
    pixel_data: &mut [PixelData],
) {
    pixel_data.iter_mut().for_each(|pixel| {
        let (z_final, frac) = newtons_method(fz, z);
        let root_index = nearest_root(z_final, roots);
        *pixel = (root_index, frac).into();
        z.re += units_per_pixel;
    });
}

// Calls Newton's method: z := z - f(z) / f'(z)
pub fn newtons_method<T: TPolynomial>(fz: &Polynomial<T>, mut z: Complex32) -> (Complex32, f32) {
    let mut count = 0.;
    let mut prev_log_norm = LOG_EPSILON;
    while count < MAX_NEWTON_COUNT {
        let f0 = fz.f0(z);
        let log_norm = f0.norm_sqr().log10();
        if log_norm <= LOG_EPSILON {
            count += LOG_EPSILON.ilerp_clamped(prev_log_norm, log_norm);
            break;
        }
        z -= f0 / fz.f1(z);
        count += 1.;
        prev_log_norm = log_norm;
    }

    (z, count / MAX_NEWTON_COUNT)
}

///////////////////////////////////////////////////////////////////

fn nearest_root(z: Complex32, roots: &[Complex32]) -> usize {
    let dist = |i: usize| (z - roots[i]).norm_sqr();
    (0..roots.len())
        .min_by_key(|&i| (100000. * dist(i)) as u32)
        .unwrap()
}
