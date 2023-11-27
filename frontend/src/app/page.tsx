'use client';
import styles from './page.module.css';
import { Canvas } from './(util)/canvas';
import { useValue } from './(util)/valued';
import { useFractalDraw } from './(newton)/render-loop';
import { ChangeEvent, WheelEvent, MouseEvent, useEffect, useRef } from 'react';
import { useDeferredFnExec } from './(util)/deferred-fn';
import { classNames } from './(util)/util';
import { Point, applyTransforms, } from './(util)/transform';
import { canvasToUnitTransform, toCanvasCenter as toCanvasCenterOrigin } from './(newton)/(wrapper)/transforms';
import { getNewtonAsync, getNewtonSync } from './(newton)/(wrapper)/consts';
import { isValidFormula, wasmMemoryUsage } from './(newton)/(wrapper)/util';

export default function Home() {
    const props = useFractals();
    const { onChangeFormula, onChangeDropoff, onWheel, onMouseMove, onMouseLeave } = useOnChanges(props);
    const { drawFn, isRendering, formula, dropoff, render, curPoint } = props;
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
                    <label>{curPoint.value}</label>
                    <div className={styles.frameRate}>
                        {isRendering.value && <label>Rendering...</label>}
                        <div className={renderStyle} />
                    </div>
                </div>
            </div>
            <Canvas
                drawFn={drawFn}
                className={styles.fractal}
                onWheel={onWheel}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
                width={800}
                height={800}
            />
        </main>
    )
}

const useFractals = () => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { console.clear(); void getNewtonAsync().then(() => { renderFn() }); }, []);
    const { drawFn, startRender, onDone } = useFractalDraw();
    const formula = useValue(defaultPolynomials[0]);
    const curPoint = useValue("");
    const dropoff = useValue(1.0);
    const isRendering = useValue(false);
    const zoom = useRef(0.0);
    const center = useRef<Point>({ x: 0, y: 0 });

    // void onDone.then(_duration => { console.log('Rendered:', _duration); isRendering.value = false; });
    void onDone.then(_duration => { isRendering.value = false; });

    const renderFn = () => {
        isRendering.value = true;
        const _dropoff = lerp(dropoff.value, 1.0, 0.15);
        startRender(formula.value, _dropoff, zoom.current, center.current);
    };
    const render = useDeferredFnExec(0.2, renderFn);
    const renderNow: () => void = renderFn;

    return { drawFn, isRendering, render, renderNow, formula, curPoint, dropoff, zoom, center };
}

const useOnChanges = (props: ReturnType<typeof useFractals>) => {
    const { formula, dropoff, isRendering, zoom, center, render, renderNow, curPoint } = props;

    const onChangeFormula = (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        formula.value = e.target.value;
        curPoint.value = "";
        zoom.current = 0.0;
        center.current.x = 0;
        center.current.y = 0;

        if (isValidFormula(formula.value)) {
            render();
        }
    };

    const onChangeDropoff = (e: ChangeEvent<HTMLInputElement>) => {
        dropoff.value = Number.parseFloat(e.target.value);
        render();
    }

    const onWheel = (e: WheelEvent<HTMLCanvasElement>) => {
        const zoomAdjust = -e.deltaY / 1000;
        zoom.current += zoomAdjust;
        curPoint.value = "";
        render();
    }

    const onMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();

        const newton = getNewtonSync();
        if (!newton) return;

        const _transform = canvasToUnitTransform(zoom.current, center.current);
        const curPt = applyTransforms(e.nativeEvent.offsetX, e.nativeEvent.offsetY, toCanvasCenterOrigin(), _transform);
        curPoint.value = `${curPt.x.toFixed(5)},${curPt.y.toFixed(5)}`;

        if ((e.buttons & 1) == 0) return;

        center.current = applyTransforms(-e.movementX, -e.movementY, _transform);
        isRendering.value = false;
        renderNow();
    }

    const onMouseLeave = (_e: MouseEvent<HTMLCanvasElement>) => {
        curPoint.value = "";
    }

    return { onChangeFormula, onChangeDropoff, onWheel, onMouseMove, onMouseLeave };
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
    // a=1, b=-13.8     z^5 + a*z^3 + b*z^2 - 5*a*z - 9*z + 3*b
    '5z^5 + 5z^3 - 69z^2 - 70z - 207',

    'z^13 - 3z^6 + z - 1',
    'z^5 + 3z^3 + z + 3',
    '2z^11 - 2z^7 + 4z^6 + 4z^5 - 4z^4 - 3z - 2',
    '-2z^10 + 3z^8 + z^6 + z^4 + 4z^2 + 5z + 5',
    'z^10 + z^8 - 2z^2 + 1',
    '-3z^10 - 4z^4 + z^2 - 2z - 3',
    '-2z^6 - 3z^3 - z + 6',
    '-z^9 + 4z^5 - 4z + 1',
    'z^7 - 4z^2 + 2z - 3',
    'z^4 - 3z^2 - 4',
    'z^4 - 3z^2 + 3',
    'z^4 + 3z^2 + 3',

    '3z^5 - 10z^3 + 23z',
    'z^4 - 6z^2 - 11',
    'z^4 + 6z^2 - 11',
    '-z^4 + 6z^2 - 10',
    '-z^4 - 6z^2 - 10',

    'z^3 - 2z + 2',

    '2z^4 + z^3 + 4z + 4',
    'z^4 + 3z + 3',
    'z^4 - 4z^3 - 9z+27',

    'z^6 - 4z^4 + 4z^2 - 4',
    'z^6 - 4z^4 + 6z^2 + 3',
    'z^6 - 4z^4 + 6z^2 + 4',
];