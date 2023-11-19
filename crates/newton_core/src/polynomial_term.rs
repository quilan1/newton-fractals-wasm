use anyhow::Result;
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
    pub fn parse(function_str: &str) -> Result<Self> {
        let coefficient = parse_coefficient(function_str)?.into();
        let power = parse_power(function_str)?;
        Ok(Self { coefficient, power })
    }
}

///////////////////////////////////////////////////////////////////

/// Assumes formula is of the form: +-C | +-Cz | +-Cz^P
fn parse_coefficient(function_str: &str) -> Result<f32> {
    // strip the leading '+'
    let function_str = if let Some(postfix) = function_str.strip_prefix('+') {
        postfix
    } else {
        function_str
    };

    let z_index = function_str.find('z');
    let coef_string = match z_index {
        Some(index) => &function_str[..index],
        None => function_str,
    };

    let coef_string = coef_string.strip_suffix('*').unwrap_or(coef_string);

    Ok(match coef_string {
        "-" => -1.0,
        "" => 1.0,
        _ => coef_string.parse::<f32>()?,
    })
}

/// Assumes formula is of the form: +-C | +-Cz | +-Cz^P
fn parse_power(function_str: &str) -> Result<i32> {
    Ok(if function_str.contains('^') {
        let re = Regex::new(r"\^\d+")?;
        let match_info = re.find(function_str).unwrap();
        let power_str = &function_str[match_info.start() + 1..match_info.end()];
        power_str.parse::<i32>()?
    } else if function_str.contains('z') {
        1
    } else {
        0
    })
}
