#![allow(unused_variables, dead_code)]

use num_complex::{Complex32, ComplexFloat};
use rand::Rng;

use crate::{
    polynomial::{Polynomial, TPolynomial},
    CPolynomial,
};

///////////////////////////////////////////////////////////////////

pub fn roots_of<T: TPolynomial>(fz: &Polynomial<T>) -> Vec<Complex32> {
    let mut roots = durand_kerner_roots(&fz.into());
    roots.sort_by_cached_key(|z| (100000.0 * z.arg()) as i32);
    roots
}

fn durand_kerner_roots(fz: &CPolynomial) -> Vec<Complex32> {
    let mut rng = rand::thread_rng();

    let num_roots = fz.order();
    let z = Complex32::new(rng.gen::<f32>() * 2.0 - 1.0, rng.gen::<f32>() * 2.0 - 1.0);
    let z = z / z.norm();

    let one = Complex32::new(1., 0.);

    let mut roots = (0..num_roots).map(|p| z.powi(p as i32)).collect::<Vec<_>>();
    // log::info!("Initial guess: {z:?}, powers: {roots:?}");

    for attempt in 0..100 {
        let prev = roots.clone();
        roots = (0..num_roots)
            .map(|i| {
                let numerator = fz.f0(prev[i]);
                let mut denominator = one;
                for j in 0..num_roots {
                    if j == i {
                        continue;
                    }
                    denominator *= prev[i] - prev[j];
                }
                prev[i] - numerator / denominator
            })
            .collect();

        let values = roots
            .iter()
            .cloned()
            .map(|z| fz.f0(z).norm())
            .collect::<Vec<_>>();
        // log::info!("Round {attempt}: {roots:?}");
        // log::info!("Values: {values:?}");

        if values.iter().cloned().all(|z| z < 0.0000001) {
            break;
        }
    }

    roots
}

///////////////////////////////////////////////////////////////////

fn roots_of_old<T: TPolynomial>(fz: &Polynomial<T>) -> Vec<Complex32> {
    let mut roots = Vec::new();

    let mut coef = fz
        .coefficients()
        .into_iter()
        .map(Into::into)
        .collect::<Vec<_>>();

    if coef.len() < 2 {
        return roots;
    }

    strip_leading(&mut coef);
    for _ in 0..coef.len() - 2 {
        let fz: CPolynomial = coef.clone().into();
        let r = find_root(&fz);
        roots.push(r);
        divide_polynomial(&mut coef, r);
    }
    roots.push(coef[0]);

    roots.sort_by_cached_key(|z| (100000.0 * z.arg()) as i32);

    roots
}

fn strip_leading(coef: &mut [Complex32]) {
    let leading_coef = coef[coef.len() - 1];
    for c in coef {
        *c /= leading_coef;
    }
}

fn find_root(fz: &CPolynomial) -> Complex32 {
    let mut rng = rand::thread_rng();

    fn discount_newton(fz: &CPolynomial, mut z: Complex32) -> Option<Complex32> {
        for _ in 0..100 {
            let f0 = fz.f0(z);
            if f0.norm() < 0.0000001 {
                return Some(z);
            }
            z -= f0 / fz.f1(z);
        }
        None
    }

    for _ in 0..100 {
        let mut z = Complex32::new(rng.gen::<f32>() * 2.0 - 1.0, rng.gen::<f32>() * 2.0 - 1.0);
        z = match discount_newton(fz, z) {
            Some(z) => z,
            None => continue,
        };
        return z;
    }

    Complex32::new(0., 0.)
}

fn divide_polynomial(coef: &mut Vec<Complex32>, r: Complex32) {
    for i in (1..coef.len()).rev() {
        let cur_coef = coef[i];
        coef[i - 1] += r * cur_coef;
    }
    coef.remove(0);
}
