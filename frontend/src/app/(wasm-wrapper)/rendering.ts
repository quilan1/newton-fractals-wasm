import { PixelDataBuffer, Polynomial, Roots } from "@/pkg/newton_wasm";
import { getNewton } from "./consts";
import { Transform } from "@/app/(util)/transform";
import { IterRootMethod, getIterMethod } from "./structs";

export const calculateRow = (fz: Polynomial, roots: Roots, transform: Transform, iterMethod: IterRootMethod, renderScale: number, row: number): PixelDataBuffer => {
    const method = getIterMethod(iterMethod);
    return getNewton().__calculateRow(fz, roots, transform, method, renderScale, row);
}

export const renderRow = (
    context: CanvasRenderingContext2D, roots: Roots, pdb: PixelDataBuffer, pdbRow: PixelDataBuffer, renderScale: number, row: number,
    dropoff: number,
) => {
    getNewton().__renderRow(context, roots, pdb, pdbRow, renderScale, row, dropoff);
}

export const recolorRow = (
    context: CanvasRenderingContext2D, roots: Roots, pdb: PixelDataBuffer, row: number,
    dropoff: number,
) => {
    getNewton().__recolorRow(context, roots, pdb, row, dropoff);
}

export const newImagePixelDataBuffer = (): PixelDataBuffer => {
    return getNewton().__newImagePixelDataBuffer();
}
