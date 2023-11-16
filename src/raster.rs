use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct Color {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: u8,
}

#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct Image {
    pub(crate) width: i32,
    pub(crate) height: i32,
    pub(crate) bytes: Vec<u8>,
}

#[wasm_bindgen]
impl Image {
    pub(crate) fn blank(w: i32, h: i32) -> Image {
        let mut bytes = Vec::with_capacity((w * h) as usize * 4);
        for _ in 0..h {
            for _ in 0..w {
                bytes.extend_from_slice(&[0, 0, 0, 255]);
            }
        }
        Image {
            width: w,
            height: h,
            bytes,
        }
    }

    pub(crate) fn set_pixel(&mut self, index: usize, color: Color) {
        let index = 4 * index;
        self.bytes[index] = color.r;
        self.bytes[index+1] = color.g;
        self.bytes[index+2] = color.b;
        self.bytes[index+3] = 255;
    }

    pub(crate) fn get_pixel(&self, index: usize) -> Color {
        let index = 4 * index;
        Color {
            r: self.bytes[index],
            g: self.bytes[index+1],
            b: self.bytes[index+2],
            a: 255
        }
    }

    pub fn buffer(&self) -> *const u8 {
        self.bytes.as_ptr()
    }
}

#[cfg(feature = "bin-build")]
impl From<Image> for _raster::Image {
    fn from(image: Image) -> _raster::Image {
        _raster::Image { width: image.width, height: image.height, bytes: image.bytes }
    }
}
