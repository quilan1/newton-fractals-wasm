import { PixelDataBuffer, Polynomial, Roots } from "@/pkg/newton_wasm";
import { getNewton } from "./consts";
import { Point } from "@/app/(util)/transform";

export const calculateRow = (fz: Polynomial, roots: Roots, zoom: number, center: Point, renderScale: number, row: number): PixelDataBuffer => {
    const affineTransform = { scale: zoom, translate: center };
    return getNewton().__calculateRow(fz, roots, affineTransform, renderScale, row);
}

export const renderRow = (
    context: CanvasRenderingContext2D, roots: Roots, pdb: PixelDataBuffer, pdbRow: PixelDataBuffer, renderScale: number, row: number,
    dropoff: number,
) => {
    getNewton().__renderRow(context, roots, pdb, pdbRow, renderScale, row, dropoff);
}

export const newImagePixelDataBuffer = (): PixelDataBuffer => {
    return getNewton().__newImagePixelDataBuffer();
}
