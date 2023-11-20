/* eslint-disable @typescript-eslint/no-non-null-assertion */
export type Newton = typeof import('@/pkg/newton_wasm');
export let newton: Newton | null = null;

import { Polynomial, PixelDataRow } from '@/pkg/newton_wasm';

export const getNewton = (): Newton | null => {
    if (!newton) {
        void (async () => {
            newton = await import('@/pkg/newton_wasm');
        })();
    }

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

export const calculate = (fz: Polynomial, renderScale: number, row: number): PixelDataRow => {
    assertNewton(newton);
    return newton!.calculate(fz, renderScale, row);
}

export const render = (context: CanvasRenderingContext2D, fz: Polynomial, renderScale: number, row: number, pixelDataRow: PixelDataRow) => {
    assertNewton(newton);
    newton!.render(context, fz, renderScale, row, pixelDataRow);
}