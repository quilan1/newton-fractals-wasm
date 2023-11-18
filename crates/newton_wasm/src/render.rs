use newton_core::calculate_row;
use wasm_bindgen::prelude::*;

use crate::polynomial;

#[wasm_bindgen]
pub fn render(
    ctx: &web_sys::CanvasRenderingContext2d,
    row: u32,
    render_scale: u32,
    fz: &polynomial::Polynomial,
) -> Result<(), JsValue> {
    let canvas = ctx.canvas().unwrap_throw();
    let (width, height) = (canvas.width(), canvas.height());

    let mut rendered_pixels = vec![0; 4 * (width / render_scale) as usize];
    calculate_row(
        &fz.poly,
        row,
        width / render_scale,
        height,
        &mut rendered_pixels,
    );

    let scaled_pixels = scale_row_by(&rendered_pixels, width, render_scale);
    let data = web_sys::ImageData::new_with_u8_clamped_array(
        wasm_bindgen::Clamped(&scaled_pixels),
        width,
    )?;
    ctx.put_image_data(&data, 0.0, row as f64)?;

    Ok(())
}

fn scale_row_by(rendered_pixels: &[u8], width: u32, render_scale: u32) -> Vec<u8> {
    let num_bytes_block = 4 * width as usize;
    let num_bytes_group = 4 * render_scale as usize;

    let mut scaled_pixels = vec![0; 4 * (width * render_scale) as usize];

    // scaled_pixels
    //     .chunks_mut(num_bytes_block)
    //     .for_each(|scaled_row| {
    //         scaled_row
    //             .chunks_mut(num_bytes_group)
    //             .zip(rendered_pixels.chunks(num_bytes_pixel))
    //             .for_each(|(scaled_pixels, rendered_pixel)| {
    //                 scaled_pixels
    //                     .chunks_mut(num_bytes_pixel)
    //                     .for_each(|scaled_pixel| {
    //                         scaled_pixel.copy_from_slice(rendered_pixel);
    //                     });
    //             });
    //     });

    scale_block(
        &mut scaled_pixels,
        rendered_pixels,
        num_bytes_block,
        num_bytes_group,
    );

    scaled_pixels
}

fn scale_block(
    scaled_pixels: &mut [u8],
    rendered_pixels: &[u8],
    num_bytes_block: usize,
    num_bytes_group: usize,
) {
    scaled_pixels
        .chunks_mut(num_bytes_block)
        .for_each(|scaled_row| {
            scale_row(scaled_row, rendered_pixels, num_bytes_group);
        });
}

fn scale_row(scaled_row: &mut [u8], rendered_pixels: &[u8], num_bytes_group: usize) {
    scaled_row
        .chunks_mut(num_bytes_group)
        .zip(rendered_pixels.chunks(4))
        .for_each(|(scaled_pixels, rendered_pixel)| {
            scale_pixels(scaled_pixels, rendered_pixel);
        });
}

fn scale_pixels(scaled_pixels: &mut [u8], rendered_pixel: &[u8]) {
    scaled_pixels.chunks_mut(4).for_each(|scaled_pixel| {
        scaled_pixel.copy_from_slice(rendered_pixel);
    });
}
