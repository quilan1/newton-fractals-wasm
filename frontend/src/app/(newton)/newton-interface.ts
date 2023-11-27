/* eslint-disable @typescript-eslint/no-non-null-assertion */
export type Newton = typeof import('@/pkg/newton_wasm');
export type Wasm = typeof import('@/pkg/newton_wasm_bg.wasm');

import { Polynomial, PixelDataBuffer, Roots } from '@/pkg/newton_wasm';
import { Point } from '../(util)/transform';
import { getNewton, getWasmSync } from './(wrapper)/consts';



export const wasmMemoryUsage = () => {
    return getWasmSync()?.memory.buffer.byteLength ?? null;
}



export const newPolynomial = (formula: string): Polynomial => {
    return new (getNewton().Polynomial)(formula);
}

export const newRoots = (fz: Polynomial): Roots => {
    return new (getNewton().Roots)(fz);
}

export const calculateRow = (fz: Polynomial, roots: Roots, zoom: number, center: Point, renderScale: number, row: number): PixelDataBuffer => {
    return getNewton().calculateRow(fz, roots, zoom, center.x, center.y, renderScale, row);
}

export const renderRow = (
    context: CanvasRenderingContext2D, roots: Roots, pdb: PixelDataBuffer, pdbRow: PixelDataBuffer, renderScale: number, row: number,
    dropoff: number,
) => {
    getNewton().renderRow(context, roots, pdb, pdbRow, renderScale, row, dropoff);
}

export const newImagePixelDataBuffer = (): PixelDataBuffer => {
    return getNewton().newImagePixelDataBuffer();
}




export const isValidFormula = (_formula: string) => {
    // const re = /^(\s*[+-]\d*\*?(z(\^\d+)?)?)+/;
    return false;
}
