'use client';
import styles from './page.module.css';
import { Canvas } from './canvas';
import { useValue } from './valued';
import { useFractalDraw } from './(newton)/fractal';
import { getNewtonAsync } from './(newton)/newton-interface';
import { ChangeEvent, useEffect } from 'react';

export default function Home() {
    const { drawFn, frameRate, startRender, onDone } = useFractalDraw();
    const isRendering = useValue(false);
    const formula = useValue(defaultPolynomials[0]);

    void onDone.then(_duration => { isRendering.value = false; });
    const render = (formula: string) => { isRendering.value = true; startRender(formula); };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { void getNewtonAsync().then(() => { render(formula.value) }); }, []);

    const onChange = (e: ChangeEvent<HTMLSelectElement>) => {
        formula.value = e.target.value;
        render(e.target.value);
    };
    const renderClick = () => { render(formula.value); };

    const renderStyle = isRendering.value ? styles.isRendering : styles.notRendering;

    return (
        <main className={styles.main}>
            <div className={styles.settingsStatus}>
                <div className={styles.settings}>
                    <select value={formula.value} onChange={onChange}>
                        {defaultPolynomials.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                <div><button onClick={renderClick}>Render</button></div>
                <div className={styles.status}>
                    <div className={styles.frameRate}>
                        <label>{frameRate.value}</label>
                        <div className={renderStyle} />
                    </div>
                </div>
            </div>
            <Canvas drawFn={drawFn} className={styles.fractal} width={800} height={800} />
        </main>
    )
}

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
];
