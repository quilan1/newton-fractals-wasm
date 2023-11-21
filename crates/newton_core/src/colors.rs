use palette::{IntoColor, Oklch, Srgba};

use crate::{pixel_data::PixelDataDetail, OklchColor};

pub fn pixel_color<P: Into<PixelDataDetail>>(pixel_data: P, roots: &[OklchColor]) -> [u8; 4] {
    let PixelDataDetail { root_index, frac } = pixel_data.into();
    let v = 1. - frac.sqrt(); // lower counts yield brighter colors
                              // let v = 1. - frac;

    let OklchColor { h, c } = roots[root_index];
    let rgba: Srgba = Oklch::new(v, c, h).into_color();
    rgba.into_format().into()
}
