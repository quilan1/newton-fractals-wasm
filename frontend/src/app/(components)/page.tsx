'use client';
import styles from './page.module.css';
import { useValue } from '../(util)/valued';
import { useFractalDraw } from '../(render)/state-machine';
import { useRef } from 'react';
import { useDeferredFnExec } from '../(util)/deferred-fn';
import { lerp, useAsyncOnce } from '../(util)/util';
import { transformIdent, } from '../(util)/transform';
import { initWasmNewtonAsync } from '../(wasm-wrapper)/consts';
import { isValidFormula } from '../(wasm-wrapper)/util';
import { Settings, defaultPolynomials } from './settings';
import { Status } from './status';
import { Canvas } from './canvas';

export default function Home() {
    const props = useFractals();

    return (
        <main className={styles.main}>
            <div className={styles.appContainer}>
                <div className={styles.settingsStatusContainer}>
                    <Settings {...props} />
                    <Status {...props} />
                </div>
                <Canvas {...props} />
            </div>
        </main>
    );
}

export type FractalParams = ReturnType<typeof useFractals>;
const useFractals = () => {
    const { drawFn, startRender, onDone } = useFractalDraw();
    const formula = useValue(defaultPolynomials[0]);
    const curPoint = useValue("");
    const dropoff = useValue(1.0);
    const isRendering = useValue(false);
    const transform = useRef(transformIdent());
    const renderRoots = useValue(true);

    // void onDone.then(_duration => { console.log('Rendered:', _duration); isRendering.value = false; });
    void onDone.then(_duration => { isRendering.value = false; });

    const renderNow = () => {
        if (!isValidFormula(formula.value)) return;
        isRendering.value = true;
        const _dropoff = lerp(dropoff.value, 1.0, 0.15);
        startRender(formula.value, _dropoff, transform.current, renderRoots.value);
    };
    const render = useDeferredFnExec(0.2, renderNow);

    useInitializePage(renderNow);

    return { drawFn, render, renderNow, isRendering, formula, curPoint, dropoff, transform, renderRoots };
}

const useInitializePage = (fn: () => void) => {
    useAsyncOnce(async () => {
        console.clear();
        await initWasmNewtonAsync();
        fn();
    });
}
