'use client';
import styles from './page.module.css';
import { Canvas } from './(util)/canvas';
import { Valued, useValue } from './(util)/valued';
import { useFractalDraw } from './(newton)/render-loop';
import { getNewtonAsync } from './(newton)/newton-interface';
import { ChangeEvent, MutableRefObject, WheelEvent, useEffect, useRef } from 'react';
import { useDeferredFnExec } from './(util)/deferred-fn';

export default function Home() {
    const { drawFn, isRendering, formula, dropoff, render, zoom } = useFractals();
    const { onChangeFormula, onChangeDropoff, onWheel } = useOnChanges(formula, dropoff, zoom, render);

    const renderStyle = isRendering.value ? styles.isRendering : styles.notRendering;

    return (
        <main className={styles.main}>
            <div className={styles.settingsStatus}>
                <div className={styles.settings}>
                    <select value={formula.value} onChange={onChangeFormula}>
                        {defaultPolynomials.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
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
            <Canvas drawFn={drawFn} className={styles.fractal} onWheel={onWheel} width={800} height={800} />
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

    // void onDone.then(_duration => { console.log('Rendered:', _duration); isRendering.value = false; });
    void onDone.then(_duration => { isRendering.value = false; });

    const renderFn = () => {
        isRendering.value = true;
        const _dropoff = lerp(dropoff.value, 1.0, 0.15);
        startRender(formula.value, _dropoff, zoom.current);
    };
    const render = useDeferredFnExec(0.2, renderFn);

    return { drawFn, isRendering, render, formula, dropoff, zoom };
}

const useOnChanges = (formula: Valued<string>, dropoff: Valued<number>, zoom: MutableRefObject<number>, render: () => void) => {
    const onChangeFormula = (e: ChangeEvent<HTMLSelectElement>) => {
        formula.value = e.target.value;
        zoom.current = 0.0;
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

    return { onChangeFormula, onChangeDropoff, onWheel };
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
    'z^4 - 3*z^2 - 4',
    'z^3 - 2*z + 2',
    'z^6 - 4*z^4 + 4*z^2 - 4',
    '4z^12 - 9z^10 - 26z^6 - z^2 + 25',
];
