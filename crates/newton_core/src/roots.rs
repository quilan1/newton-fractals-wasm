#![allow(unused_variables, dead_code)]

use num_complex::{Complex32, ComplexFloat};
use rand::Rng;

use crate::{
    polynomial::{Polynomial, TPolynomial},
    CPolynomial,
};

///////////////////////////////////////////////////////////////////

const PIXEL_DIST: f32 = 3. / 800.;

pub fn roots_of<T: TPolynomial>(fz: &Polynomial<T>) -> Vec<Complex32> {
    let mut roots = Vec::new();
    let mut fz: CPolynomial = fz.into();
    fz.normalize();

    for attempt in 0..10 {
        roots = match durand_kerner_roots(&fz) {
            Some(r) => r,
            None => continue,
        }
    }

    let mut roots = merge_nearby_roots(roots, 10);
    roots.sort_by_cached_key(|z| (1000.0 * z.arg().abs()) as i32);
    roots
}

// Because using 1.0 can occasionally diverge, I've taken an approach like neural networks,
// of applying a factor that moves it in the right direction, but tries not to overshoot
const WDK_DAMPING_FACTOR: f32 = 0.1;

fn durand_kerner_roots(fz: &CPolynomial) -> Option<Vec<Complex32>> {
    let num_roots = fz.order();
    let mut roots = random_roots(num_roots);
    for iteration in 0..1000 {
        let prev = roots.clone();
        roots = (0..num_roots)
            .map(|i| {
                let w = wdk_correction_term(fz, &prev, num_roots, i);
                prev[i] - WDK_DAMPING_FACTOR * w
            })
            .collect();

        if roots.iter().any(|z| z.is_nan()) {
            return None;
        }
    }

    Some(roots)
}

fn wdk_correction_term(
    fz: &CPolynomial,
    roots: &[Complex32],
    num_roots: usize,
    i: usize,
) -> Complex32 {
    let numerator = fz.f0(roots[i]);
    let denominator = match (0..num_roots)
        .filter(|&j| i != j)
        .map(|j| roots[i] - roots[j])
        .reduce(|res, b| res * b)
    {
        Some(z) => z,
        None => {
            log::info!("Couldn't reduce? r={roots:?}, i={i}");
            Complex32::new(1., 0.)
        }
    };
    numerator / denominator
}

fn random_roots(num_roots: usize) -> Vec<Complex32> {
    let mut rng = rand::thread_rng();
    let z = Complex32::from_polar(1., rng.gen::<f32>() * 360.);
    (0..num_roots).map(|p| z.powi(p as i32)).collect()
}

fn merge_nearby_roots(roots: Vec<Complex32>, within_n_pixels: usize) -> Vec<Complex32> {
    let pixel_threshold = within_n_pixels as f32 * PIXEL_DIST;

    // Merge roots that are within a certain distance of one-another
    // TODO: Use Disjoint-Union Merge operation here instead
    let mut new_roots: Vec<Complex32> = Vec::new();
    for root in roots {
        if new_roots
            .iter()
            .all(|&z| (root - z).norm() > pixel_threshold)
        {
            new_roots.push(root);
        }
    }

    new_roots
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
