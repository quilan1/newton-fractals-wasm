/* eslint-disable @typescript-eslint/no-non-null-assertion */
export type Newton = typeof import('@/pkg/newton_wasm');
export let newton: Newton | null = null;

import { Polynomial, PixelDataRow, Roots } from '@/pkg/newton_wasm';

export const getNewtonSync = (): Newton | null => {
    if (!newton) { void getNewtonAsync(); }
    return newton;
}

export const getNewtonAsync = async (): Promise<Newton> => {
    newton = await import('@/pkg/newton_wasm');
    return newton;
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

export const calculate = (fz: Polynomial, roots: Roots, renderScale: number, row: number): PixelDataRow => {
    assertNewton(newton);
    return newton!.calculate(fz, roots, renderScale, row);
}

export const render = (context: CanvasRenderingContext2D, roots: Roots, renderScale: number, row: number, pixelDataRow: PixelDataRow) => {
    assertNewton(newton);
    newton!.render(context, roots, renderScale, row, pixelDataRow);
}