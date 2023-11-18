'use client';
import styles from './page.module.css';
import { Canvas } from './canvas';
import { useValue } from './valued';
import { useFractalDraw } from './fractal';

export default function Home() {
    const isRendering = useValue(false);
    const { drawFn, frameRate, startRender, onDone } = useFractalDraw();

    void onDone.then(duration => {
        console.log('Done:', duration);
        isRendering.value = false;
    });

    const onClick = () => {
        isRendering.value = true;
        startRender('z^13 - 3*z^6 + z - 1');
        // startRender('z^5 + 3z^3 + z + 3');
    }

    return (
        <main className={styles.main}>
            <label>[{isRendering.value ? 'Rendering' : 'Not Rendering'}]</label>
            <label>{frameRate.value}</label>
            <Canvas drawFn={drawFn} className={styles.fractal} width={800} height={800} />
            <button type='button' onClick={onClick}>Render</button>
        </main>
    )
}
