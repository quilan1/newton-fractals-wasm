import { MutableRefObject, useCallback, useRef } from "react";
import { setterPromise } from "../(util)/util";
import { drawRoots, recolorCanvasRow, renderToCanvasRow, setRootColors } from "./render";
import { Transform } from "../(util)/transform";
import { getNewtonSync } from "../(wasm-wrapper)/consts";
import { RenderPassFn, RenderSettings, RenderState, RenderStateData, freeFractalData, isRenderStateFinishedRendering, newFractalData, newRenderData, setRenderStateFinishedRendering } from "./data";
import { CanvasDrawFn } from "../(components)/canvas";
import assert from "assert";
import { IterRootMethod } from "../(wasm-wrapper)/structs";

// Main render loop here!
const renderFn = (context: CanvasRenderingContext2D, data: RenderStateData) => {
    data.prePassFn(data, context);
    if (isRenderStateFinishedRendering(data)) return;

    const msPerFrame = 1000 / 60.0;

    const start = Date.now();
    while (Date.now() - start < msPerFrame) {
        if (!data.passFn(data, context)) break;
    }
    if (isRenderStateFinishedRendering(data)) return;

    data.postPassFn(data, context);
    if (isRenderStateFinishedRendering(data)) return;
}

export type RenderFn = (formula: string, iterMethod: IterRootMethod, transform: Transform, renderSettings: RenderSettings) => void;

export const useFractalDraw = () => {
    const [setDone, onDone] = setterPromise<number>();

    const data = useRef<RenderStateData | undefined>(undefined);
    const startTime = useRef(Date.now());
    const [startRender, recolorRender] = useRenderFns(data, (data: RenderStateData) => {
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

    return { drawFn, startRender, recolorRender, onDone, data: data.current };
}

const useRenderFns = (data: MutableRefObject<RenderStateData | undefined>, postFn: (data: RenderStateData) => void): [RenderFn, RenderFn] => {
    const newRenderFn = useCallback((formula: string, iterMethod: IterRootMethod, transform: Transform, renderSettings: RenderSettings) => {
        if (data.current == undefined) data.current = newRenderStateData();

        data.current.renderData = newRenderData(renderSettings);
        if (getNewtonSync()) {
            freeFractalData(data.current.fractalData);
            data.current.fractalData = newFractalData(formula, iterMethod, transform, renderSettings);
        }

        data.current.stateData = {
            curState: RenderState.RENDER_PASS,
            isRendering: !!data.current.fractalData,
        }

        postFn(data.current);
    }, [data, postFn]);

    const recolorFn = useCallback((_formula: string, _iterMethod: IterRootMethod, _transform: Transform, renderSettings: RenderSettings) => {
        assert(data.current?.renderData != undefined && data.current.fractalData != undefined);
        data.current.renderData.row = 0;
        data.current.renderData.renderSettings = renderSettings;
        data.current.stateData = {
            curState: RenderState.RECOLOR_PASS,
            isRendering: !!data.current.fractalData,
        }
        setRootColors(data.current.fractalData.roots, renderSettings);

        postFn(data.current);
    }, [data, postFn]);

    return [newRenderFn, recolorFn];
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

const renderPrePass: RenderPassFn = (data: RenderStateData, _context: CanvasRenderingContext2D) => {
    if (data.stateData.curState == RenderState.DONE) return;
    if (!data.renderData || !data.fractalData) setRenderStateFinishedRendering(data);
}

const renderPass: RenderPassFn<boolean> = (data: RenderStateData, context: CanvasRenderingContext2D) => {
    if (data.stateData.curState == RenderState.DONE) return false;

    switch (data.stateData.curState) {
        case RenderState.RENDER_PASS:
            return renderPassRender(data, context);
        case RenderState.RECOLOR_PASS:
            return renderPassRecolor(data, context);
        default:
            const curState: never = data.stateData.curState;
            console.error("Invalid render state:", curState);
            return false;
    }
}

const renderPassRender: RenderPassFn<boolean> = (data: RenderStateData, context: CanvasRenderingContext2D) => {
    assert(!!data.renderData && !!data.fractalData);

    if (data.renderData.row >= context.canvas.height) {
        if (data.renderData.scaleFactor == 0) {
            data.stateData.curState = RenderState.DONE;
            return false;
        }

        // Let's reset the render with a lower scaling factor
        data.renderData.row = 0;
        data.renderData.scaleFactor -= 1;
    }

    renderToCanvasRow(data, context);
    data.renderData.row += 1 << data.renderData.scaleFactor;

    return true;
}

const renderPassRecolor: RenderPassFn<boolean> = (data: RenderStateData, context: CanvasRenderingContext2D) => {
    assert(!!data.renderData && !!data.fractalData);

    if (data.renderData.row >= context.canvas.height) {
        data.stateData.curState = RenderState.DONE;
        return false;
    }

    recolorCanvasRow(data, context);
    data.renderData.row++;

    return true;
}

const postPass: RenderPassFn = (data: RenderStateData, context: CanvasRenderingContext2D) => {
    if (data.stateData.curState == RenderState.DONE) return;
    if (!(data.renderData?.renderSettings.renderRoots ?? false)) return;

    drawRoots(data, context);
}
