/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Transform, invert, translate } from "../../(util)/transform";
import { getCanvasSize, getUnitsPerPixel } from "./consts";

export const unitToPixelTransform = (transform: Transform) => {
    return invert(canvasToUnitTransform(transform));
}

export const toCanvasCenter = () => {
    const canvasSize = getCanvasSize();
    return translate({ x: -canvasSize / 2, y: -canvasSize / 2 });
}

export const canvasToUnitTransform = (transform: Transform) => {
    return {
        ...transform,
        scale: transform.scale * getUnitsPerPixel(),
    };
}

export const unitToCanvasTransform = (transform: Transform) => {
    return invert(canvasToUnitTransform(transform));
}
