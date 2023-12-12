use palette::{IntoColor, Oklch, Srgba};

use crate::{pixel_data::PixelDataDetail, Lerp, OklchColor};

///////////////////////////////////////////////////////////////////

pub enum LightnessMode {
    Normal,
    Inverted,
    Parabola,
    InvertedParabola,
}

impl From<u32> for LightnessMode {
    fn from(value: u32) -> Self {
        use LightnessMode as LM;
        match value {
            0 => LM::Normal,
            1 => LM::Inverted,
            2 => LM::Parabola,
            3 => LM::InvertedParabola,
            _ => panic!("Invalid lighness mode"),
        }
    }
}

///////////////////////////////////////////////////////////////////

pub fn pixel_color<P: Into<PixelDataDetail>>(
    pixel_data: P,
    roots: &[OklchColor],
    luminance_max: f32,
    dropoff: f32,
    lightness_mode: LightnessMode,
) -> [u8; 4] {
    use LightnessMode as LM;

    let PixelDataDetail { root_index, frac } = pixel_data.into();
    if frac == 1.0 {
        return match lightness_mode {
            LM::Normal | LM::Parabola => [0, 0, 0, 255],
            LM::Inverted | LM::InvertedParabola => [255, 255, 255, 255],
        };
    }

    let v = frac;
    let v = 1. - brightness_transform(v, dropoff);
    let v = v.ilerp_clamped(0., luminance_max);
    let v = match lightness_mode {
        LM::Normal => v,
        LM::Inverted => 1. - v,
        LM::Parabola => 4. * (v - 0.5) * (v - 0.5),
        LM::InvertedParabola => 1. - 4. * (v - 0.5) * (v - 0.5),
    };

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
