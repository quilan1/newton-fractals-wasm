import assert from "assert";
import { AppGeneralPropsRaw } from "../(components)/app-props";
import { getNewtonSync } from "../(wasm-wrapper)/consts";
import { RenderPassFn, RenderStateData, State, StateMachineFns, resetFractalData, newRenderData, setRenderStateFinishedRendering } from "./data";
import { StateMachineProps } from "./state-machine";
import { drawRoots, renderToCanvasRow } from "./render";
import { isValidFormula } from "../(wasm-wrapper)/util";

export const newCalculatePassFn = (postSetupFn: (data: RenderStateData) => void, recalculate: boolean) => {
    return (generalProps: AppGeneralPropsRaw, stateMachine: StateMachineProps) => {
        if (!getNewtonSync()) return false;
        if (!isValidFormula(generalProps.formula)) return false;

        const { data } = stateMachine;
        const fns: StateMachineFns = { prePassFn, passFn, postPassFn };
        const renderData = newRenderData();
        const fractalData = resetFractalData(data.current?.fractalData, generalProps, recalculate);
        const state = State.RENDER_PASS;
        generalProps.isRendering = !!fractalData;

        data.current = { fns, generalProps, state, renderData, fractalData };
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

const postPassFn: RenderPassFn = (data: RenderStateData, context: CanvasRenderingContext2D) => {
    if (data.state == State.DONE) return;
    if (!data.generalProps.renderRoots) return;

    drawRoots(data, context);
}
