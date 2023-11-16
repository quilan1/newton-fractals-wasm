use crate::raster::Image;
use crate::config::Config;
use crate::newton::newton;
use crate::func::Func;

pub fn generate_saved(polynomial: &str, config: &Config, method: i32) -> Image {
    use std::str::FromStr;

    let f = Func::from_str(polynomial).unwrap();
    // let f = Func::from_cp(vec![1, -3, 1, -1], vec![13, 6, 1, 0]);
    // let f = Func::from_cp(vec![1, 3, 1, 3], vec![5, 3, 1, 0]);
    // let f = Func::from_cp(vec![-2, -2, 4, 4, -4, -3, -2], vec![11, 7, 6, 5, 4, 1, 0]);
    // let f = Func::from_cp(vec![-2, 3, 1, 1, 4, 5, 4], vec![10, 8, 6, 4, 2, 1, 0]);
    let mut image = Image::blank(config.width as i32, config.height as i32);

    match method {
        0 => newton::<crate::newton::Newton>(config, &f, &mut image),
        1 => newton::<crate::newton::Halley>(config, &f, &mut image),
        2 => newton::<crate::newton::Householder3>(config, &f, &mut image),
        _ => ()
    }

    image
}

pub fn generate_random<T>(config: &Config) -> (Image, Func)
    where T : crate::newton::Householder
{
    use rand::distributions::{Distribution, Uniform};

    let mut rng = rand::thread_rng();

    let num_coef = Uniform::from(2..=5).sample(&mut rng);
    let coef_uni = Uniform::from(-1..=1);
    let pow_uni = Uniform::from(0..=10);

    let mut coef = Vec::<i32>::new();
    let mut pow = Vec::<i32>::new();

    macro_rules! add_cp {
        ($coef_uni: expr, $pow_uni: expr) => {
            loop {
                let c = $coef_uni.sample(&mut rng);
                if c == 0 { continue; }
                coef.push(c);
                break;
            }
            pow.push($pow_uni.sample(&mut rng));
        };
    }

    for _ in 0..num_coef {
        add_cp!(coef_uni, pow_uni);
    }

    add_cp!(Uniform::from(-1..=1), Uniform::from(1..=1));
    add_cp!(Uniform::from(-1..=1), Uniform::from(0..=0));

    let f = Func::from_cp(coef, pow);
    log!("Calculating f = {}", f.to_string());
    let mut image = Image::blank(config.width as i32, config.height as i32);

    newton::<T>(config, &f, &mut image);
    (image, f)
}
