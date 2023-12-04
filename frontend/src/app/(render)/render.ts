import assert from "assert";
import { applyTransforms, invert, transformMany } from "../(util)/transform";
import { canvasToUnitTransform, toCanvasCenterOrigin } from "../(wasm-wrapper)/transform";
import { OklchColor, } from "../(wasm-wrapper)/structs";
import { calculateRow, renderRow } from "../(wasm-wrapper)/rendering";
import { ColorScheme, RenderSettings, RenderStateData } from "./data";
import { Roots } from "@/pkg/newton_wasm";
import { lerp, toSplitArray } from "../(util)/util";

export const renderToCanvasRow = (data: RenderStateData, context: CanvasRenderingContext2D) => {
    assert(!!data.renderData && !!data.fractalData);

    const { row, scaleFactor, renderSettings } = data.renderData;
    const { fz, roots, pdb, transform } = data.fractalData;
    const pdbRow = calculateRow(fz, roots, transform, 1 << scaleFactor, row);
    renderRow(context, roots, pdb, pdbRow, 1 << scaleFactor, row, renderSettings.dropoff);
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

interface ColorInfo {
    rootIndex: number,
    color: OklchColor,
    radius: number,
}

export const setRootColors = (roots: Roots, renderSettings: RenderSettings) => {
    const { colorScheme, hueOffset, chromaticity, staticHues } = renderSettings;

    const complexRoots = roots.roots();
    const radii = complexRoots.map(c => Math.hypot(c.re, c.im));
    const colorInfo: ColorInfo[] = complexRoots.map((c, i) => ({
        rootIndex: i,
        radius: radii[i],
        color: {
            h: Math.atan2(c.im, c.re) * 180 / Math.PI,
            c: lerp(radii[i] / 1.5, 0.01, 0.4 * chromaticity),
        }
    }));

    let info: ColorInfo[];
    switch (colorScheme) {
        case ColorScheme.LINEAR_HUES:
            info = linearHueColors(colorInfo, staticHues);
            break;
        case ColorScheme.CONTRASTING_HUES:
            info = contrastingHueColors(colorInfo, staticHues);
            break;
        case ColorScheme.MONOCHROMATIC:
            info = monochromaticColors(colorInfo, staticHues);
            break;
        default:
            const _colorScheme: never = colorScheme;
            console.error("Invalid colorScheme:", _colorScheme);
            return;
    }

    info.forEach(i => { i.color.h += hueOffset; });
    info.sort((a, b) => a.rootIndex - b.rootIndex);

    const colors = info.map(c => c.color);
    roots.setColors(colors);
}

const normalizedAngle = (h: number, angleEpsilon?: number) => {
    const epsilon = angleEpsilon ?? 0;
    return (h + 360 + epsilon) % 360 - epsilon;
}

const normalizeSortColorInfo = (_colorInfo: ColorInfo[]): ColorInfo[] => {
    const minAngleDelta = 5;

    const sortFn = (a: ColorInfo, b: ColorInfo) => {
        const ah = normalizedAngle(a.color.h, minAngleDelta);
        const bh = normalizedAngle(b.color.h, minAngleDelta);
        const angleDelta = ah - bh;
        const radiusDelta = a.radius - b.radius;
        return (Math.abs(angleDelta) > minAngleDelta) ? angleDelta : radiusDelta;
    };

    const [shortInfo, colorInfo] = toSplitArray(_colorInfo, c => c.radius < 0.1);
    shortInfo.sort(sortFn);
    colorInfo.sort(sortFn);

    return colorInfo.concat(shortInfo);
}

const monochromaticColors = (_info: ColorInfo[], staticHues: boolean) => {
    const info = normalizeSortColorInfo(_info);
    info.forEach(c => c.color.h = info[0].color.h * (staticHues ? 0 : 1));
    return info;
}

const linearHueColors = (_info: ColorInfo[], staticHues: boolean) => {
    const info = normalizeSortColorInfo(_info);
    const initialAngle = info[0].color.h;
    const angleAmount = 360 / info.length;
    info.forEach((info, i) => { info.color.h = initialAngle * (staticHues ? 0 : 1) + i * angleAmount });
    return info;
}

const contrastingHueColors = (_info: ColorInfo[], staticHues: boolean) => {
    const info = normalizeSortColorInfo(_info);
    const initialAngle = info[0].color.h;
    const angleAmount = 360 / info.length;

    // The goal of this algorithm is to spread out the colors as much as possible on the hue spectrum.
    // We also want to maximize the distance between adjacent nodes, so this basically boils down to the
    // following problem: Given an array [0..n-1], what permutation maximizes the closest-distance
    // between adjacent elements, modulo-n? This algorithm permutes the array as needed to maximize
    // the adjacent differences.
    const n = info.length;
    let allIndices: number[];
    if (!(info.length & 1)) {
        const indices = [...Array(info.length / 2).keys()].map(i => i * (n / 2 + 1));
        allIndices = [...indices, ...indices.map(v => (n * n + 2 * n - 4) / 4 - v)];
    } else {
        allIndices = [...Array(info.length).keys()].map(i => i * (n - 1) / 2);
    }
    allIndices = allIndices.map(v => v % n);
    info.forEach((info, i) => { info.color.h = initialAngle * (staticHues ? 0 : 1) + allIndices[i] * angleAmount });

    return info;
}

