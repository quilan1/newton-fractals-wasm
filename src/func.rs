use num::complex::Complex64 as Complex;
use std::str::FromStr;

pub struct Func {
    coef: Vec<i32>,
    pow: Vec<i32>,
}

impl Func {
    pub fn from_cp(coef: Vec<i32>, pow: Vec<i32>) -> Self {
        let (coef, pow) = Func::consolidate_terms(coef, pow);
        Self { coef, pow }
    }

    fn consolidate_terms(coef: Vec<i32>, pow: Vec<i32>) -> (Vec<i32>, Vec<i32>) {
        use std::collections::hash_map::HashMap;

        let mut terms = HashMap::<i32, i32>::new();
        for (&c, &p) in coef.iter().zip(&pow) {
            *terms.entry(p).or_default() += c;
        }

        let mut coef = Vec::<i32>::new();
        let mut pow = Vec::<i32>::new();
        for (&p, &c) in &terms {
            if c == 0 {
                continue;
            }
            coef.push(c);
            pow.push(p);
        }

        (coef, pow)
    }

    pub fn fz(&self, z: &Complex) -> Complex {
        let mut result = Complex::new(0., 0.);
        for (&c, &p) in self.coef.iter().zip(&self.pow) {
            result += (c as f64) * z.powf(p as f64);
        }
        result
    }

    pub fn dfz(&self, z: &Complex) -> Complex {
        let mut result = Complex::new(0., 0.);
        for (&c, &p) in self.coef.iter().zip(&self.pow) {
            result += (c * p) as f64 * z.powf(p as f64 - 1.);
        }
        result
    }

    pub fn df2z(&self, z: &Complex) -> Complex {
        let mut result = Complex::new(0., 0.);
        for (&c, &p) in self.coef.iter().zip(&self.pow) {
            result += (c * p * (p - 1)) as f64 * z.powf(p as f64 - 2.);
        }
        result
    }

    pub fn df3z(&self, z: &Complex) -> Complex {
        let mut result = Complex::new(0., 0.);
        for (&c, &p) in self.coef.iter().zip(&self.pow) {
            result += (c * p * (p - 1) * (p - 2)) as f64 * z.powf(p as f64 - 3.);
        }
        result
    }
}

impl ToString for Func {
    fn to_string(&self) -> String {
        use std::str;

        fn format_cp(c: i32, p: i32) -> String {
            let pre = if p == 0 {
                format!("{}", c)
            } else if c == 1 {
                String::new()
            } else if c == -1 {
                "-".into()
            } else {
                format!("{}", c)
            };
            let post = if p == 0 {
                String::new()
            } else if p == 1 {
                "z".into()
            } else {
                format!("z^{}", p)
            };
            format!("{}{}", pre, post)
        }

        let mut pairs = self.coef.iter().zip(&self.pow).collect::<Vec<_>>();
        pairs.sort_by(|a, b| b.1.partial_cmp(a.1).unwrap());

        let s = pairs
            .into_iter()
            .map(|(&c, &p)| format_cp(c, p))
            .collect::<Vec<_>>()
            .join("+");
        let s = str::replace(s.as_str(), "+-", "-");
        s
    }
}

impl FromStr for Func {
    type Err = std::num::ParseIntError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let sections: Vec<&str> = s.split(" | ").collect();
        let coef = sections[0]
            .split(", ")
            .map(|v| v.parse::<i32>())
            .filter_map(|v| v.ok())
            .collect::<Vec<_>>();
        let pow = sections[1]
            .split(", ")
            .map(|v| v.parse::<i32>())
            .filter_map(|v| v.ok())
            .collect::<Vec<_>>();
        Ok(Func::from_cp(coef, pow))
    }
}
