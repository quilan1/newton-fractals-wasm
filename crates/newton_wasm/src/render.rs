use newton_core::{calculate_row, pixel_color, OkLchColor, PixelData, CANVAS_SIZE};
use wasm_bindgen::prelude::*;

use crate::{polynomial::Polynomial, roots::Roots};

#[wasm_bindgen]
pub struct PixelDataRow(Vec<PixelData>);

#[wasm_bindgen]
pub fn calculate(fz: &Polynomial, roots: &Roots, render_scale: usize, row: usize) -> PixelDataRow {
    let pixel_count = CANVAS_SIZE / render_scale;
    let mut pixel_data = vec![PixelData(0); pixel_count];
    calculate_row(&fz.poly, &roots.0.roots, row, &mut pixel_data);
    PixelDataRow(pixel_data)
}

#[wasm_bindgen]
pub fn render(
    ctx: &web_sys::CanvasRenderingContext2d,
    roots: &Roots,
    render_scale: usize,
    row: usize,
    pixel_data_row: &PixelDataRow,
) -> Result<(), JsValue> {
    let num_pixels_chunk = render_scale;
    let num_pixels_row = CANVAS_SIZE;
    let num_pixels_block = num_pixels_row * num_pixels_chunk;

    let mut canvas_block_bytes = vec![0; 4 * num_pixels_block];
    write_block(
        &roots.0.colors,
        &pixel_data_row.0,
        &mut canvas_block_bytes,
        4 * num_pixels_row,
        4 * num_pixels_chunk,
    );

    let image_data = web_sys::ImageData::new_with_u8_clamped_array(
        wasm_bindgen::Clamped(&canvas_block_bytes),
        CANVAS_SIZE as u32,
    )?;
    ctx.put_image_data(&image_data, 0.0, row as f64)?;
    Ok(())
}

fn write_block(
    roots: &[OkLchColor],
    pixel_data: &[PixelData],
    canvas_block_bytes: &mut [u8],
    num_bytes_row: usize,
    num_bytes_chunk: usize,
) {
    canvas_block_bytes
        .chunks_mut(num_bytes_row)
        .for_each(|canvas_row_bytes| {
            write_row(roots, pixel_data, canvas_row_bytes, num_bytes_chunk);
        });
}

fn write_row(
    roots: &[OkLchColor],
    pixel_data: &[PixelData],
    canvas_row_bytes: &mut [u8],
    num_bytes_chunk: usize,
) {
    canvas_row_bytes
        .chunks_mut(num_bytes_chunk)
        .zip(pixel_data)
        .for_each(|(canvas_chunk_bytes, &pixel_data)| {
            let pixel_bytes = pixel_color(pixel_data, roots);
            write_chunk(canvas_chunk_bytes, &pixel_bytes);
        });
}

fn write_chunk(canvas_chunk_bytes: &mut [u8], pixel_bytes: &[u8]) {
    canvas_chunk_bytes
        .chunks_mut(4)
        .for_each(|canvas_pixel_bytes| {
            canvas_pixel_bytes.copy_from_slice(pixel_bytes);
        });
}
