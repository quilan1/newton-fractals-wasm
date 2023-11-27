/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Point, invert, translate } from "../../(util)/transform";
import { getCanvasSize, getUnitsPerPixel } from "./consts";

export const unitToPixelTransform = (zoom: number, center: Point) => {
    return invert(canvasToUnitTransform(zoom, center));
}

export const toCanvasCenter = () => {
    const canvasSize = getCanvasSize();
    return translate({ x: -canvasSize / 2, y: -canvasSize / 2 });
}

export const canvasToUnitTransform = (zoom: number, center: Point) => {
    return {
        scale: getUnitsPerPixel() * Math.pow(2, -zoom),
        translate: center,
    }
}

export const unitToCanvasTransform = (zoom: number, center: Point) => {
    return invert(canvasToUnitTransform(zoom, center));
}
