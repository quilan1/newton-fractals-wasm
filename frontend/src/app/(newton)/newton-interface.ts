/* eslint-disable @typescript-eslint/no-non-null-assertion */
export type Newton = typeof import('@/pkg/newton_wasm');
export type Wasm = typeof import('@/pkg/newton_wasm_bg.wasm');
export let newton: Newton | null = null;
export let wasm: Wasm | null = null;

import { Polynomial, PixelDataBuffer, Roots } from '@/pkg/newton_wasm';

export const getNewtonSync = (): Newton | null => {
    if (!newton) { void getNewtonAsync(); }
    return newton;
}

export const getNewtonAsync = async (): Promise<Newton> => {
    newton = await import('@/pkg/newton_wasm');
    return newton;
}

export const getWasmAsync = async (): Promise<Wasm> => {
    wasm = await import("@/pkg/newton_wasm_bg.wasm");
    return wasm;
}

export const wasmMemoryUsage = () => {
    void getWasmAsync();
    if (!wasm) return null;
    return wasm.memory.buffer.byteLength;
}

const assertNewton = (newton: Newton | null) => {
    if (!newton) {
        throw new Error("Web Assembly is not yet loaded");
    }
}

export const newPolynomial = (formula: string): Polynomial => {
    assertNewton(newton);
    return new newton!.Polynomial(formula);
}

export const newRoots = (fz: Polynomial): Roots => {
    assertNewton(newton);
    return new newton!.Roots(fz);
}

export const calculateRow = (fz: Polynomial, roots: Roots, zoom: number, center: [number, number], renderScale: number, row: number): PixelDataBuffer => {
    assertNewton(newton);
    return newton!.calculateRow(fz, roots, zoom, center[0], center[1], renderScale, row);
}

export const renderRow = (
    context: CanvasRenderingContext2D, roots: Roots, pdb: PixelDataBuffer, pdbRow: PixelDataBuffer, renderScale: number, row: number,
    dropoff: number,
) => {
    assertNewton(newton);
    newton!.renderRow(context, roots, pdb, pdbRow, renderScale, row, dropoff);
}

export const newImagePixelDataBuffer = (): PixelDataBuffer => {
    assertNewton(newton);
    return newton!.newImagePixelDataBuffer();
}

export const isValidFormula = (_formula: string) => {
    // const re = /^(\s*[+-]\d*\*?(z(\^\d+)?)?)+/;
    return false;
}
