import { PixelDataBuffer, Polynomial, Roots } from "@/pkg/newton_wasm";
import { newPolynomial, newRoots } from "../(wasm-wrapper)/structs";
import { setRootColors } from "./render";
import { newImagePixelDataBuffer } from "../(wasm-wrapper)/wrapper";
import { AppGeneralProps } from "../(components)/app-props";

///////////////////////////////////////////////////////////////////

export enum State {
    RENDER_PASS,
    RECOLOR_PASS,
    DONE,
}

export type RenderPassFn<T = void> = (data: RenderStateData, context: CanvasRenderingContext2D) => T;
export interface RenderStateData {
    fns: StateMachineFns,

    state: State,
    generalProps: AppGeneralProps,
    renderData?: RenderData,
    fractalData?: FractalData,
}

export interface StateMachineFns {
    prePassFn: RenderPassFn,
    passFn: RenderPassFn<boolean>,
    postPassFn: RenderPassFn,
}

export interface RenderData {
    startTime: number,
    row: number,
    scaleFactor: number,
}

export interface FractalData {
    fz: Polynomial,
    roots: Roots,
    pdb: PixelDataBuffer,
}

///////////////////////////////////////////////////////////////////

export const isRenderStateFinishedRendering = (data: RenderStateData): boolean => {
    return !data.generalProps.isRendering.value
}

export const setRenderStateFinishedRendering = (data: RenderStateData) => {
    data.generalProps.isRendering.value = false;
}

export const newRenderData = (): RenderData => ({
    startTime: Date.now(),
    row: 0,
    scaleFactor: 5,
});

export const newFractalData = (generalProps: AppGeneralProps): FractalData | undefined => {
    const { formula } = generalProps;

    const fz = newPolynomial(formula.value);
    if (!fz) return undefined;

    const roots = newRoots(fz);
    if (!roots) { fz.free(); return undefined; }
    setRootColors(generalProps, roots);

    const pdb = newImagePixelDataBuffer();

    return { fz, roots, pdb }
}

export const freeFractalData = (fractalData?: FractalData) => {
    if (!fractalData) return;
    fractalData.fz.free();
    fractalData.roots.free();
    fractalData.pdb.free();
}
