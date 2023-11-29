import { useCallback, useRef } from "react";
import { CanvasDrawFn } from "../(util)/animated-canvas";
import { setterPromise } from "../(util)/util";
import { postDraw, renderToCanvasRow } from "./render";
import { Transform } from "../(util)/transform";
import { getNewtonSync } from "../(wasm-wrapper)/consts";
import { RenderStateData, freeFractalData, newFractalData, newRenderData, newRenderStateData } from "./data";

const renderFn = (context: CanvasRenderingContext2D, data: RenderStateData) => {
    const desiredFrameRate = 60;
    const msPerFrame = 1000 / desiredFrameRate;

    if (!data.fractalData) {
        data.renderData.isRendering = false;
        return;
    }

    if (data.renderData.row >= context.canvas.height) {
        if (data.renderData.scale == 1) {
            data.renderData.isRendering = false;
            return;
        }
        data.renderData.row = 0;
        data.renderData.scale /= 2;
    }

    const start = Date.now();
    let numFrames = 0;
    while (numFrames == 0 || (Date.now() - start < msPerFrame && data.renderData.row < context.canvas.height)) {
        renderToCanvasRow(context, data);
        data.renderData.row += data.renderData.scale;
        numFrames += 1;
    }
    postDraw(context, data.fractalData);

    const frameRate = (Date.now() - start) / numFrames;
    return { frameRate, numFrames };
}

export type RenderFn = (formula: string, dropoff: number, transform: Transform) => void;

export const useFractalDraw = () => {
    const data = useRef(newRenderStateData());
    const startRender: RenderFn = useCallback((formula: string, dropoff: number, transform: Transform) => {
        data.current.renderData = newRenderData();
        if (getNewtonSync()) {
            freeFractalData(data.current.fractalData);
            data.current.fractalData = newFractalData(formula, dropoff, transform);
        }
        if (!data.current.fractalData)
            data.current.renderData.isRendering = false;
    }, []);

    const [setDone, onDone] = setterPromise<number>();

    const drawFn = useCallback<CanvasDrawFn>((context: CanvasRenderingContext2D) => {
        if (!data.current.renderData.isRendering || !getNewtonSync()) return;

        const result = renderFn(context, data.current);
        if (!result) {
            setDone(Date.now() - data.current.renderData.startTime);
            return;
        }
    }, [setDone]);

    return { drawFn, startRender, onDone, data: data.current };
}
