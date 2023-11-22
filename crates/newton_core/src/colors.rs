use palette::{IntoColor, Oklch, Srgba};

use crate::{pixel_data::PixelDataDetail, Lerp, OklchColor};

pub fn pixel_color<P: Into<PixelDataDetail>>(
    pixel_data: P,
    roots: &[OklchColor],
    luminance_max: f32,
    dropoff: f32,
) -> [u8; 4] {
    let PixelDataDetail { root_index, frac } = pixel_data.into();
    let v = 1. - brightness_transform(frac, dropoff);
    let v = v.ilerp_clamped(0., luminance_max);

    let OklchColor { h, c } = roots[root_index];
    let rgba: Srgba = Oklch::new(v, c, h).into_color();
    rgba.into_format().into()
}

/// Lower input values yield brighter colors
pub fn brightness_transform(v: f32, dropoff: f32) -> f32 {
    v.powf(dropoff)
}

pub fn calc_luminance_max(dropoff: f32) -> f32 {
    (2.5 * dropoff.powf(0.333)).ln()
}
