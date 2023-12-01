import { PixelDataBuffer, Polynomial, Roots } from "@/pkg/newton_wasm";
import { Transform } from "../(util)/transform";
import { newPolynomial, newRoots } from "../(wasm-wrapper)/structs";
import { spreadColors } from "./render";
import { newImagePixelDataBuffer } from "../(wasm-wrapper)/rendering";

///////////////////////////////////////////////////////////////////

export enum RenderState {
    RENDER_PASS,
    DONE,
}

export type RenderPassFn = (data: RenderStateData, context: CanvasRenderingContext2D) => void;
export interface RenderStateData {
    prePassFn: RenderPassFn,
    passFn: RenderPassFn,
    postPassFn: RenderPassFn,

    stateData: StateData,
    renderData?: RenderData,
    fractalData?: FractalData,
}

export interface StateData {
    curState: RenderState,
    isRendering: boolean,
}

export interface RenderData {
    startTime: number,
    row: number,
    scaleFactor: number,
    renderRoots: boolean,
}

export interface FractalData {
    fz: Polynomial,
    roots: Roots,
    pdb: PixelDataBuffer,
    dropoff: number,
    transform: Transform,
}

///////////////////////////////////////////////////////////////////

export const isRenderStateFinishedRendering = (data: RenderStateData): boolean => {
    return !data.stateData.isRendering
}

export const setRenderStateFinishedRendering = (data: RenderStateData) => {
    data.stateData.isRendering = false;
}

export const newRenderData = (renderRoots: boolean): RenderData => ({
    startTime: Date.now(),
    row: 0,
    scaleFactor: 5,
    renderRoots,
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
