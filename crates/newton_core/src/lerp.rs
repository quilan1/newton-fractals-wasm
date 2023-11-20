use num_complex::Complex32;

pub trait Lerp {
    fn lerp(self, a: Self, b: Self) -> Self;
    fn lerp_clamped(self, a: Self, b: Self) -> Self;
}

impl Lerp for f32 {
    fn lerp(self, a: Self, b: Self) -> Self {
        (1.0 - self) * a + self * b
    }

    fn lerp_clamped(self, a: Self, b: Self) -> Self {
        self.lerp(a, b).min(b).max(a)
    }
}

impl Lerp for Complex32 {
    fn lerp(self, a: Self, b: Self) -> Self {
        (1.0 - self) * a + self * b
    }

    fn lerp_clamped(self, _a: Self, _b: Self) -> Self {
        unimplemented!();
    }
}

// Perform an inverse-linear-interpolation. Transforms an A to B range into 0 to 1.
pub fn ilerp(v: f32, a: f32, b: f32) -> f32 {
    ((v - a) / (b - a)).clamp(0., 1.)
}
