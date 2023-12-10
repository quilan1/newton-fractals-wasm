import { State } from "../(state-machine)/data";
import { transformIdent } from "../(util)/transform";
import { useValue } from "../(util)/valued";
import { IterRootMethod } from "../(wasm-wrapper)/structs";
import { defaultPolynomials } from "./settings";
import { RenderFn, StateMachineInitFns, StateMachineProps, useStateMachine } from "../(state-machine)/state-machine";
import { isValidFormula } from "../(wasm-wrapper)/util";
import { useEffect } from "react";
import { ColorScheme } from "../(state-machine)/render";
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
    const stateMachineInitFns = useStateMachineInitFns(generalProps, stateMachine);
    useGeneralPropTriggers(generalProps, stateMachineInitFns);

    return { generalProps, stateMachine, calculateNewPassFn: stateMachineInitFns.calculateNewPassFn };
}

/* eslint-disable react-hooks/exhaustive-deps */
const useGeneralPropTriggers = (props: AppGeneralProps, initFns: ToVoidFn<StateMachineInitFns>) => {
    // Because there are cases where multiple types of property change at the same time, these are ranked in a
    // sort of priority system. Things at the end are most important.

    const triggeredFn = useValue<() => void>();
    const triggerFn = (fn: () => void) => {
        triggeredFn.value = fn;
    }

    // Recolor the existing PDB
    useEffect(() => { triggerFn(initFns.recolorPassFn); }, [
        props.colorScheme.value, props.hueOffset.value, props.chromaticity.value,
        props.dropoff.value, props.renderRoots.value, props.staticHues.value,
    ]);

    // Recalculate the existing formula / roots
    useEffect(() => { triggerFn(initFns.recalculatePassFn); }, [
        props.transform.value.scale, props.transform.value.translate,
    ]);

    // Calculate from the start, with fresh formula / roots
    useEffect(() => { triggerFn(initFns.calculateNewPassFn); }, [
        props.formula.value, props.iterMethod.value
    ]);

    useEffect(() => {
        if (!triggeredFn.value) return;
        const fn = triggeredFn.value;
        triggeredFn.value = undefined;
        fn();
    }, [triggeredFn.value])
}
/* eslint-enable react-hooks/exhaustive-deps */

type ToVoidFn<T extends object> = { [K in keyof T]: () => void };
const useStateMachineInitFns = (generalProps: AppGeneralProps, stateMachine: StateMachineProps): ToVoidFn<StateMachineInitFns> => {
    const { formula, isRendering } = generalProps;

    const newStateMachinePass = (fn: RenderFn) => {
        if (!isValidFormula(formula.value)) return;
        isRendering.value = true;
        fn(generalProps, stateMachine);
    }

    type VoidInitFns = ToVoidFn<StateMachineInitFns>;
    const initFns: VoidInitFns = {} as VoidInitFns;
    for (const [k, fn] of Object.entries(stateMachine.initFns)) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        (initFns as Record<string, RenderFn>)[k] = () => { newStateMachinePass(fn as RenderFn) };
    }

    // Bit of a special case here, as we need to recalculate if we're not done the
    // full calculations. This is because the PDB won't have been filled out completely
    initFns.recolorPassFn = () => {
        const data = stateMachine.data.current;
        if (!data) return;
        if (data.state == State.RENDER_PASS) { initFns.recalculatePassFn(); return; }
        newStateMachinePass(stateMachine.initFns.recolorPassFn)
    };

    return initFns;
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
