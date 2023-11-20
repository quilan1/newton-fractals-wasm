import { Polynomial, Roots } from "@/pkg/newton_wasm";
import { calculate, newPolynomial, newRoots, render } from "./newton-interface";
import { RenderData } from "./fractal";

export interface FractalData {
    fz: Polynomial,
    roots: Roots,
}

export const newFractalData = (formula: string): FractalData => {
    const fz = newPolynomial(formula);
    const roots = newRoots(fz);
    // console.log("Roots", roots.roots().map(c => ({ re: c.re.toFixed(2), im: c.im.toFixed(2) })));
    return { fz, roots }
}

export const renderToCanvas = (
    context: CanvasRenderingContext2D, renderData: RenderData, fractalData: FractalData
) => {
    const { row, scale } = renderData;
    const { fz, roots } = fractalData;
    const row_data = calculate(fz, roots, scale, row);
    render(context, roots, scale, row, row_data);
}

export const postDraw = (context: CanvasRenderingContext2D, fractalData: FractalData) => {
    _drawRoots(context, fractalData.roots);
}

const _drawRoots = (context: CanvasRenderingContext2D, roots: Roots) => {
    for (const root of roots.roots()) {
        const x = 400 * (1 + root.re / 1.5);
        const y = 400 * (1 + root.im / 1.5);

        context.strokeStyle = 'black';
        context.beginPath();
        context.arc(x, y, 19, 0, 2 * Math.PI);
        context.stroke();

        context.beginPath();
        context.arc(x, y, 21, 0, 2 * Math.PI);
        context.stroke();

        context.strokeStyle = 'white';
        context.beginPath();
        context.arc(x, y, 20, 0, 2 * Math.PI);
        context.stroke();
    }
}
