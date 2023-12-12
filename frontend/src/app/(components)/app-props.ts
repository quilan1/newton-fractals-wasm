import { transformIdent } from "../(util)/transform";
import { FromValued, devalue, useValue } from "../(util)/valued";
import { IterRootMethod, LightnessMode, NonConvergence } from "../(wasm-wrapper)/structs";
import { defaultPolynomials } from "./settings";
import { RenderFnToBool, StateMachineProps, useStateMachine } from "../(state-machine)/state-machine";
import { useEffect, useRef } from "react";
import { ColorScheme } from "../(state-machine)/render";
import { useEventListener } from "../(util)/util";
import { DebouncedFunc, throttle } from "lodash";

export type AppGeneralProps = ReturnType<typeof useAppGeneralProps>;
export type AppGeneralPropsRaw = FromValued<AppGeneralProps>;

export const useAppGeneralProps = () => {
    const isRendering = useValue(false);
    const formula = useValue(defaultPolynomials[0]);
    const iterMethod = useValue(IterRootMethod.NewtonsMethod);
    const curPoint = useValue("");
    const transform = useValue(transformIdent());
    const lightnessMode = useValue(LightnessMode.Normal);
    const nonConvergence = useValue(NonConvergence.Black);
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

    return {
        isRendering, formula, iterMethod, curPoint, transform, lightnessMode, nonConvergence,
        colorScheme, hueOffset, chromaticity, dropoff, renderRoots, staticHues,
    };
}

export const useAppProps = () => {
    const generalProps = useAppGeneralProps();
    const stateMachine = useStateMachine();
    useGeneralPropTriggers(generalProps, stateMachine);

    return { generalProps, stateMachine };
}

/* eslint-disable react-hooks/exhaustive-deps */
const useGeneralPropTriggers = (props: AppGeneralProps, stateMachine: StateMachineProps) => {
    // Because there are cases where multiple types of property change at the same time, these are ranked in a
    // sort of priority system. Things at the end are most important.

    const triggeredFn = useRef<DebouncedFunc<RenderFnToBool>>();
    const triggerFn = (fn: RenderFnToBool) => {
        triggeredFn.current?.cancel();
        const _fn = throttle(fn);
        triggeredFn.current = _fn;
        props.isRendering.value = !!_fn(devalue(props), stateMachine);
    }

    // Recolor the existing PDB
    useEffect(() => { triggerFn(stateMachine.initFns.recolorPassFn); }, [
        props.lightnessMode.value, props.nonConvergence.value,
        props.colorScheme.value, props.hueOffset.value, props.chromaticity.value,
        props.dropoff.value, props.renderRoots.value, props.staticHues.value,
    ]);

    // Recalculate the existing formula / roots
    useEffect(() => { triggerFn(stateMachine.initFns.recalculatePassFn); }, [
        props.transform.value.scale, props.transform.value.translate,
    ]);

    // Calculate from the start, with fresh formula / roots
    useEffect(() => { triggerFn(stateMachine.initFns.calculateNewPassFn); }, [
        props.formula.value, props.iterMethod.value
    ]);
}
/* eslint-enable react-hooks/exhaustive-deps */

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
