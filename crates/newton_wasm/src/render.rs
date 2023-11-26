use newton_core::{calc_luminance_max, pixel_color, PixelData, CANVAS_SIZE};
use num_complex::Complex32;
use wasm_bindgen::prelude::*;

use crate::{
    pixel_data_buffer::PixelDataBuffer, polynomial::Polynomial, roots::Roots,
    scale_row::write_scaled_block,
};

#[wasm_bindgen(js_name = newImagePixelDataBuffer)]
pub fn new_image_pixel_data_buffer() -> PixelDataBuffer {
    let pixel_data = vec![PixelData(0); CANVAS_SIZE * CANVAS_SIZE];
    PixelDataBuffer::new(pixel_data)
}

#[wasm_bindgen(js_name = calculateRow)]
pub fn calculate_row(
    fz: &Polynomial,
    roots: &Roots,
    zoom: f32,
    center_re: f32,
    center_im: f32,
    render_scale: usize,
    row: usize,
) -> PixelDataBuffer {
    let pixel_count = CANVAS_SIZE / render_scale;
    let mut pixel_data = vec![PixelData(0); pixel_count];
    newton_core::calculate_row(
        &fz.poly,
        &roots.0.roots,
        zoom,
        Complex32::new(center_re, center_im),
        row,
        &mut pixel_data,
    );
    PixelDataBuffer::new(pixel_data)
}

#[wasm_bindgen(js_name = renderRow)]
pub fn render_row(
    ctx: &web_sys::CanvasRenderingContext2d,
    roots: &Roots,
    pdb: &mut PixelDataBuffer,
    row_pdb: &PixelDataBuffer,
    render_scale: usize,
    row: usize,
    dropoff: f32,
) -> Result<(), JsValue> {
    let pdb_row_offset = row * CANVAS_SIZE;
    let pdb_block_len = CANVAS_SIZE * render_scale;
    let pdb_slice = &mut pdb.pixel_data[pdb_row_offset..pdb_row_offset + pdb_block_len];

    let mut canvas_bytes = vec![0; 4 * pdb_block_len];
    let canvas_pixels = unsafe { canvas_bytes.align_to_mut::<[u8; 4]>().1 };

    let luminance_max = calc_luminance_max(dropoff);
    write_scaled_block(
        canvas_pixels,
        &row_pdb.pixel_data,
        render_scale,
        |input| pixel_color(*input, &roots.0.colors, luminance_max, dropoff),
        |output, pixel| output.copy_from_slice(pixel),
    );

    write_scaled_block(
        pdb_slice,
        &row_pdb.pixel_data,
        render_scale,
        |input| *input,
        |output, input| *output = *input,
    );

    let image_data = web_sys::ImageData::new_with_u8_clamped_array(
        wasm_bindgen::Clamped(&canvas_bytes),
        CANVAS_SIZE as u32,
    )?;
    ctx.put_image_data(&image_data, 0.0, row as f64)?;
    Ok(())
}
