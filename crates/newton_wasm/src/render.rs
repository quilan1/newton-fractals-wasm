use newton_core::{calc_luminance_max, pixel_color, PixelData};
use num_complex::Complex32;
use wasm_bindgen::prelude::*;

use crate::{
    canvas_size, complex_window,
    js_imports::{JsTransform, JsTryInto, Transform},
    pixel_data_buffer::PixelDataBuffer,
    polynomial::Polynomial,
    roots::Roots,
    scale_row::write_scaled_block,
    units_per_pixel_base, units_per_pixel_scaled,
};

///////////////////////////////////////////////////////////////////

#[wasm_bindgen(js_name = __newImagePixelDataBuffer)]
pub fn new_image_pixel_data_buffer() -> PixelDataBuffer {
    let pixel_data = vec![PixelData::default(); canvas_size() * canvas_size()];
    PixelDataBuffer::new(pixel_data)
}

#[wasm_bindgen(js_name = __calculateRow)]
pub fn calculate_row(
    fz: &Polynomial,
    roots: &Roots,
    affine_transform: JsTransform,
    method: u32,
    render_scale: usize,
    row: usize,
) -> Result<PixelDataBuffer, JsError> {
    let num_pixels = canvas_size() / render_scale;
    let mut pixel_data = vec![PixelData::default(); num_pixels];

    let affine_transform: Transform = affine_transform.js_try_into()?;
    let (z, units_per_pixel_scaled) = calculate_z_start(affine_transform.scale, row, num_pixels);

    let fz = &fz.poly;
    let roots = &roots.0.roots;
    let z = z + Complex32::new(affine_transform.translate.x, affine_transform.translate.y);

    calculate_row_method(
        method,
        fz,
        roots,
        z,
        units_per_pixel_scaled,
        &mut pixel_data,
    )?;

    Ok(PixelDataBuffer::new(pixel_data))
}

fn calculate_row_method(
    method: u32,
    fz: &newton_core::Polynomial,
    roots: &[Complex32],
    z: Complex32,
    units_per_pixel_scaled: f32,
    pixel_data: &mut [PixelData],
) -> Result<(), JsError> {
    macro_rules! calc_row {
        ($iter:ident, $fz:ident, $roots:ident, $z: ident, $upps: ident, $pdata: ident) => {
            newton_core::calculate_row::<_, newton_core::calculate::$iter>(
                $fz, $roots, $z, $upps, $pdata,
            )
        };
    }

    let upps = units_per_pixel_scaled;
    match method {
        0 => calc_row!(NewtonsMethod, fz, roots, z, upps, pixel_data),
        1 => calc_row!(SchroedersMethod, fz, roots, z, upps, pixel_data),
        2 => calc_row!(SchroedersMethod2, fz, roots, z, upps, pixel_data),
        3 => calc_row!(HalleysMethod, fz, roots, z, upps, pixel_data),
        4 => calc_row!(SteffensensMethod, fz, roots, z, upps, pixel_data),
        _ => {
            return Err(JsError::new(&format!(
                "Invalid root iter method type: {method}"
            )))
        }
    }

    Ok(())
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
#[allow(clippy::too_many_arguments)]
pub fn render_row(
    ctx: &web_sys::CanvasRenderingContext2d,
    roots: &Roots,
    pdb: &mut PixelDataBuffer,
    row_pdb: &PixelDataBuffer,
    render_scale: usize,
    row: usize,
    dropoff: f32,
    lightness_mode: u32,
    is_dark_non_convergence: bool,
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
        |input| {
            pixel_color(
                *input,
                &roots.0.colors,
                luminance_max,
                dropoff,
                lightness_mode.into(),
                is_dark_non_convergence,
            )
        },
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

#[wasm_bindgen(js_name = __recolorRow)]
pub fn recolor_row(
    ctx: &web_sys::CanvasRenderingContext2d,
    roots: &Roots,
    pdb: &mut PixelDataBuffer,
    row: usize,
    dropoff: f32,
    lightness_mode: u32,
    is_dark_non_convergence: bool,
) -> Result<(), JsValue> {
    let pdb_row_offset = row * canvas_size();
    let pdb_block_len = canvas_size();
    let pdb_slice = &pdb.pixel_data[pdb_row_offset..pdb_row_offset + pdb_block_len];

    let mut canvas_bytes = vec![0; 4 * pdb_block_len];
    let canvas_pixels = unsafe { canvas_bytes.align_to_mut::<[u8; 4]>().1 };

    let luminance_max = calc_luminance_max(dropoff);
    write_scaled_block(
        canvas_pixels,
        pdb_slice,
        1,
        |input| {
            pixel_color(
                *input,
                &roots.0.colors,
                luminance_max,
                dropoff,
                lightness_mode.into(),
                is_dark_non_convergence,
            )
        },
        |output, pixel| output.copy_from_slice(pixel),
    );

    let image_data = web_sys::ImageData::new_with_u8_clamped_array(
        wasm_bindgen::Clamped(&canvas_bytes),
        canvas_size() as u32,
    )?;
    ctx.put_image_data(&image_data, 0.0, row as f64)?;
    Ok(())
}
