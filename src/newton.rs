use num::complex::Complex64 as Complex;

use crate::raster::{Image, Color};
use crate::config::Config;
use crate::roots::Roots;
use crate::func::Func;

pub fn newton<T>(config: &Config, f: &Func, image: &mut Image)
    where T : Householder
{
    let mut roots = Roots::new();

    let z_min = Complex::new(config.window.re0, config.window.im0);
    let z_max = Complex::new(config.window.re1, config.window.im1);

    let mut brightness = Vec::<(f64,u8)>::with_capacity(config.width * config.height);
    // let mut max_brightness = Vec::<f64>::with_capacity(config.width * config.height);
    let mut max_brightness = 0.;

    let range_real = z_max.re - z_min.re;
    let range_imag = z_max.im - z_min.im;
    for y in 0..config.height {
        for x in 0..config.width {
            let real = x as f64 / config.width as f64 * range_real + z_min.re;
            let imag = y as f64 / config.height as f64 * range_imag + z_min.im;

            let z = Complex::new(real, imag);
            let (z, fz, iloop) = newton_iter::<T>(config, f, z);
            let color = if iloop < config.loopmax {
                roots.find_root(config, &z).color
            } else {
                Color { r: 0, g: 0, b: 0, a: 0 }
            };

            // Calculate the shading
            let s = fz.norm() / config.zero;    // How far are we from the zero, when we bailed the loop
            let s = -f64::log(s, 10.);          // Let's shade it logarithmically
            brightness.push((s, iloop as u8));
            // max_brightness.push(s);
            max_brightness = f64::max(max_brightness, s);

            let color = if config.show_loops {
                Color { r: 255, g: 255, b: 255, a: 255 }
            } else {
                color
            };
            let index = y * config.width + x;
            image.set_pixel(index, color);
        }
    }

    // max_brightness.sort_by(|a,b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    // let max_brightness = max_brightness[max_brightness.len() * 99 / 100];

    // Perform a quick second pass to shade the values according to how many iterations it took
    for y in 0..config.height {
        for x in 0..config.width {
            let index = y * config.width + x;
            let color = image.get_pixel(index);

            let (s, iloop) = brightness[index];
            let s = f64::min(s / max_brightness, 1.);

            let s = if config.show_loops {
                s
            } else {
                let s = (iloop as f64 + 1. - s) / config.loopmax as f64;
                f64::exp(-f64::powf(s * config.shading_stddev, 2.))
            };

            let color = Color {
                r: (color.r as f64 * s) as u8,
                g: (color.g as f64 * s) as u8,
                b: (color.b as f64 * s) as u8,
                a: 0
            };

            image.set_pixel(index, color);
        }
    }
}

// #[inline(never)]
fn newton_iter<T>(config: &Config, f: &Func, mut z: Complex) -> (Complex, Complex, usize)
    where T : Householder
{
    let mut fz;
    for counter in 0..config.loopmax {
        fz = f.fz(&z);
        if fz.norm() < config.zero { return (z, fz, counter); }
        z += T::iter(f, &fz, &z);
    }

    fz = f.fz(&z);
    (z, fz, config.loopmax)
}

pub trait Householder {
    fn iter(f: &Func, fz: &Complex, z: &Complex) -> Complex;
}

pub struct Newton();
pub struct Halley();
pub struct Householder3();

impl Householder for Newton {
    fn iter(f: &Func, fz: &Complex, z: &Complex) -> Complex {
        let dfz = f.dfz(z);
        -fz / dfz
    }
}

impl Householder for Halley {
    fn iter(f: &Func, fz: &Complex, z: &Complex) -> Complex {
        let dfz = f.dfz(z);
        let df2z = f.df2z(z);
        -2. * fz * dfz / (2. * dfz * dfz - fz * df2z)
    }
}

impl Householder for Householder3 {
    fn iter(f: &Func, fz: &Complex, z: &Complex) -> Complex {
        let dfz = f.dfz(z);
        let df2z = f.df2z(z);
        let df3z = f.df3z(z);
        let r1 = fz / dfz;
        let r2 = dfz / df2z;
        let r3 = df2z / df3z;

        (r1 - 2. * r2) / (r1 / (3. * r3) + 2. * r2 / r1 - 2.)
    }
}