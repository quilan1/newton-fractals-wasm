mod calculate;
mod colors;
mod lerp;
mod pixel_data;
mod polynomial;
mod polynomial_term;
mod roots;

///////////////////////////////////////////////////////////////////

pub use calculate::calculate_row;
pub use colors::pixel_color;
pub use lerp::{ilerp, Lerp};
pub use pixel_data::PixelData;
pub use polynomial::FPolynomial as Polynomial;
pub use roots::{OkLchColor, Roots};

///////////////////////////////////////////////////////////////////

pub const CANVAS_SIZE: usize = 800;

// All calculations are done within the window:
// (-COMPLEX_WINDOW - i * COMPLEX_WINDOW) to (COMPLEX_WINDOW + i * COMPLEX_WINDOW)
pub const COMPLEX_WINDOW: f32 = 1.5;

// How far away one pixel is
const DISTANCE_PER_PIXEL: f32 = 2. * COMPLEX_WINDOW / CANVAS_SIZE as f32;

const SEPARATE_ROOTS_PIXEL_DISTANCE: f32 = 10.;

// Minimum value to have reached zero
const LOG_EPSILON: f32 = -5.; // "zero" value, 1e-5

// Maximum number of iterations
pub const MAX_NEWTON_COUNT: f32 = 20.;
