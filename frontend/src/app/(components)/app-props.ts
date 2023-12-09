import { RenderState } from "../(render)/data";
import { transformIdent } from "../(util)/transform";
import { useValue } from "../(util)/valued";
import { IterRootMethod } from "../(wasm-wrapper)/structs";
import { defaultPolynomials } from "./settings";
import { RenderFn, StateMachineProps, useStateMachine } from "../(render)/state-machine";
import { isValidFormula } from "../(wasm-wrapper)/util";
import { useDeferredFnExec } from "../(util)/deferred-fn";
import { useEffect } from "react";
import { ColorScheme } from "../(render)/render";
import { useEventListener } from "../(util)/util";

export type AppGeneralProps = ReturnType<typeof useAppGeneralProps>;
export const useAppGeneralProps = () => {
    const isRendering = useValue(false);
    const formula = useValue(defaultPolynomials[0]);
    const iterMethod = useValue(IterRootMethod.NewtonsMethod);
    const curPoint = useValue("");
    const transform = useValue(transformIdent());
    const colorScheme = useValue(ColorScheme.CONTRASTING_HUES);
    const hueOffset = useValue(0.0);
    const chromaticity = useValue(0.25);
    const dropoff = useValue(0.5);
    const renderRoots = useValue(false);
    const staticHues = useValue(false);

    useEffect(() => {
        transform.value = transformIdent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formula.value]);

    return { isRendering, formula, iterMethod, curPoint, transform, colorScheme, hueOffset, chromaticity, dropoff, renderRoots, staticHues };
}

export const useAppProps = () => {
    const generalProps = useAppGeneralProps();
    const stateMachine = useStateMachine();
    const appDrawFns = useAppDrawFns(generalProps, stateMachine);

    /* eslint-disable react-hooks/exhaustive-deps */

    // Render upon changes
    useEffect(() => { appDrawFns.renderFn(); }, [
        generalProps.formula.value, generalProps.transform.value.scale, generalProps.transform.value.translate,
        generalProps.iterMethod.value
    ]);

    // Recolor upon changes
    useEffect(() => { appDrawFns.recolorFn(); }, [
        generalProps.colorScheme.value, generalProps.hueOffset.value, generalProps.chromaticity.value,
        generalProps.dropoff.value, generalProps.renderRoots.value, generalProps.staticHues.value,
    ]);

    /* eslint-enable react-hooks/exhaustive-deps */

    return { generalProps, appDrawFns, stateMachine };
}

export const useAppDrawFns = (generalProps: AppGeneralProps, stateMachine: StateMachineProps) => {
    const { formula, isRendering } = generalProps;

    const beginRender = (fn: RenderFn) => {
        if (!isValidFormula(formula.value)) return;
        isRendering.value = true;
        fn(generalProps, stateMachine);
    }

    const renderNowFn = () => { beginRender(stateMachine.initFns.startRenderFn); };
    const renderFn = useDeferredFnExec(0.2, renderNowFn);

    const recolorNowFn = () => {
        const data = stateMachine.data.current;
        if (!data) return;
        if (data.stateData.curState == RenderState.RENDER_PASS) { renderNowFn(); return; }
        beginRender(stateMachine.initFns.recolorRenderFn);
    };
    const recolorFn = useDeferredFnExec(0.2, recolorNowFn);

    return { renderFn, renderNowFn, recolorFn };
}

export const useAppOnKeyDown = (props: AppGeneralProps) => {
    const { formula, iterMethod, curPoint, transform } = props;

    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    const onKeyDown = (e: KeyboardEvent) => {
        // Don't trigger this if we're typing in an input or something
        if (document.activeElement && document.activeElement != document.body) return;

        const iterRootMethods = Object.values(IterRootMethod);

        const indexPolynomial = defaultPolynomials.indexOf(formula.value);
        const indexIterMethod = iterRootMethods.indexOf(iterMethod.value as IterRootMethod);

        const setIndexPolynomial = (nextIndex: number) => {
            curPoint.value = "";
            transform.value = transformIdent();
            formula.value = defaultPolynomials[nextIndex];
        }

        const setindexIterMethod = (nextIndex: number) => {
            iterMethod.value = iterRootMethods[nextIndex];
        }

        if (e.key == 'ArrowLeft' && indexPolynomial > 0) {
            e.preventDefault();
            setIndexPolynomial(indexPolynomial - 1);
            return;
        } else if (e.key == 'ArrowRight' && indexPolynomial < defaultPolynomials.length - 1) {
            e.preventDefault();
            setIndexPolynomial(indexPolynomial + 1);
            return;
        } else if (e.key == 'ArrowUp' && indexIterMethod > 0) {
            e.preventDefault();
            setindexIterMethod(indexIterMethod - 1);
        } else if (e.key == 'ArrowDown' && indexIterMethod < iterRootMethods.length - 1) {
            e.preventDefault();
            setindexIterMethod(indexIterMethod + 1);
        }
    }

    /* eslint-enable @typescript-eslint/no-non-null-assertion */
    useEventListener('keydown', onKeyDown as EventListener, <Element,>() => { return window as unknown as Element });
}
