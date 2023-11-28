use newton_core::{calc_luminance_max, pixel_color, PixelData};
use num_complex::Complex32;
use wasm_bindgen::prelude::*;

use crate::{
    canvas_size, complex_window, pixel_data_buffer::PixelDataBuffer, polynomial::Polynomial,
    roots::Roots, scale_row::write_scaled_block, transform::Transform, units_per_pixel_base,
    units_per_pixel_scaled, TryFromJs,
};

#[wasm_bindgen(js_name = __newImagePixelDataBuffer)]
pub fn new_image_pixel_data_buffer() -> PixelDataBuffer {
    let pixel_data = vec![PixelData(0); canvas_size() * canvas_size()];
    PixelDataBuffer::new(pixel_data)
}

#[wasm_bindgen(js_name = __calculateRow)]
pub fn calculate_row(
    fz: &Polynomial,
    roots: &Roots,
    affine_transform: JsValue,
    render_scale: usize,
    row: usize,
) -> Result<PixelDataBuffer, JsError> {
    let num_pixels = canvas_size() / render_scale;
    let mut pixel_data = vec![PixelData(0); num_pixels];

    let affine_transform: Transform = affine_transform.try_from_js()?;
    let (z, units_per_pixel_scaled) = calculate_z_start(affine_transform.scale, row, num_pixels);
    newton_core::calculate_row(
        &fz.poly,
        &roots.0.roots,
        z + Complex32::new(affine_transform.translate.x, affine_transform.translate.y),
        units_per_pixel_scaled,
        &mut pixel_data,
    );
    Ok(PixelDataBuffer::new(pixel_data))
}

fn calculate_z_start(zoom: f32, row: usize, num_pixels: usize) -> (Complex32, f32) {
    let upp_full = units_per_pixel_base();
    let upp_local = units_per_pixel_scaled(num_pixels);
    let upp_local = upp_local * zoom;

    let z_im = -complex_window() + upp_full * (row as f32);
    let z_re = -complex_window();

    (Complex32::new(z_re * zoom, z_im * zoom), upp_local)
}

#[wasm_bindgen(js_name = __renderRow)]
pub fn render_row(
    ctx: &web_sys::CanvasRenderingContext2d,
    roots: &Roots,
    pdb: &mut PixelDataBuffer,
    row_pdb: &PixelDataBuffer,
    render_scale: usize,
    row: usize,
    dropoff: f32,
) -> Result<(), JsValue> {
    let pdb_row_offset = row * canvas_size();
    let pdb_block_len = canvas_size() * render_scale;
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
        canvas_size() as u32,
    )?;
    ctx.put_image_data(&image_data, 0.0, row as f64)?;
    Ok(())
}
