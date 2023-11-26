'use client';
import styles from './page.module.css';
import { Canvas } from './(util)/canvas';
import { useValue } from './(util)/valued';
import { useFractalDraw } from './(newton)/render-loop';
import { getNewtonAsync, getNewtonSync, isValidFormula, wasmMemoryUsage } from './(newton)/newton-interface';
import { ChangeEvent, WheelEvent, MouseEvent, useEffect, useRef } from 'react';
import { useDeferredFnExec } from './(util)/deferred-fn';
import { classNames } from './(util)/util';

export default function Home() {
    const props = useFractals();
    const { onChangeFormula, onChangeDropoff, onWheel, onMouseMove } = useOnChanges(props);
    const { drawFn, isRendering, formula, dropoff, render } = props;
    // _useLogMemory();

    const renderStyle = isRendering.value ? styles.isRendering : styles.notRendering;
    const formulaStyle = classNames(styles, ['formula', !isValidFormula(formula.value) ? 'badFormula' : '']);

    return (
        <main className={styles.main}>
            <div className={styles.settingsStatus}>
                <div className={styles.settings}>
                    <select value={formula.value} onChange={onChangeFormula}>
                        {defaultPolynomials.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <input className={formulaStyle} value={formula.value} onChange={onChangeFormula} />
                    <div className={styles.labelRange}>
                        <label>Brightness Dropoff:</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={dropoff.value} onChange={onChangeDropoff}
                        />
                    </div>
                </div>
                <div><button onClick={render}>Render</button></div>
                <div className={styles.status}>
                    <div className={styles.frameRate}>
                        {isRendering.value && <label>Rendering...</label>}
                        <div className={renderStyle} />
                    </div>
                </div>
            </div>
            <Canvas drawFn={drawFn} className={styles.fractal} onWheel={onWheel} onMouseMove={onMouseMove} width={800} height={800} />
        </main>
    )
}

const useFractals = () => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { console.clear(); void getNewtonAsync().then(() => { renderFn() }); }, []);
    const { drawFn, startRender, onDone } = useFractalDraw();
    const formula = useValue(defaultPolynomials[0]);
    const dropoff = useValue(1.0);
    const isRendering = useValue(false);
    const zoom = useRef(0.0);
    const center = useRef<[number, number]>([0, 0]);

    // void onDone.then(_duration => { console.log('Rendered:', _duration); isRendering.value = false; });
    void onDone.then(_duration => { isRendering.value = false; });

    const renderFn = () => {
        isRendering.value = true;
        const _dropoff = lerp(dropoff.value, 1.0, 0.15);
        startRender(formula.value, _dropoff, zoom.current, center.current);
    };
    const render = useDeferredFnExec(0.2, renderFn);
    const renderNow: () => void = renderFn;

    return { drawFn, isRendering, render, renderNow, formula, dropoff, zoom, center };
}

const useOnChanges = (props: ReturnType<typeof useFractals>) => {
    const { formula, dropoff, isRendering, zoom, center, render, renderNow } = props;

    const onChangeFormula = (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        formula.value = e.target.value;
        zoom.current = 0.0;
        center.current[0] = 0;
        center.current[1] = 0;
        render();
    };

    const onChangeDropoff = (e: ChangeEvent<HTMLInputElement>) => {
        dropoff.value = Number.parseFloat(e.target.value);
        render();
    }

    const onWheel = (e: WheelEvent<HTMLCanvasElement>) => {
        const zoomAdjust = -e.deltaY / 1000;
        zoom.current += zoomAdjust;
        render();
    }

    const prevData = useRef({ mouseDown: false });
    const onMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if ((e.buttons & 1) == 0) {
            prevData.current.mouseDown = false;
            return;
        }

        const newton = getNewtonSync();
        if (!newton) return;

        const unitsPerPixelBase = 2 * newton.complexWindow() / newton.canvasSize();
        const unitsPerPixel = unitsPerPixelBase * Math.pow(2, -zoom.current);

        center.current[0] += e.movementX * unitsPerPixel;
        center.current[1] += e.movementY * unitsPerPixel;
        isRendering.value = false;
        renderNow();
    }

    return { onChangeFormula, onChangeDropoff, onWheel, onMouseMove };
}

const _useLogMemory = () => {
    useEffect(() => {
        const fn = () => {
            const memoryUsage = wasmMemoryUsage();
            if (memoryUsage) console.log(`WASM memory usage: ${(memoryUsage / 1000000).toFixed(2)} MB`);
            reTimeout();
        }

        const reTimeout = () => setTimeout(fn, 1000);
        reTimeout();
    }, []);
}

const lerp = (v: number, a: number, b: number) => a + v * (b - a);

const defaultPolynomials = [
    'z^13 - 3*z^6 + z - 1',
    'z^5 + 3z^3 + z + 3',
    '2z^11 - 2z^7 + 4z^6 + 4z^5 - 4z^4 - 3z - 2',
    '-2z^10 + 3z^8 + z^6 + z^4 + 4z^2 + 5z + 4',
    'z^10 + z^8 - 2z^2 + 1',
    '-3z^10 - 4z^4 + z^2 - 2z - 4',
    '-2z^6 - 3z^3 - z + 5',
    '-z^9 + 4z^5 - 4z',
    'z^7 - 4z^2 + 2z - 3',
    'z^4 - 3z^2 - 4',
    'z^4 - 3z^2 + 3',
    'z^4 + 3z^2 + 3',

    'z^4 - 6z^2 - 11',
    'z^4 + 6z^2 - 11',
    '-z^4 + 6z^2 - 11',
    '-z^4 - 6z^2 - 11',

    'z^3 - 2z + 2',

    '2z^4 + z^3 + 4z + 4',
    'z^4 + 3z+3',
    'z^4 - 4z^3 - 9z+27',

    'z^6 - 4*z^4 + 4*z^2 - 4',
];