import { Polynomial } from "@/pkg/newton_wasm";
import { calculate, newPolynomial, render } from "./newton-interface";
import { RenderData } from "./fractal";

export interface FractalData {
    fz: Polynomial,
}

export const newFractalData = (formula: string): FractalData => {
    const fz = newPolynomial(formula);
    // const roots = fz.roots();
    // console.log("Roots", roots.map(c => ({ re: c.re.toFixed(2), im: c.im.toFixed(2) })));
    return { fz }
}

export const renderToCanvas = (
    context: CanvasRenderingContext2D, renderData: RenderData, fractalData: FractalData
) => {
    const { row, scale } = renderData;
    const { fz } = fractalData;
    const row_data = calculate(fz, scale, row);
    render(context, fz, scale, row, row_data);
}

export const postDraw = (context: CanvasRenderingContext2D, fz: Polynomial) => {
    _drawRoots(context, fz);
}

const _drawRoots = (context: CanvasRenderingContext2D, fz: Polynomial) => {
    for (const root of fz.roots()) {
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
