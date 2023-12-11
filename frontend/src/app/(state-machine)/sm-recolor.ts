import assert from "assert";
import { AppGeneralPropsRaw } from "../(components)/app-props";
import { getNewtonSync } from "../(wasm-wrapper)/consts";
import { RenderPassFn, RenderStateData, State, newRenderData, setRenderStateFinishedRendering } from "./data";
import { StateMachineProps } from "./state-machine";
import { drawRoots, recolorCanvasRow, setRootColors } from "./render";
import { isValidFormula } from "../(wasm-wrapper)/util";

export const newRecolorPassFn = (postSetupFn: (data: RenderStateData) => void) => {
    return (generalProps: AppGeneralPropsRaw, stateMachine: StateMachineProps) => {
        if (!getNewtonSync()) return false;

        const { data } = stateMachine;
        assert(data.current?.renderData != undefined && data.current.fractalData != undefined);
        if (!isValidFormula(data.current.generalProps.formula)) return false;

        data.current.fns = { prePassFn, passFn, postPassFn };
        data.current.generalProps = generalProps;
        data.current.renderData = newRenderData(0);
        data.current.state = State.RECOLOR_PASS;
        data.current.generalProps.isRendering = true;

        setRootColors(generalProps, data.current.fractalData.roots);

        postSetupFn(data.current);
        return true;
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
    if (!data.generalProps.renderRoots) return;

    drawRoots(data, context);
}
