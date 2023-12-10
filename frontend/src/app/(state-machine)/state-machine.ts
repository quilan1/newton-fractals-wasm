import { MutableRefObject, useCallback, useRef } from "react";
import { setterPromise } from "../(util)/util";
import { getNewtonSync } from "../(wasm-wrapper)/consts";
import { State, RenderStateData, isRenderStateFinishedRendering, setRenderStateFinishedRendering } from "./data";
import { CanvasDrawFn } from "../(components)/canvas";
import { AppGeneralProps } from "../(components)/app-props";
import { newCalculatePassFn } from "./sm-calculate";
import { newRecolorPassFn } from "./sm-recolor";

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
    const { initFns, onDone } = useStateMachineInitFns();

    const stepFn = useCallback<CanvasDrawFn>((context: CanvasRenderingContext2D) => {
        if (!data.current) return;
        if (isRenderStateFinishedRendering(data.current)) return;
        if (!data.current.renderData) return;
        if (!getNewtonSync()) return;
        renderFn(context, data.current);
    }, []);

    return { data, stepFn, initFns, onDone };
}

export interface StateMachineInitFns {
    calculateNewPassFn: RenderFn,
    recalculatePassFn: RenderFn,
    recolorPassFn: RenderFn,
}

const useStateMachineInitFns = () => {
    const [setDone, onDone] = setterPromise<number>();

    const startTime = useRef(Date.now());
    const postSetupFn = (data: RenderStateData) => {
        const prePassFn = data.fns.prePassFn;
        data.fns.prePassFn = (data: RenderStateData, context: CanvasRenderingContext2D) => {
            if (data.state != State.DONE) { prePassFn(data, context); return }

            setDone(Date.now() - startTime.current);
            setRenderStateFinishedRendering(data);
        }
        startTime.current = Date.now();
    };

    const calculateNewPassFn = newCalculatePassFn(postSetupFn, true);
    const recalculatePassFn = newCalculatePassFn(postSetupFn, false);
    const recolorPassFn = newRecolorPassFn(postSetupFn);
    const initFns: StateMachineInitFns = { calculateNewPassFn, recalculatePassFn, recolorPassFn };

    return { initFns, onDone };
}
