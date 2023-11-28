#[derive(Clone, Copy)]
pub struct PixelData(pub u16);

pub struct PixelDataDetail {
    pub root_index: usize,
    pub frac: f32,
}

///////////////////////////////////////////////////////////////////

const fn mask(n: u32) -> u32 {
    (1 << n) - 1
}

// f32 = [S][E: 8][M: 23]
// P16 = [I: 4][E: 3][M: 9]

const INDEX_SIZE: u32 = 4; // Should handle up to z^15
const INDEX_MASK: u32 = mask(INDEX_SIZE);
const FRACT_SIZE: u32 = 16 - INDEX_SIZE;
const FRACT_MASK: u32 = mask(FRACT_SIZE);
const EXP_BITS: u32 = 3; // Should handle up to MAX_NEWTON_COUNT=1<<((1<<3)-1)=128
const EXP_MASK_OR: u32 = (0x7F & !mask(EXP_BITS)) << 23;
const FRACT_SHIFT: u32 = 23 - FRACT_SIZE + EXP_BITS;

impl From<(usize, f32)> for PixelData {
    fn from(value: (usize, f32)) -> Self {
        let (root_index, frac) = value;
        // log::info!("in -- frac: {frac}, {:08X}", frac.to_bits());
        let v_root = (root_index as u32 & INDEX_MASK) << FRACT_SIZE; // 4 bits
        let v_frac = (frac.to_bits() >> FRACT_SHIFT) & FRACT_MASK;
        PixelData((v_root | v_frac) as u16)
    }
}

impl From<PixelData> for PixelDataDetail {
    fn from(value: PixelData) -> Self {
        let root_index = value.0 as usize >> FRACT_SIZE;
        let frac = f32::from_bits(((value.0 as u32 & FRACT_MASK) << FRACT_SHIFT) | EXP_MASK_OR);
        // log::info!("out -- frac: {frac}, {:08X}", frac.to_bits());
        PixelDataDetail { root_index, frac }
    }
}

impl From<PixelDataDetail> for PixelData {
    fn from(value: PixelDataDetail) -> Self {
        (value.root_index, value.frac).into()
    }
}
