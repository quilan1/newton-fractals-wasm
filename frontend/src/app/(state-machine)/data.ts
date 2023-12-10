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

export const newRenderData = (scaleFactor = 6): RenderData => ({
    startTime: Date.now(),
    row: 0,
    scaleFactor,
});

export const resetFractalData = (
    fractalData: FractalData | undefined, generalProps: AppGeneralProps, recalculate: boolean
): FractalData | undefined => {
    const { formula } = generalProps;

    fractalData?.pdb.free();
    const pdb = newImagePixelDataBuffer();

    let fz = fractalData?.fz;
    let roots = fractalData?.roots;

    if (!fractalData || recalculate) {
        fz = newPolynomial(formula.value) ?? undefined;
        roots = newRoots(fz) ?? undefined;
    }

    if (!fz || !roots) {
        fz?.free();
        roots?.free();
        pdb.free();
        return undefined;
    }

    setRootColors(generalProps, roots);
    return { fz, roots, pdb }
}
