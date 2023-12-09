use num_complex::{Complex32, ComplexFloat};
use serde::Deserialize;

use crate::{
    polynomial::{CPolynomial, Polynomial, TPolynomial},
    Lerp, DISTANCE_PER_PIXEL, SEPARATE_ROOTS_PIXEL_DISTANCE,
};

///////////////////////////////////////////////////////////////////

#[derive(Deserialize, Clone)]
pub struct OklchColor {
    pub h: f32,
    pub c: f32,
}

pub struct Roots {
    pub roots: Vec<Complex32>,
    pub colors: Vec<OklchColor>,
}

///////////////////////////////////////////////////////////////////

impl Roots {
    pub fn new<T: TPolynomial>(fz: &Polynomial<T>) -> Option<Self> {
        if fz.is_constant() {
            return None;
        }

        let roots = roots_of(fz);
        if roots.is_empty() {
            return None;
        }

        let colors = roots
            .iter()
            .map(|z| {
                let h = z.arg().to_degrees();
                let c = (z.norm() / 1.5).lerp_clamped(0.01, 0.3);
                OklchColor { h, c }
            })
            .collect();

        Some(Self { roots, colors })
    }
}

pub fn roots_of<T: TPolynomial>(fz: &Polynomial<T>) -> Vec<Complex32> {
    let fz: CPolynomial = fz.into();
    let Some(roots) = ae_roots(&fz) else {
        return Vec::new();
    };

    let mut roots = merge_nearby_roots(roots);
    roots.sort_by_cached_key(|z| (1000.0 * ((z.arg() + 360.) % 360.)) as i32);
    roots
}

// I've switched from the Weierstrass-Durand-Kerner Method over to the Aberth-Ehrlich Method
// This has exhibited much quicker convergence & less of a chance of roots flying off into
// Narnia. Also, I'm a little too scared to implement Jenkins-Traub for now.
//
// https://en.wikipedia.org/wiki/Aberth_method
//
fn ae_roots(fz: &CPolynomial) -> Option<Vec<Complex32>> {
    let num_roots = fz.order();
    let mut roots = ae_initial_roots(fz);

    for _iteration in 0..100 {
        let prev = roots.clone();
        roots = (0..num_roots)
            .map(|i| {
                let w = (0..roots.len())
                    .filter(|&j| i != j)
                    .map(|j| 1. / (roots[i] - roots[j]))
                    .sum::<Complex32>();

                let f0 = fz.f0(prev[i]);
                let f1 = fz.f1(prev[i]);
                let wk = f0 / (f1 - w * f0);
                prev[i] - wk
            })
            .collect();

        let deviations = roots
            .iter()
            .zip(prev.iter())
            .map(|(r, p)| r - p)
            .map(|d| d.abs())
            .collect::<Vec<_>>();

        if deviations.iter().all(|r| *r <= 0.00001) {
            break;
        }

        if roots.iter().any(|z| z.is_nan()) {
            return None;
        }
    }

    Some(roots)
}

fn ae_initial_roots(fz: &CPolynomial) -> Vec<Complex32> {
    let order = fz.order();
    let mut coefs = fz.terms();
    coefs.reverse();

    let r = coefs[coefs.len() - 1].coefficient / coefs[0].coefficient;
    let r = r.abs().powf(1. / order as f32);

    let theta = std::f32::consts::TAU / order as f32;
    let offset = theta / (order as f32 + 1.);
    (0..order)
        .map(|k| Complex32::from_polar(r, k as f32 * theta + offset))
        .collect()
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
