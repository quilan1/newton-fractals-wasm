import assert from "assert";
import { AppGeneralProps } from "../(components)/app-props";
import { getNewtonSync } from "../(wasm-wrapper)/consts";
import { RenderPassFn, RenderStateData, State, newRenderData, setRenderStateFinishedRendering } from "./data";
import { RenderFn, StateMachineProps } from "./state-machine";
import { drawRoots, recolorCanvasRow, setRootColors } from "./render";

export const newRecolorPassFn = (postSetupFn: (data: RenderStateData) => void): RenderFn => {
    return (generalProps: AppGeneralProps, stateMachine: StateMachineProps) => {
        if (!getNewtonSync()) return;

        const { data } = stateMachine;
        assert(data.current?.renderData != undefined && data.current.fractalData != undefined);

        data.current.fns = { prePassFn, passFn, postPassFn };
        data.current.generalProps = generalProps;
        data.current.renderData = newRenderData(0);
        data.current.state = State.RECOLOR_PASS;
        data.current.generalProps.isRendering.value = true;

        setRootColors(generalProps, data.current.fractalData.roots);

        postSetupFn(data.current);
    }
}

const prePassFn: RenderPassFn = (data: RenderStateData, _context: CanvasRenderingContext2D) => {
    if (data.state == State.DONE) return;
    if (!data.renderData || !data.fractalData) { setRenderStateFinishedRendering(data); return; }
}

const passFn: RenderPassFn<boolean> = (data: RenderStateData, context: CanvasRenderingContext2D) => {
    if (data.state == State.DONE) return false;
    assert(!!data.renderData && !!data.fractalData);

    if (data.renderData.row >= context.canvas.height) {
        data.state = State.DONE;
        return false;
    }

    recolorCanvasRow(data, context);
    data.renderData.row++;
    return true;
}

const postPassFn: RenderPassFn = (data: RenderStateData, context: CanvasRenderingContext2D) => {
    if (data.state == State.DONE) return;
    if (!data.generalProps.renderRoots.value) return;

    drawRoots(data, context);
}
