'use client';
import styles from './page.module.css';
import { AnimatedCanvas } from '../(util)/animated-canvas';
import { useValue } from '../(util)/valued';
import { useFractalDraw } from '../(render)/state-machine';
import { ChangeEvent, WheelEvent, MouseEvent, useRef } from 'react';
import { useDeferredFnExec } from '../(util)/deferred-fn';
import { classNames, useAsyncOnce } from '../(util)/util';
import { applyTransforms, transformIdent, } from '../(util)/transform';
import { canvasToUnitTransform, toCanvasCenter as toCanvasCenterOrigin } from '../(wasm-wrapper)/transform';
import { getNewtonSync, initWasmNewtonAsync } from '../(wasm-wrapper)/consts';
import { isValidFormula, wasmMemoryUsage } from '../(wasm-wrapper)/util';
import { usePeriodicFn } from '../(util)/periodic-fn';

export default function Home() {
    const props = useFractals();
    const { onChangeFormula, onChangeDropoff, onWheel, onMouseMove, onMouseLeave } = useOnChanges(props);
    const { drawFn, isRendering, formula, dropoff, curPoint } = props;
    const wasmMemoryUsage = useWasmMemoryUsage();

    const renderStyle = isRendering.value ? styles.isRendering : styles.notRendering;
    const _isValidFormula = isValidFormula(formula.value);
    const formulaStyle = classNames(styles, ['formula', !_isValidFormula ? 'badFormula' : '']);

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
                            value={dropoff.value}
                            onChange={onChangeDropoff}
                        />
                    </div>
                </div>
                <div className={styles.status}>
                    <label>{curPoint.value}&nbsp;</label>
                    <label>{wasmMemoryUsage.value}</label>
                    <div className={styles.frameRate}>
                        {isRendering.value && <label>Rendering...</label>}
                        <div className={renderStyle} />
                    </div>
                </div>
            </div>
            <AnimatedCanvas
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
    const { drawFn, startRender, onDone } = useFractalDraw();
    const formula = useValue(defaultPolynomials[0]);
    const curPoint = useValue("");
    const dropoff = useValue(1.0);
    const isRendering = useValue(false);
    const transform = useRef(transformIdent());

    // void onDone.then(_duration => { console.log('Rendered:', _duration); isRendering.value = false; });
    void onDone.then(_duration => { isRendering.value = false; });

    const renderNow = () => {
        if (!isValidFormula(formula.value)) return;
        isRendering.value = true;
        const _dropoff = lerp(dropoff.value, 1.0, 0.15);
        startRender(formula.value, _dropoff, transform.current);
    };
    const render = useDeferredFnExec(0.2, renderNow);

    useInitializePage(renderNow);

    return { drawFn, isRendering, render, renderNow, formula, curPoint, dropoff, transform };
}

const useInitializePage = (fn: () => void) => {
    useAsyncOnce(async () => {
        console.clear();
        await initWasmNewtonAsync();
        fn();
    });
}

const useOnChanges = (props: ReturnType<typeof useFractals>) => {
    const onChangeFormula = (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { formula, transform, render, curPoint } = props;
        formula.value = e.target.value;
        curPoint.value = "";
        transform.current = transformIdent();
        render();
    };

    const onChangeDropoff = (e: ChangeEvent<HTMLInputElement>) => {
        const { dropoff, render } = props;
        dropoff.value = Number.parseFloat(e.target.value);
        render();
    }

    const onWheel = (e: WheelEvent<HTMLCanvasElement>) => {
        const { transform, render, curPoint } = props;
        const zoomAdjust = e.deltaY / 1000;
        transform.current.scale *= Math.pow(2, zoomAdjust);
        curPoint.value = "";
        render();
    }

    const onMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
        const { isRendering, transform, renderNow, curPoint } = props;
        e.preventDefault();

        const newton = getNewtonSync();
        if (!newton) return;

        const _transform = canvasToUnitTransform(transform.current);
        const curPt = applyTransforms(e.nativeEvent.offsetX, e.nativeEvent.offsetY, toCanvasCenterOrigin(), _transform);
        curPoint.value = `${curPt.x.toFixed(5)},${curPt.y.toFixed(5)}`;

        if ((e.buttons & 1) == 0) return;

        transform.current.translate = applyTransforms(-e.movementX, -e.movementY, _transform);
        isRendering.value = false;
        renderNow();
    }

    const onMouseLeave = (_e: MouseEvent<HTMLCanvasElement>) => {
        props.curPoint.value = "";
    }

    return { onChangeFormula, onChangeDropoff, onWheel, onMouseMove, onMouseLeave };
}

const useWasmMemoryUsage = (msTimeout = 100) => {
    const memoryUsage = useValue("");
    usePeriodicFn(msTimeout, () => {
        const memoryUsageBytes = wasmMemoryUsage();
        if (!memoryUsageBytes) return;
        memoryUsage.value = `WASM memory usage: ${(memoryUsageBytes / 1000000).toFixed(2)} MB`;
    });

    return memoryUsage;
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
    'z^4 - 4z^3 - 9z + 27',

    'z^6 - 4z^4 + 4z^2 - 4',
    'z^6 - 4z^4 + 6z^2 + 3',
    'z^6 - 4z^4 + 6z^2 + 4',
];