// A macro to provide `println!(..)`-style syntax for `console.log` logging.
macro_rules! log {
    ( $( $t:tt )* ) => {
        println!( $( $t )* );
    }
}

mod roots;
mod func;
mod newton;
mod generate;
mod raster;
mod config;

fn main() {
    use config::Config;

    let config = Config::new(1000, 1000, 200, 2., false);
    type Method = newton::Newton;

    if false {
        crate::generate::generate_saved("1, -3, 1, -1 | 13, 6, 1, 0", &config, 0);
    }

    let mut counter = 0;
    loop {
        counter += 1;
        let (image, func) = crate::generate::generate_random::<Method>(&config);
        let fname = format!("images/{:05} {}.jpg", counter, func.to_string());
        _raster::save(&image.into(), fname.as_str()).unwrap();
    }
}