import { PixelDataBuffer, Polynomial, Roots } from "@/pkg/newton_wasm";
import { Transform } from "../(util)/transform";
import { newPolynomial, newRoots } from "../(wasm-wrapper)/structs";
import { spreadColors } from "./render";
import { newImagePixelDataBuffer } from "../(wasm-wrapper)/rendering";

///////////////////////////////////////////////////////////////////

export interface RenderStateData {
    renderData: RenderData,
    fractalData?: FractalData,
}

export interface RenderData {
    isRendering: boolean,
    startTime: number,
    row: number,
    scale: number,
}

export interface FractalData {
    fz: Polynomial,
    roots: Roots,
    pdb: PixelDataBuffer,
    dropoff: number,
    transform: Transform,
}

///////////////////////////////////////////////////////////////////

export const newRenderStateData = (): RenderStateData => {
    const renderData = newRenderData();
    renderData.isRendering = false;
    return { renderData };
}

export const newRenderData = () => ({
    isRendering: true,
    startTime: Date.now(),
    row: 0,
    scale: 32
});

export const newFractalData = (formula: string, dropoff: number, transform: Transform): FractalData | undefined => {
    const fz = newPolynomial(formula);
    if (!fz) return undefined;

    const roots = newRoots(fz);
    if (!roots) { fz.free(); return undefined; }

    const colors = roots.colors();
    // console.log("Colors:", colors.map(c => ({ c: c.c.toFixed(2), h: c.h.toFixed(2) })));
    // console.log("Roots", roots.roots().map(c => { const r = { re: c.re.toFixed(2), im: c.im.toFixed(2) }; c.free(); return r; }));
    const _colors = spreadColors(colors);
    roots.set_colors(_colors);
    const pdb = newImagePixelDataBuffer();

    return { fz, roots, pdb, dropoff, transform }
}

export const freeFractalData = (fractalData?: FractalData) => {
    if (!fractalData) return;
    fractalData.fz.free();
    fractalData.roots.free();
    fractalData.pdb.free();
}

