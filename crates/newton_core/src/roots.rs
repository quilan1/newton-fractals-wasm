#![allow(unused_variables, dead_code)]

use num_complex::{Complex32, ComplexFloat};
use rand::Rng;

use crate::{
    polynomial::{CPolynomial, Polynomial, TPolynomial},
    Lerp, DISTANCE_PER_PIXEL, SEPARATE_ROOTS_PIXEL_DISTANCE,
};

///////////////////////////////////////////////////////////////////

pub struct OkLchColor {
    pub h: f32,
    pub c: f32,
}

pub struct Roots {
    pub roots: Vec<Complex32>,
    pub colors: Vec<OkLchColor>,
}

///////////////////////////////////////////////////////////////////

impl Roots {
    pub fn new<T: TPolynomial>(fz: &Polynomial<T>) -> Option<Self> {
        let roots = roots_of(fz);
        if roots.is_empty() {
            return None;
        }

        let colors = roots
            .iter()
            .map(|z| {
                let h = z.arg().to_degrees();
                let c = (z.norm() / 1.5).lerp_clamped(0.01, 0.3);
                OkLchColor { h, c }
            })
            .collect();

        Some(Self { roots, colors })
    }
}

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

    let mut roots = merge_nearby_roots(roots);
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
    let denominator = (0..num_roots)
        .filter(|&j| i != j)
        .map(|j| roots[i] - roots[j])
        .reduce(|res, b| res * b)
        .unwrap_or(Complex32::new(1., 0.));
    numerator / denominator
}

fn random_roots(num_roots: usize) -> Vec<Complex32> {
    let mut rng = rand::thread_rng();
    let z = Complex32::from_polar(1., rng.gen::<f32>() * 360.);
    (0..num_roots).map(|p| z.powi(p as i32)).collect()
}

fn merge_nearby_roots(roots: Vec<Complex32>) -> Vec<Complex32> {
    let pixel_threshold = SEPARATE_ROOTS_PIXEL_DISTANCE * DISTANCE_PER_PIXEL;

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
