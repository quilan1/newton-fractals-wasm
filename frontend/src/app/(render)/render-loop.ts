import { useCallback, useRef } from "react";
import { CanvasDrawFn } from "../(util)/animated-canvas";
import { setterPromise } from "../(util)/util";
import { FractalData, freeFractalData, newFractalData, postDraw, renderToCanvasRow } from "./render";
import { Transform } from "../(util)/transform";
import { getNewtonSync } from "../(wasm-wrapper)/consts";

interface RenderStateData {
    renderData: RenderData,
    fractalData?: FractalData,
}

export interface RenderData {
    isRendering: boolean,
    startTime: number,
    row: number,
    scale: number,
}

const newRenderStateData = (): RenderStateData => {
    const renderData = newRenderData();
    renderData.isRendering = false;
    return { renderData };
}

const newRenderData = () => ({
    isRendering: true,
    startTime: Date.now(),
    row: 0,
    scale: 32
});

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
        renderToCanvasRow(context, data.renderData, data.fractalData);
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