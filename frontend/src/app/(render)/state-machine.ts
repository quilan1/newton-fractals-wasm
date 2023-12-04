import { MutableRefObject, useCallback, useRef } from "react";
import { setterPromise } from "../(util)/util";
import { drawRoots, renderToCanvasRow } from "./render";
import { Transform } from "../(util)/transform";
import { getNewtonSync } from "../(wasm-wrapper)/consts";
import { RenderPassFn, RenderSettings, RenderState, RenderStateData, freeFractalData, isRenderStateFinishedRendering, newFractalData, newRenderData, setRenderStateFinishedRendering } from "./data";
import { CanvasDrawFn } from "../(components)/canvas";
import assert from "assert";

const renderFn = (context: CanvasRenderingContext2D, data: RenderStateData) => {
    data.prePassFn(data, context);
    if (isRenderStateFinishedRendering(data)) return;

    data.passFn(data, context);
    if (isRenderStateFinishedRendering(data)) return;

    data.postPassFn(data, context);
    if (isRenderStateFinishedRendering(data)) return;
}

export type RenderFn = (formula: string, transform: Transform, renderSettings: RenderSettings) => void;

export const useFractalDraw = () => {
    const [setDone, onDone] = setterPromise<number>();

    const data = useRef<RenderStateData | undefined>(undefined);
    const startTime = useRef(Date.now());
    const startRender = useNewRenderFn(data, (data: RenderStateData) => {
        const prePassFn = data.prePassFn;
        data.prePassFn = (data: RenderStateData, context: CanvasRenderingContext2D) => {
            if (data.stateData.curState != RenderState.DONE) { prePassFn(data, context); return }

            setDone(Date.now() - startTime.current);
            setRenderStateFinishedRendering(data);
        }
        startTime.current = Date.now();
    });

    const drawFn = useCallback<CanvasDrawFn>((context: CanvasRenderingContext2D) => {
        if (!data.current) return;
        if (isRenderStateFinishedRendering(data.current)) return;
        if (!data.current.renderData) return;
        if (!getNewtonSync()) return;
        renderFn(context, data.current);
    }, []);

    return { drawFn, startRender, onDone, data: data.current };
}

const useNewRenderFn = (data: MutableRefObject<RenderStateData | undefined>, postFn: (data: RenderStateData) => void) => {
    return useCallback((formula: string, transform: Transform, renderSettings: RenderSettings) => {
        if (data.current == undefined) data.current = newRenderStateData();

        data.current.renderData = newRenderData(renderSettings);
        if (getNewtonSync()) {
            freeFractalData(data.current.fractalData);
            data.current.fractalData = newFractalData(formula, transform, renderSettings);
        }

        data.current.stateData = {
            curState: RenderState.RENDER_PASS,
            isRendering: !!data.current.fractalData,
        }

        postFn(data.current);
    }, [data, postFn]);
}

const newRenderStateData = (): RenderStateData => {
    return {
        prePassFn: renderPrePass,
        passFn: renderPass,
        postPassFn: postPass,
        stateData: {
            curState: RenderState.DONE,
            isRendering: false,
        }
    };
}

const renderPrePass: RenderPassFn = (data: RenderStateData, context: CanvasRenderingContext2D) => {
    if (data.stateData.curState != RenderState.RENDER_PASS) return;

    if (!data.renderData || !data.fractalData) {
        setRenderStateFinishedRendering(data);
        return;
    }

    // If we're still rendering rows, bail now
    if (data.renderData.row < context.canvas.height) return;

    // If we've finished a full render, and we've reached the final scaling factor
    if (data.renderData.scaleFactor == 0) {
        data.stateData.curState = RenderState.DONE;
        return;
    }

    // Let's reset the render with a lower scaling factor
    data.renderData.row = 0;
    data.renderData.scaleFactor -= 1;
}

const renderPass: RenderPassFn = (data: RenderStateData, context: CanvasRenderingContext2D) => {
    if (data.stateData.curState != RenderState.RENDER_PASS) return;

    assert(!!data.renderData && !!data.fractalData);
    const msPerFrame = 1000 / 60.0;

    const start = Date.now();
    let numFrames = 0;
    while (numFrames == 0 || (Date.now() - start < msPerFrame && data.renderData.row < context.canvas.height)) {
        renderToCanvasRow(data, context);
        data.renderData.row += 1 << data.renderData.scaleFactor;
        numFrames += 1;
    }
}

const postPass: RenderPassFn = (data: RenderStateData, context: CanvasRenderingContext2D) => {
    if (data.stateData.curState != RenderState.RENDER_PASS) return;
    if (!(data.renderData?.renderSettings.renderRoots ?? false)) return;

    drawRoots(data, context);
}
