use anyhow::Result;
use num_complex::{Complex32, ComplexFloat};
use regex::Regex;

use crate::polynomial_term::PolynomialTerm;

///////////////////////////////////////////////////

pub trait TPolynomial:
    Copy
    + Into<Complex32>
    + From<f32>
    + PartialEq
    + std::ops::Mul<Complex32, Output = Complex32>
    + std::ops::Mul<f32, Output = Self>
    + std::ops::DivAssign
    + std::fmt::Debug
{
}

impl TPolynomial for f32 {}
impl TPolynomial for Complex32 {}

pub trait Parseable: From<f32> {}
impl Parseable for f32 {}

///////////////////////////////////////////////////////////////////

/// Polynomial terms and their derivatives
#[derive(Clone, Debug)]
pub struct Polynomial<T> {
    function: Vec<PolynomialTerm<T>>,
    derivative: Vec<PolynomialTerm<T>>,
}

pub type FPolynomial = Polynomial<f32>;
pub type CPolynomial = Polynomial<Complex32>;

///////////////////////////////////////////////////////////////////

impl<T: TPolynomial> Polynomial<T> {
    /// Evaluates the function at z
    pub fn f0(&self, z: Complex32) -> Complex32 {
        Self::eval_terms(&self.function, z)
    }

    // Evaluates the derivative at z
    pub fn f1(&self, z: Complex32) -> Complex32 {
        Self::eval_terms(&self.derivative, z)
    }

    /// Sums C*z^p polynomial terms
    fn eval_terms(terms: &[PolynomialTerm<T>], z: Complex32) -> Complex32 {
        terms
            .iter()
            .map(|cp| cp.coefficient * z.powi(cp.power))
            .sum::<Complex32>()
    }

    pub fn coefficients(&self) -> Vec<T> {
        let highest_power = self.function.iter().map(|t| t.power).max().unwrap();
        let mut coefs = vec![0f32.into(); highest_power as usize + 1];

        for &PolynomialTerm { coefficient, power } in &self.function {
            coefs[power as usize] = coefficient;
        }

        coefs
    }

    pub fn term_of(&self, power: i32) -> Option<&PolynomialTerm<T>> {
        self.function.iter().find(|term| term.power == power)
    }

    pub fn order(&self) -> usize {
        self.function.iter().map(|t| t.power).max().unwrap() as usize
    }

    // Turns poly from a*z^n + b*z^[n-k] + ... into z^n + (b/a)*z^[n-k] + ...
    pub fn normalize(&mut self) {
        let coef = self
            .function
            .iter()
            .max_by_key(|t| t.power)
            .unwrap()
            .coefficient;

        for t in &mut self.function {
            t.coefficient /= coef;
        }

        for t in &mut self.derivative {
            t.coefficient /= coef;
        }
    }
}

///////////////////////////////////////////////////////////////////

impl<T: TPolynomial + Parseable> Polynomial<T> {
    /// Parses out a polynomial from a string
    pub fn parse(function_str: &str) -> Result<Self> {
        let mut function = Vec::new();
        let mut derivative = Vec::new();

        let function_str = function_str.replace(' ', "");
        let function_str = &format!("+{}", function_str);
        let re = Regex::new(r"[+-]\d*\*?(z(\^\d+)?)?").unwrap();
        for coef_power in re.find_iter(function_str) {
            let cp = PolynomialTerm::parse(coef_power.as_str())?;
            if let Some(derivative_cp) = cp.derivative() {
                derivative.push(derivative_cp)
            }
            function.push(cp);
        }

        Ok(Self {
            function,
            derivative,
        })
    }
}

///////////////////////////////////////////////////////////////////

impl<T: TPolynomial> From<Vec<T>> for Polynomial<T> {
    fn from(coefs: Vec<T>) -> Self {
        let mut terms = Vec::new();
        for (i, c) in coefs.into_iter().enumerate() {
            if c == 0f32.into() {
                continue;
            }
            terms.push((c, i as i32));
        }
        terms.into()
    }
}

///////////////////////////////////////////////////////////////////

impl<T: TPolynomial> From<Vec<(T, i32)>> for Polynomial<T> {
    fn from(terms: Vec<(T, i32)>) -> Self {
        let mut function = Vec::new();
        let mut derivative = Vec::new();
        for (c, p) in terms {
            function.push(PolynomialTerm::new(c, p));
            if p > 0 {
                derivative.push(PolynomialTerm::new(c * p as f32, p - 1));
            }
        }

        Self {
            function,
            derivative,
        }
    }
}

///////////////////////////////////////////////////////////////////

impl<T: TPolynomial> From<&Polynomial<T>> for CPolynomial {
    fn from(fz: &Polynomial<T>) -> Self {
        Self {
            function: fz
                .function
                .iter()
                .map(|term| PolynomialTerm::new(term.coefficient.into(), term.power))
                .collect(),
            derivative: fz
                .derivative
                .iter()
                .map(|term| PolynomialTerm::new(term.coefficient.into(), term.power))
                .collect(),
        }
    }
}

///////////////////////////////////////////////////////////////////

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse() -> Result<()> {
        let fz = FPolynomial::parse("z^5-z^2+3z^3-2z+5")?;
        assert_eq!(
            terms_to_vec(&fz.function),
            vec![(1.0, 5), (-1.0, 2), (3.0, 3), (-2.0, 1), (5.0, 0)]
        );
        assert_eq!(
            terms_to_vec(&fz.derivative),
            vec![(5.0, 4), (-2.0, 1), (9.0, 2), (-2.0, 0)]
        );
        Ok(())
    }

    fn terms_to_vec(terms: &[PolynomialTerm<f32>]) -> Vec<(f32, i32)> {
        terms
            .iter()
            .map(|cp| (cp.coefficient, cp.power))
            .collect::<Vec<_>>()
    }
}
