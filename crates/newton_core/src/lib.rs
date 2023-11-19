mod calculate;
mod colors;
mod pixel_data;
mod polynomial;
mod polynomial_term;
mod roots;

use polynomial::CPolynomial;

pub use calculate::calculate_row;
pub use polynomial::FPolynomial as Polynomial;

pub const CANVAS_SIZE: u32 = 800;

// All calculations are done within the window:
// (-COMPLEX_WINDOW - i * COMPLEX_WINDOW) to (COMPLEX_WINDOW + i * COMPLEX_WINDOW)
pub const COMPLEX_WINDOW: f32 = 1.5;

// Minimum value to have reached zero
const LOG_EPSILON: f32 = -5.; // "zero" value, 1e-5

// Maximum number of iterations
pub const MAX_NEWTON_COUNT: f32 = 20.;
