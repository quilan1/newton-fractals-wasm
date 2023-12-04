import { PixelDataBuffer, Polynomial, Roots } from "@/pkg/newton_wasm";
import { Transform } from "../(util)/transform";
import { newPolynomial, newRoots } from "../(wasm-wrapper)/structs";
import { setRootColors } from "./render";
import { newImagePixelDataBuffer } from "../(wasm-wrapper)/rendering";

///////////////////////////////////////////////////////////////////

export enum RenderState {
    RENDER_PASS,
    RECOLOR_PASS,
    DONE,
}

export type RenderPassFn<T = void> = (data: RenderStateData, context: CanvasRenderingContext2D) => T;
export interface RenderStateData {
    prePassFn: RenderPassFn,
    passFn: RenderPassFn<boolean>,
    postPassFn: RenderPassFn,

    stateData: StateData,
    renderData?: RenderData,
    fractalData?: FractalData,
}

export interface StateData {
    curState: RenderState,
    isRendering: boolean,
}

export enum ColorScheme {
    CONTRASTING_HUES = "Contrasting Hues",
    LINEAR_HUES = "Linear Hues",
    MONOCHROMATIC = "Monochromatic"
}

export interface RenderSettings {
    colorScheme: ColorScheme,
    hueOffset: number,
    chromaticity: number,
    dropoff: number,
    renderRoots: boolean,
    staticHues: boolean,
}

export interface RenderData {
    startTime: number,
    row: number,
    scaleFactor: number,
    renderSettings: RenderSettings
}

export interface FractalData {
    fz: Polynomial,
    roots: Roots,
    pdb: PixelDataBuffer,
    transform: Transform,
}

///////////////////////////////////////////////////////////////////

export const isRenderStateFinishedRendering = (data: RenderStateData): boolean => {
    return !data.stateData.isRendering
}

export const setRenderStateFinishedRendering = (data: RenderStateData) => {
    data.stateData.isRendering = false;
}

export const newRenderData = (renderSettings: RenderSettings): RenderData => ({
    startTime: Date.now(),
    row: 0,
    scaleFactor: 5,
    renderSettings,
});

export const newFractalData = (formula: string, transform: Transform, renderSettings: RenderSettings): FractalData | undefined => {
    const fz = newPolynomial(formula);
    if (!fz) return undefined;

    const roots = newRoots(fz);
    if (!roots) { fz.free(); return undefined; }
    setRootColors(roots, renderSettings);

    const pdb = newImagePixelDataBuffer();

    return { fz, roots, pdb, transform }
}

export const freeFractalData = (fractalData?: FractalData) => {
    if (!fractalData) return;
    fractalData.fz.free();
    fractalData.roots.free();
    fractalData.pdb.free();
}
