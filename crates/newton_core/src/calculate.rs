use num_complex::Complex32;

use crate::{
    pixel_data::PixelData,
    polynomial::{Polynomial, TPolynomial},
    Lerp, LOG_EPSILON, MAX_NEWTON_COUNT,
};

///////////////////////////////////////////////////////////////////

pub struct NewtonsMethod;
pub struct SchroedersMethod;
pub struct SchroedersMethod2;
pub struct HalleysMethod;
pub struct SteffensensMethod;

pub trait IterRoot {
    fn iter_root<T: TPolynomial>(fz: &Polynomial<T>, f0: Complex32, z: &mut Complex32);
    fn max_count() -> f32 {
        MAX_NEWTON_COUNT
    }
}

///////////////////////////////////////////////////////////////////

pub fn calculate_row<T: TPolynomial, I: IterRoot>(
    fz: &Polynomial<T>,
    roots: &[Complex32],
    mut z: Complex32,
    units_per_pixel: f32,
    pixel_data: &mut [PixelData],
) {
    pixel_data.iter_mut().for_each(|pixel| {
        let (z_final, frac) = newtons_method::<_, I>(fz, z);
        let root_index = nearest_root(z_final, roots);
        *pixel = (root_index, frac).into();
        z.re += units_per_pixel;
    });
}

pub fn newtons_method<T: TPolynomial, I: IterRoot>(
    fz: &Polynomial<T>,
    mut z: Complex32,
) -> (Complex32, f32) {
    let mut count = 0.;
    let mut prev_log_norm = LOG_EPSILON;
    while count < I::max_count() {
        let f0 = fz.f0(z);
        let log_norm = f0.norm_sqr().log10();
        if log_norm <= LOG_EPSILON {
            count += LOG_EPSILON.ilerp_clamped(prev_log_norm, log_norm);
            break;
        }

        I::iter_root(fz, f0, &mut z);

        count += 1.;
        prev_log_norm = log_norm;
    }

    (z, count / I::max_count())
}

///////////////////////////////////////////////////////////////////

fn nearest_root(z: Complex32, roots: &[Complex32]) -> usize {
    let dist = |i: usize| (z - roots[i]).norm_sqr();
    (0..roots.len())
        .min_by_key(|&i| (100000. * dist(i)) as u32)
        .unwrap()
}

///////////////////////////////////////////////////////////////////

// Newton's method: z := z - f(z) / f'(z)
impl IterRoot for NewtonsMethod {
    fn iter_root<T: TPolynomial>(fz: &Polynomial<T>, f0: Complex32, z: &mut Complex32) {
        let f1 = fz.f1(*z);
        *z -= f0 / f1;
    }
}

impl IterRoot for SchroedersMethod {
    fn iter_root<T: TPolynomial>(fz: &Polynomial<T>, f0: Complex32, z: &mut Complex32) {
        let f1 = fz.f1(*z);
        let f2 = fz.f2(*z);
        *z -= f0 * f1 / (f1 * f1 - f0 * f2);
    }
}

impl IterRoot for SchroedersMethod2 {
    fn iter_root<T: TPolynomial>(fz: &Polynomial<T>, f0: Complex32, z: &mut Complex32) {
        let f1 = fz.f1(*z);
        let f2 = fz.f2(*z);
        *z -= f0 / f1;
        *z -= f2 * f0 * f0 / (2. * f1 * f1 * f1);
    }
}

impl IterRoot for HalleysMethod {
    fn iter_root<T: TPolynomial>(fz: &Polynomial<T>, f0: Complex32, z: &mut Complex32) {
        let f1 = fz.f1(*z);
        let f2 = fz.f2(*z);
        *z -= 2. * f0 * f1 / (2. * f1 * f1 - f0 * f2);
    }
}

impl IterRoot for SteffensensMethod {
    fn iter_root<T: TPolynomial>(fz: &Polynomial<T>, f0: Complex32, z: &mut Complex32) {
        let f0h = fz.f0(*z + f0);
        *z -= f0 * f0 / (f0h - f0);
    }
}
