import assert from "assert";
import { MutableRefObject, useCallback, useRef } from "react";
import { setterPromise } from "../(util)/util";
import { drawRoots, recolorCanvasRow, renderToCanvasRow, setRootColors } from "./render";
import { getNewtonSync } from "../(wasm-wrapper)/consts";
import { RenderPassFn, State, RenderStateData, StateMachineFns, freeFractalData, isRenderStateFinishedRendering, newFractalData, newRenderData, setRenderStateFinishedRendering } from "./data";
import { CanvasDrawFn } from "../(components)/canvas";
import { AppGeneralProps } from "../(components)/app-props";

// Main render loop here!
const renderFn = (context: CanvasRenderingContext2D, data: RenderStateData) => {
    data.fns.prePassFn(data, context);
    if (isRenderStateFinishedRendering(data)) return;

    const msPerFrame = 1000 / 60.0;

    const start = Date.now();
    while (Date.now() - start < msPerFrame) {
        if (!data.fns.passFn(data, context)) break;
    }
    if (isRenderStateFinishedRendering(data)) return;

    data.fns.postPassFn(data, context);
    if (isRenderStateFinishedRendering(data)) return;
}

export type RenderFn = (generalProps: AppGeneralProps, stateMachine: StateMachineProps) => void;
export type StateMachineDataRef = MutableRefObject<RenderStateData | undefined>;

export type StateMachineProps = ReturnType<typeof useStateMachine>;
export const useStateMachine = () => {
    const data = useRef<RenderStateData | undefined>(undefined);
    const initFns = useStateMachineDrawFns();

    const stepFn = useCallback<CanvasDrawFn>((context: CanvasRenderingContext2D) => {
        if (!data.current) return;
        if (isRenderStateFinishedRendering(data.current)) return;
        if (!data.current.renderData) return;
        if (!getNewtonSync()) return;
        renderFn(context, data.current);
    }, []);

    return { data, stepFn, initFns };
}

const useStateMachineDrawFns = () => {
    const [setDone, onDone] = setterPromise<number>();

    const startTime = useRef(Date.now());
    const [startRenderFn, recolorRenderFn] = useRenderFns((data: RenderStateData) => {
        const prePassFn = data.fns.prePassFn;
        data.fns.prePassFn = (data: RenderStateData, context: CanvasRenderingContext2D) => {
            if (data.state != State.DONE) { prePassFn(data, context); return }

            setDone(Date.now() - startTime.current);
            setRenderStateFinishedRendering(data);
        }
        startTime.current = Date.now();
    });

    return { startRenderFn, recolorRenderFn, onDone };
}

const useRenderFns = (postFn: (data: RenderStateData) => void): [RenderFn, RenderFn] => {
    const newRenderFn = useCallback((generalProps: AppGeneralProps, stateMachine: StateMachineProps) => {
        if (!getNewtonSync()) return;

        const { data } = stateMachine;
        if (data.current) freeFractalData(data.current.fractalData);

        const fns = newStateMachineFunctions();
        const renderData = newRenderData();
        const fractalData = newFractalData(generalProps);
        const state = State.RENDER_PASS;
        generalProps.isRendering.value = !!fractalData;

        data.current = { fns, generalProps, state, renderData, fractalData };
        postFn(data.current);
    }, [postFn]);

    const recolorFn = useCallback((generalProps: AppGeneralProps, stateMachine: StateMachineProps) => {
        const { data } = stateMachine;
        assert(data.current?.renderData != undefined && data.current.fractalData != undefined);

        data.current.generalProps = generalProps;
        data.current.renderData.row = 0;
        data.current.state = State.RECOLOR_PASS;
        data.current.generalProps.isRendering.value = true;

        setRootColors(generalProps, data.current.fractalData.roots);

        postFn(data.current);
    }, [postFn]);

    return [newRenderFn, recolorFn];
}

const newStateMachineFunctions = (): StateMachineFns => {
    return {
        prePassFn: renderPrePass,
        passFn: renderPass,
        postPassFn: postPass,
    };
}

const renderPrePass: RenderPassFn = (data: RenderStateData, _context: CanvasRenderingContext2D) => {
    if (data.state == State.DONE) return;
    if (!data.renderData || !data.fractalData) setRenderStateFinishedRendering(data);
}

const renderPass: RenderPassFn<boolean> = (data: RenderStateData, context: CanvasRenderingContext2D) => {
    if (data.state == State.DONE) return false;

    switch (data.state) {
        case State.RENDER_PASS:
            return renderPassRender(data, context);
        case State.RECOLOR_PASS:
            return renderPassRecolor(data, context);
        default:
            const curState: never = data.state;
            console.error("Invalid render state:", curState);
            return false;
    }
}

const renderPassRender: RenderPassFn<boolean> = (data: RenderStateData, context: CanvasRenderingContext2D) => {
    assert(!!data.renderData && !!data.fractalData);

    if (data.renderData.row >= context.canvas.height) {
        if (data.renderData.scaleFactor == 0) {
            data.state = State.DONE;
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
        data.state = State.DONE;
        return false;
    }

    recolorCanvasRow(data, context);
    data.renderData.row++;

    return true;
}

const postPass: RenderPassFn = (data: RenderStateData, context: CanvasRenderingContext2D) => {
    if (data.state == State.DONE) return;
    if (!data.generalProps.renderRoots.value) return;

    drawRoots(data, context);
}
