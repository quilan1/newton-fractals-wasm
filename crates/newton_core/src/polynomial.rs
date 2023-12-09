use anyhow::{bail, Result};
use num_complex::{Complex32, ComplexFloat};

use crate::polynomial_term::PolynomialTerm;

///////////////////////////////////////////////////////////////////

pub trait TPolynomial:
    Copy
    + Into<Complex32>
    + From<f32>
    + PartialEq
    + Default
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
#[derive(Clone, Debug, Default)]
pub struct Polynomial<T> {
    function: Vec<PolynomialTerm<T>>,
    derivative: Vec<PolynomialTerm<T>>,
    derivative2: Vec<PolynomialTerm<T>>,
    derivative3: Vec<PolynomialTerm<T>>,
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

    // Evaluates the second derivative at z
    pub fn f2(&self, z: Complex32) -> Complex32 {
        Self::eval_terms(&self.derivative2, z)
    }

    // Evaluates the third derivative at z
    pub fn f3(&self, z: Complex32) -> Complex32 {
        Self::eval_terms(&self.derivative3, z)
    }

    /// Sums C*z^p polynomial terms
    fn eval_terms(terms: &[PolynomialTerm<T>], z: Complex32) -> Complex32 {
        terms
            .iter()
            .map(|cp| cp.coefficient * z.powi(cp.power))
            .sum::<Complex32>()
    }

    pub fn terms(&self) -> Vec<PolynomialTerm<T>> {
        let mut terms = self.function.clone();
        terms.sort_by_key(|t| t.power);
        terms
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

    fn add_term(&mut self, cp: PolynomialTerm<T>) {
        if let Some(cp) = cp.derivative() {
            if let Some(cp) = cp.derivative() {
                if let Some(cp) = cp.derivative() {
                    self.derivative3.push(cp);
                }
                self.derivative2.push(cp);
            }
            self.derivative.push(cp);
        }
        self.function.push(cp);
    }

    // Turns poly from a*z^n + b*z^[n-k] + ... into z^n + (b/a)*z^[n-k] + ...
    pub fn normalize(&mut self) {
        let coef = self
            .function
            .iter()
            .max_by_key(|t| t.power)
            .unwrap()
            .coefficient;

        self.function.iter_mut().for_each(|t| t.coefficient /= coef);
        self.derivative
            .iter_mut()
            .for_each(|t| t.coefficient /= coef);
        self.derivative2
            .iter_mut()
            .for_each(|t| t.coefficient /= coef);
        self.derivative3
            .iter_mut()
            .for_each(|t| t.coefficient /= coef);
    }

    pub fn is_constant(&self) -> bool {
        self.derivative.is_empty()
    }
}

///////////////////////////////////////////////////////////////////

impl<T: TPolynomial + Parseable> Polynomial<T> {
    /// Parses out a polynomial from a string
    pub fn parse(function_str: &str) -> Result<Self> {
        let mut new_self = Self::default();

        let function_str = function_str.replace([' ', '(', ')', '*'], "");
        let mut function_str = function_str.replace("+-", "-");
        if function_str.starts_with('-') {
            function_str = format!("0{function_str}");
        };
        let (plus, minus): (Vec<_>, Vec<_>) = function_str
            .split('+')
            .collect::<Vec<_>>()
            .into_iter()
            .map(|terms| {
                terms
                    .split('-')
                    .filter(|t| !t.is_empty())
                    .collect::<Vec<_>>()
            })
            .filter(|terms| !terms.is_empty())
            .map(|terms| {
                let (plus, minus) = terms.split_at(1);
                (plus.to_vec(), minus.to_vec())
            })
            .unzip();

        let plus = plus.into_iter().flatten().collect::<Vec<_>>();
        let minus = minus.into_iter().flatten().collect::<Vec<_>>();
        // println!("Plus: {plus:?}, Minus: {minus:?}");

        plus.into_iter()
            .filter_map(|term| PolynomialTerm::parse(term, 1.).ok())
            .flatten()
            .for_each(|cp| new_self.add_term(cp));

        minus
            .into_iter()
            .filter_map(|term| PolynomialTerm::parse(term, -1.).ok())
            .flatten()
            .for_each(|cp| new_self.add_term(cp));

        if new_self.function.is_empty() {
            bail!("Empty function");
        }

        Ok(new_self)
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
        let mut new_self = Self::default();
        for (c, p) in terms {
            new_self.add_term(PolynomialTerm::new(c, p));
        }
        new_self
    }
}

impl<T: TPolynomial> From<Polynomial<T>> for Vec<(T, i32)> {
    fn from(value: Polynomial<T>) -> Self {
        value.function.iter().map(From::from).collect::<Vec<_>>()
    }
}

///////////////////////////////////////////////////////////////////

impl<T: TPolynomial> From<&Polynomial<T>> for CPolynomial {
    fn from(fz: &Polynomial<T>) -> Self {
        Self {
            function: fz.function.iter().map(PolynomialTerm::from).collect(),
            derivative: fz.derivative.iter().map(PolynomialTerm::from).collect(),
            derivative2: fz.derivative2.iter().map(PolynomialTerm::from).collect(),
            derivative3: fz.derivative3.iter().map(PolynomialTerm::from).collect(),
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
            vec![(1.0, 5), (3.0, 3), (-1.0, 2), (-2.0, 1), (5.0, 0)]
        );
        assert_eq!(
            terms_to_vec(&fz.derivative),
            vec![(5.0, 4), (9.0, 2), (-2.0, 1), (-2.0, 0)]
        );
        assert_eq!(
            terms_to_vec(&fz.derivative2),
            vec![(20.0, 3), (18.0, 1), (-2.0, 0)]
        );
        assert_eq!(terms_to_vec(&fz.derivative3), vec![(60.0, 2), (18.0, 0)]);
        Ok(())
    }

    #[test]
    fn test_leading_coefficient_negative() -> Result<()> {
        let fz = FPolynomial::parse("-3z^10 - 4z^4 + z^2 - 2z - 4")?;
        assert_eq!(
            terms_to_vec(&fz.function),
            vec![(-3., 10), (-4., 4), (1., 2), (-2., 1), (-4., 0)]
        );
        Ok(())
    }

    #[test]
    fn test_zero_coefficients() -> Result<()> {
        let fz = FPolynomial::parse("0*z^5 - 4*z^4 - 9*z^3 + 0*z^2 + 30z - 30")?;
        assert_eq!(
            terms_to_vec(&fz.function),
            vec![(-4., 4), (-9., 3), (30., 1), (-30., 0)]
        );
        Ok(())
    }

    #[test]
    fn test_plus_negative_coefficients() -> Result<()> {
        let fz = FPolynomial::parse("+-z^5 + 4*z^4 + -9*z^3 + -20")?;
        assert_eq!(
            terms_to_vec(&fz.function),
            vec![(-1., 5), (4., 4), (-9., 3), (-20., 0)]
        );
        Ok(())
    }

    #[test]
    fn test_empty_term() -> Result<()> {
        let fz = FPolynomial::parse("2+")?;
        assert_eq!(terms_to_vec(&fz.function), vec![(2., 0)]);
        Ok(())
    }

    #[test]
    fn test_empty() -> Result<()> {
        let fz = FPolynomial::parse("");
        assert!(fz.is_err());
        Ok(())
    }

    fn terms_to_vec(terms: &[PolynomialTerm<f32>]) -> Vec<(f32, i32)> {
        let mut terms = terms.iter().map(Into::into).collect::<Vec<_>>();
        terms.sort_by_key(|&(_, p)| -p);
        terms
    }
}
