pub fn write_scaled_block<Out, In, TransIn, Trans, Write>(
    output: &mut [Out],
    input: &[In],
    scale: usize,
    transform: Trans,
    write: Write,
) where
    Trans: Fn(&In) -> TransIn,
    Write: Fn(&mut Out, &TransIn),
{
    output
        .chunks_mut(input.len() * scale)
        .for_each(|output_row| {
            output_row
                .chunks_mut(scale)
                .zip(input)
                .for_each(|(output_chunk, in_unit)| {
                    let transformed_input = transform(in_unit);
                    output_chunk
                        .iter_mut()
                        .for_each(|out_pixel| write(out_pixel, &transformed_input));
                });
        });
}

///////////////////////////////////////////////////////////////////

#[cfg(test)]
mod tests {
    use super::write_scaled_block;

    #[test]
    fn simple_scale() {
        let mut input = Vec::new();
        for i in 0..3 {
            input.push(i);
        }

        let scale = 2;
        let mut output = vec![0; input.len() * scale * scale];

        write_scaled_block(
            &mut output,
            &input,
            scale,
            |input| *input,
            |output, input| *output = *input,
        );

        assert_eq!(output, [0, 0, 1, 1, 2, 2, 0, 0, 1, 1, 2, 2]);
    }

    #[test]
    fn simple_scale_pixels_to_pixels() {
        let mut input = Vec::new();
        for i in 0..12u8 {
            input.push(i);
        }

        let scale = 2;
        let mut output = vec![0u8; input.len() * scale * scale];

        let input = unsafe { input.align_to::<[u8; 4]>().1 };
        let output_slice = unsafe { output.align_to_mut::<[u8; 4]>().1 };

        write_scaled_block(
            output_slice,
            input,
            scale,
            |input| *input,
            |output, input| output.copy_from_slice(input),
        );

        assert_eq!(
            output,
            vec![
                0, 1, 2, 3, 0, 1, 2, 3, 4, 5, 6, 7, 4, 5, 6, 7, 8, 9, 10, 11, 8, 9, 10, 11, 0, 1,
                2, 3, 0, 1, 2, 3, 4, 5, 6, 7, 4, 5, 6, 7, 8, 9, 10, 11, 8, 9, 10, 11
            ]
        );
    }

    #[test]
    fn simple_scale_color_to_pixels() {
        let mut input = Vec::new();
        for i in 0..3u8 {
            input.push(i);
        }

        let scale = 2;
        let mut output = vec![0u8; input.len() * 4 * scale * scale];
        let output_slice = unsafe { output.align_to_mut::<[u8; 4]>().1 };

        write_scaled_block(
            output_slice,
            &input,
            scale,
            |input| [*input, *input, *input, *input],
            |output, input| output.copy_from_slice(input),
        );

        assert_eq!(
            output,
            vec![
                0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2
            ]
        );
    }
}
