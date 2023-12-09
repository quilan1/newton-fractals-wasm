use anyhow::{anyhow, Result};
use num_complex::Complex32;

use crate::polynomial::{Parseable, TPolynomial};

///////////////////////////////////////////////////////////////////

/// A single polynomial term of C*z^p
#[derive(Clone, Debug)]
pub struct PolynomialTerm<T> {
    pub coefficient: T,
    pub power: i32,
}

///////////////////////////////////////////////////////////////////

impl<T: TPolynomial> PolynomialTerm<T> {
    pub fn new(coefficient: T, power: i32) -> Self {
        Self { coefficient, power }
    }

    pub fn derivative(&self) -> Option<Self> {
        match self.power {
            0 => None,
            _ => Some(Self {
                coefficient: self.coefficient * self.power as f32,
                power: self.power - 1,
            }),
        }
    }

    pub fn derivative2(&self) -> Option<Self> {
        match self.power {
            0..=1 => None,
            _ => Some(Self {
                coefficient: self.coefficient * (self.power - 1) as f32 * self.power as f32,
                power: self.power - 2,
            }),
        }
    }

    pub fn derivative3(&self) -> Option<Self> {
        match self.power {
            0..=2 => None,
            _ => Some(Self {
                coefficient: self.coefficient
                    * (self.power - 2) as f32
                    * (self.power - 1) as f32
                    * self.power as f32,
                power: self.power - 3,
            }),
        }
    }
}

///////////////////////////////////////////////////////////////////

impl<T: TPolynomial + Parseable> PolynomialTerm<T> {
    pub fn parse(function_str: &str, sign: f32) -> Result<Option<Self>> {
        let (coefficient, power) =
            try_zed_parse(function_str).or_else(|_| try_digit_only_parse(function_str))?;
        let coefficient = sign * coefficient;
        Ok(if coefficient == 0. {
            None
        } else {
            Some(Self {
                coefficient: coefficient.into(),
                power,
            })
        })
    }
}

fn try_zed_parse(function_str: &str) -> Result<(f32, i32)> {
    let (coef, power) = function_str
        .split_once('z')
        .ok_or_else(|| anyhow!("No z found in function"))?;

    let coefficient = (!coef.is_empty())
        .then(|| coef.parse::<f32>())
        .unwrap_or(Ok(1.))?;

    let power = (!power.is_empty())
        .then(|| power.strip_prefix('^'))
        .flatten()
        .map(str::parse::<i32>)
        .unwrap_or(Ok(1))?;

    Ok((coefficient, power))
}

fn try_digit_only_parse(number: &str) -> Result<(f32, i32)> {
    Ok((number.parse::<f32>()?, 0))
}

///////////////////////////////////////////////////////////////////

impl<T: TPolynomial> From<PolynomialTerm<T>> for (T, i32) {
    fn from(polynomial_term: PolynomialTerm<T>) -> Self {
        (polynomial_term.coefficient, polynomial_term.power)
    }
}

impl<T: TPolynomial> From<&PolynomialTerm<T>> for (T, i32) {
    fn from(polynomial_term: &PolynomialTerm<T>) -> Self {
        (polynomial_term.coefficient, polynomial_term.power)
    }
}

impl<T: TPolynomial> From<&PolynomialTerm<T>> for PolynomialTerm<Complex32> {
    fn from(polynomial_term: &PolynomialTerm<T>) -> Self {
        Self {
            coefficient: polynomial_term.coefficient.into(),
            power: polynomial_term.power,
        }
    }
}

///////////////////////////////////////////////////////////////////

#[cfg(test)]
mod tests {
    #![allow(illegal_floating_point_literal_pattern)]
    use super::*;

    #[test]
    fn test_normal() {
        assert!(matches!(try_zed_parse("2z^3"), Ok((2., 3))));
    }
}
