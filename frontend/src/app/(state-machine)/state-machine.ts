import { MutableRefObject, useCallback, useRef } from "react";
import { setterPromise } from "../(util)/util";
import { getNewtonSync } from "../(wasm-wrapper)/consts";
import { State, RenderStateData, isRenderStateFinishedRendering, setRenderStateFinishedRendering } from "./data";
import { CanvasDrawFn } from "../(components)/canvas";
import { AppGeneralPropsRaw } from "../(components)/app-props";
import { newCalculatePassFn } from "./sm-calculate";
import { newRecolorPassFn } from "./sm-recolor";

// Main render loop here!
const renderFn = (context: CanvasRenderingContext2D, data: RenderStateData) => {
    data.fns.prePassFn(data, context);
    if (isRenderStateFinishedRendering(data)) return;

    const msPerFrame = 1000 / 60.0;

    const start = performance.now();
    let count = 0;
    let avgMsPerFrame = 0;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
        if (!data.fns.passFn(data, context)) break;
        count += 1;
        const duration = performance.now() - start;
        avgMsPerFrame = duration / count;
        if (duration + avgMsPerFrame >= msPerFrame) break;
    }
    if (isRenderStateFinishedRendering(data)) return;

    data.fns.postPassFn(data, context);
    if (isRenderStateFinishedRendering(data)) return;
}

export type RenderFn = (generalProps: AppGeneralPropsRaw, stateMachine: StateMachineProps) => void;
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

export type RenderFnToBool = (..._: Parameters<RenderFn>) => boolean;
export interface StateMachineInitFns {
    calculateNewPassFn: RenderFnToBool,
    recalculatePassFn: RenderFnToBool,
    recolorPassFn: RenderFnToBool,
    updateIsRenderingPassFn: typeof updateIsRenderingPassFn,
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

    // Bit of a special case here, as we need to recalculate if we're not done the
    // full calculations. This is because the PDB won't have been filled out completely
    const _recolorPassFn = newRecolorPassFn(postSetupFn);
    const recolorPassFn = (generalProps: AppGeneralPropsRaw, stateMachine: StateMachineProps) => {
        const data = stateMachine.data.current;
        if (!data) return false;
        if (data.state == State.RENDER_PASS) { return recalculatePassFn(generalProps, stateMachine); }
        return _recolorPassFn(generalProps, stateMachine);
    };

    const initFns: StateMachineInitFns = { calculateNewPassFn, recalculatePassFn, recolorPassFn, updateIsRenderingPassFn };

    return { initFns, onDone };
}

const updateIsRenderingPassFn = (stateMachine: StateMachineProps, isRendering: boolean) => {
    const { data } = stateMachine;
    if (data.current) {
        data.current.generalProps.isRendering = isRendering;
    }
}
