import { useCallback, useEffect, useRef } from "react";
import { useValue } from "../valued";
import { CanvasDrawFn } from "../canvas";
import { setterPromise } from "../util";
import { FractalData, newFractalData, postDraw, renderToCanvas } from "./newton";
import { getNewtonSync } from "./newton-interface";

interface Data {
    renderData: RenderData,
    fractalData?: FractalData,
}

export interface RenderData {
    isRendering: boolean,
    startTime: number,
    row: number,
    scale: number,
}

const newData = (): Data => {
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

const renderFn = (context: CanvasRenderingContext2D, data: Data) => {
    const desiredFrameRate = 60;
    const msPerFrame = 1000 / desiredFrameRate;

    if (!data.fractalData) {
        console.log('No fractal data, for some reason, aborting');
        data.renderData.isRendering = false;
        return;
    }

    if (data.renderData.row >= context.canvas.height) {
        if (data.renderData.scale == 1) {
            postDraw(context, data.fractalData);
            data.renderData.isRendering = false;
            return;
        }
        data.renderData.row = 0;
        data.renderData.scale /= 2;
    }

    const start = Date.now();
    let numFrames = 0;
    while (numFrames == 0 || (Date.now() - start < msPerFrame && data.renderData.row < context.canvas.height)) {
        renderToCanvas(context, data.renderData, data.fractalData);
        data.renderData.row += data.renderData.scale;
        numFrames += 1;
    }

    const frameRate = (Date.now() - start) / numFrames;
    return { frameRate, numFrames };
}

export const useFractalDraw = () => {
    const data = useRef(newData());
    const startRender = useCallback((formula: string) => {
        data.current.renderData = newRenderData();
        if (getNewtonSync()) { data.current.fractalData = newFractalData(formula); }
    }, []);

    const frameRateStr = useValue('');
    const [setDone, onDone] = setterPromise<number>();

    useEffect(() => { getNewtonSync() });

    const drawFn = useCallback<CanvasDrawFn>((context: CanvasRenderingContext2D | null) => {
        if (context == null || !data.current.renderData.isRendering || !getNewtonSync()) return;

        const result = renderFn(context, data.current);
        if (!result) {
            setDone(Date.now() - data.current.renderData.startTime);
            return;
        }

        const { numFrames, frameRate } = result;
        frameRateStr.value = `${numFrames} rows/frame, ${frameRate.toFixed(2)} ms`;
    }, [setDone, frameRateStr]);

    return { drawFn, frameRate: frameRateStr, startRender, onDone };
}
