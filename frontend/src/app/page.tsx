'use client';
import { useCallback, useRef } from 'react';
import styles from './page.module.css';
import { Canvas, CanvasDrawFn } from './canvas';
import { useValue } from './valued';

const renderArea = async (ctx: CanvasRenderingContext2D, row: number) => {
    const newton = await import('@/pkg/newtons_method');
    newton.render2(ctx, row);
}

export default function Home() {
    const frameTime = useValue(0);
    const doRender = useValue(false);

    const data = useRef({ row: 0 });

    const drawFn = useCallback<CanvasDrawFn>(async (context) => {
        if (context == null) return;
        if (!doRender.value) return;

        const scale = 1;
        if (data.current.row > 800) {
            doRender.value = false;
            return;
        }

        const start = Date.now();
        await renderArea(context, data.current.row);
        frameTime.value = Date.now() - start;

        data.current.row += scale;
    }, [doRender, frameTime]);

    const onClick = () => {
        doRender.value = true;
        data.current.row = 0;
    }

    return (
        <main className={styles.main}>
            <label>[{doRender.value ? 'Rendering' : 'Not Rendering'}]</label>
            <label>{frameTime.value} ms</label>
            <Canvas drawFn={drawFn} className={styles.fractal} width={800} height={800} />
            <button type='button' onClick={onClick}>Render</button>
        </main>
    )
}
