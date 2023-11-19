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
        startRender(defaultPolynomials[0]);
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
]