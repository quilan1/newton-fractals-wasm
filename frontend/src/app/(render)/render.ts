import { applyTransforms, invert, transformMany } from "../(util)/transform";
import { canvasToUnitTransform, toCanvasCenter } from "../(wasm-wrapper)/transform";
import { OklchColor, } from "../(wasm-wrapper)/structs";
import { calculateRow, renderRow } from "../(wasm-wrapper)/rendering";
import { FractalData, RenderStateData } from "./data";

export const renderToCanvasRow = (
    context: CanvasRenderingContext2D, data: RenderStateData
) => {
    if (!data.fractalData) return;

    const { row, scale } = data.renderData;
    const { fz, roots, pdb, dropoff, transform } = data.fractalData;
    const pdbRow = calculateRow(fz, roots, transform, scale, row);
    renderRow(context, roots, pdb, pdbRow, scale, row, dropoff);
    pdbRow.free();
}

export const postDraw = (context: CanvasRenderingContext2D, fractalData: FractalData) => {
    _drawRoots(context, fractalData);
}

const _drawRoots = (context: CanvasRenderingContext2D, fractalData: FractalData) => {
    const { roots, transform } = fractalData;
    const _transform = invert(transformMany(toCanvasCenter(), canvasToUnitTransform(transform)));
    for (const root of roots.roots()) {
        const { x, y } = applyTransforms(root.re, root.im, _transform);

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

const angleDelta = (a: number, b: number): number => {
    const delta = (a - b + 360) % 360;
    const deltaNeg = -((360 - delta) % 360);
    return (Math.abs(delta) < Math.abs(deltaNeg)) ? delta : deltaNeg;
}

export const spreadColors = (_colors: OklchColor[]) => {
    const colors = _colors.map(c => ({ h: c.h, c: c.c }));

    for (const color of colors) { color.h += color.c; }
    for (const color of colors) { color.h += 360; color.h %= 360; }
    // for (const color of colors) { color.h += color.h / 360.0; }
    colors.sort((a, b) => a.h - b.h);
    // console.log("Colors:", colors.map(c => ({ c: c.c.toFixed(2), h: c.h.toFixed(2) })));

    for (let _ = 0; _ < 20; _++) {
        let deltas: number[][] = [];
        for (let i = 0; i < colors.length; ++i) {
            const prevColor = (i + colors.length - 1) % colors.length;
            const nextColor = (i + colors.length + 1) % colors.length;
            const prevDelta = Math.abs(angleDelta(colors[prevColor].h, colors[i].h));
            const nextDelta = Math.abs(angleDelta(colors[i].h, colors[nextColor].h));
            const _deltas = [prevDelta, nextDelta].sort((a, b) => a - b);
            deltas.push([i, ..._deltas, prevDelta, nextDelta]);
        }
        deltas.sort((a, b) => a[1] - b[1]);
        if ((deltas[0][1] + 2) * colors.length > 360) break;
        // console.log('deltas', deltas);

        const lowestValue = deltas[0][1];
        deltas = deltas.filter(d => d[1] === lowestValue);
        deltas.sort((a, b) => a[2] - b[2]);

        const lowestIndex = deltas[0][0];
        const angleDeltas: [number, number][] = colors.map((_, j) => [j, Math.abs(angleDelta(colors[lowestIndex].h, colors[j].h))]);
        angleDeltas.sort((a, b) => b[1] - a[1]);
        // console.log('angleDeltas', angleDeltas);

        const furthestIndex = angleDeltas[0][0];
        const temp = colors[furthestIndex].h;
        colors[furthestIndex].h = colors[lowestIndex].h;
        colors[lowestIndex].h = temp;
    }

    return colors;
}
