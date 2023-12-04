'use client';
import styles from './page.module.css';
import { Valueded, useValue } from '../(util)/valued';
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
import { ColorScheme, RenderSettings, RenderState } from '../(render)/data';

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
    const { drawFn, startRender, recolorRender, onDone, data } = useFractalDraw();
    const formula = useValue(defaultPolynomials[0]);
    const curPoint = useValue("");
    const isRendering = useValue(false);
    const transform = useRef(transformIdent());
    const colorScheme = useValue(ColorScheme.CONTRASTING_HUES);
    const hueOffset = useValue(0.0);
    const chromaticity = useValue(0.5);
    const dropoff = useValue(1.0);
    const renderRoots = useValue(false);
    const staticHues = useValue(false);

    // void onDone.then(_duration => { console.log('Rendered:', _duration); isRendering.value = false; });
    void onDone.then(_duration => { isRendering.value = false; });

    const renderNow = () => {
        if (!isValidFormula(formula.value)) return;
        isRendering.value = true;
        const _dropoff = lerp(dropoff.value, 1.0, 0.15);
        const renderSettings: RenderSettings = {
            colorScheme: colorScheme.value,
            hueOffset: hueOffset.value,
            chromaticity: chromaticity.value,
            dropoff: _dropoff,
            renderRoots: renderRoots.value,
            staticHues: staticHues.value,
        };
        startRender(formula.value, transform.current, renderSettings);
    };
    const render = useDeferredFnExec(0.2, renderNow);

    const recolorNow = () => {
        if (!isValidFormula(formula.value)) return;
        if (data?.stateData.curState == RenderState.RENDER_PASS) { renderNow(); return; }

        isRendering.value = true;
        const _dropoff = lerp(dropoff.value, 1.0, 0.15);
        const renderSettings: RenderSettings = {
            colorScheme: colorScheme.value,
            hueOffset: hueOffset.value,
            chromaticity: chromaticity.value,
            dropoff: _dropoff,
            renderRoots: renderRoots.value,
            staticHues: staticHues.value,
        };
        recolorRender(formula.value, transform.current, renderSettings);
    };
    const recolor = useDeferredFnExec(0.2, recolorNow);

    useInitializePage(renderNow);

    const renderSettings: Valueded<RenderSettings> = {
        dropoff,
        renderRoots,
        colorScheme,
        hueOffset,
        chromaticity,
        staticHues,
    };

    return { drawFn, render, renderNow, recolor, isRendering, formula, curPoint, transform, renderSettings };
}

const useInitializePage = (fn: () => void) => {
    useAsyncOnce(async () => {
        console.clear();
        await initWasmNewtonAsync();
        fn();
    });
}
