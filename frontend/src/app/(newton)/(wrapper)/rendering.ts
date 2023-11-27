import { PixelDataBuffer, Polynomial, Roots } from "@/pkg/newton_wasm";
import { getNewton } from "./consts";
import { Point } from "@/app/(util)/transform";

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
