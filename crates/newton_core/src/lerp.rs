use num_complex::Complex32;

pub trait Lerp {
    /// Performan a linear interpolation. Transforms 0 to 1 into an A to B range.
    fn lerp(self, a: Self, b: Self) -> Self;
    /// Performan a linear interpolation. Transforms 0 to 1 into an A to B range. Input is hard clamped to 0 to 1.
    fn lerp_clamped(self, a: Self, b: Self) -> Self;
    /// Perform an inverse-linear-interpolation. Transforms an A to B range into 0 to 1.
    fn ilerp_clamped(self, a: Self, b: Self) -> Self;
}

impl Lerp for f32 {
    fn lerp(self, a: Self, b: Self) -> Self {
        (1.0 - self) * a + self * b
    }

    fn lerp_clamped(self, a: Self, b: Self) -> Self {
        self.clamp(0., 1.).lerp(a, b)
    }

    fn ilerp_clamped(self, a: Self, b: Self) -> Self {
        ((self - a) / (b - a)).clamp(0., 1.)
    }
}

impl Lerp for Complex32 {
    fn lerp(self, a: Self, b: Self) -> Self {
        (1.0 - self) * a + self * b
    }

    fn lerp_clamped(self, _a: Self, _b: Self) -> Self {
        unimplemented!();
    }

    fn ilerp_clamped(self, _a: Self, _b: Self) -> Self {
        unimplemented!();
    }
}
