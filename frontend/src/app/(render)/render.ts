import { applyTransforms, invert, transformMany } from "../(util)/transform";
import { canvasToUnitTransform, toCanvasCenterOrigin } from "../(wasm-wrapper)/transform";
import { OklchColor, } from "../(wasm-wrapper)/structs";
import { calculateRow, renderRow } from "../(wasm-wrapper)/rendering";
import { RenderStateData } from "./data";
import assert from "assert";

export const renderToCanvasRow = (data: RenderStateData, context: CanvasRenderingContext2D) => {
    assert(!!data.renderData && !!data.fractalData);

    const { row, scaleFactor } = data.renderData;
    const { fz, roots, pdb, dropoff, transform } = data.fractalData;
    const pdbRow = calculateRow(fz, roots, transform, 1 << scaleFactor, row);
    renderRow(context, roots, pdb, pdbRow, 1 << scaleFactor, row, dropoff);
    pdbRow.free();
}

export const drawRoots = (data: RenderStateData, context: CanvasRenderingContext2D) => {
    if (!data.fractalData) return;

    const { roots, transform } = data.fractalData;
    const _transform = invert(transformMany(toCanvasCenterOrigin(), canvasToUnitTransform(transform)));
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

export const spreadColors = (colors: OklchColor[]) => {
    const angleEpsilon = 5;

    // Shift them up by 5 deg, so that things near the 0 mark, but negative are counted as 0'ish
    for (const color of colors) { color.h += 360 + angleEpsilon; color.h %= 360; }
    colors.sort((a, b) => a.h - b.h);

    const initialAngle = colors[0].h - angleEpsilon;
    const angleAmount = 360 / colors.length;

    // The goal of this algorithm is to spread out the colors as much as possible on the hue spectrum.
    // We also want to maximize the distance between adjacent nodes, so this basically boils down to the
    // following problem: Given an array [0..n-1], what permutation maximizes the closest-distance
    // between adjacent elements, modulo-n? This algorithm permutes the array as needed to maximize
    // the adjacent differences.
    const n = colors.length;
    let allIndices: number[];
    if (!(colors.length & 1)) {
        const indices = [...Array(colors.length / 2).keys()].map(i => i * (n / 2 + 1));
        allIndices = [...indices, ...indices.map(v => (n * n + 2 * n - 4) / 4 - v)];
    } else {
        allIndices = [...Array(colors.length).keys()].map(i => i * (n - 1) / 2);
    }
    // allIndices = [...Array(colors.length).keys()];
    allIndices = allIndices.map(v => v % n);
    colors.forEach((color, i) => { color.h = initialAngle + allIndices[i] * angleAmount });

    // console.log("Colors:", colors.map(c => ({ c: c.c.toFixed(2), h: c.h.toFixed(2) })));

    return colors;
}

