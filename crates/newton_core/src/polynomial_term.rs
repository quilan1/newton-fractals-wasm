use anyhow::{bail, Result};
use regex::Regex;

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
}

///////////////////////////////////////////////////////////////////

impl<T: TPolynomial + Parseable> PolynomialTerm<T> {
    pub fn parse(function_str: &str, sign: f32) -> Result<Option<Self>> {
        let (coefficient, power) =
            try_zed_parse(function_str).or(try_digit_only_parse(function_str))?;
        let coefficient = sign * coefficient;
        Ok(if power == 0 && coefficient == 0. {
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
    let re = Regex::new(r"^(?<coef>\d+)?z(\^(?<power>\d+))?$").unwrap();
    let Some(captures) = re.captures(function_str) else {
        bail!("Invalid polynomial term: {function_str}");
    };
    let coefficient = captures
        .name("coef")
        .map(|c| c.as_str().parse::<f32>())
        .unwrap_or(Ok(1.))?;
    let power = captures
        .name("power")
        .map(|c| c.as_str().parse::<i32>())
        .unwrap_or(Ok(1))?;

    Ok((coefficient, power))
}

fn try_digit_only_parse(function_str: &str) -> Result<(f32, i32)> {
    let re = Regex::new(r"^(\d+)$").unwrap();
    let Some(captures) = re.captures(function_str) else {
        bail!("Invalid polynomial term: {function_str}");
    };
    let coefficient = captures
        .get(0)
        .map(|c| c.as_str().parse::<f32>())
        .unwrap()?;

    Ok((coefficient, 0))
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
