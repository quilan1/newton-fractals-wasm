'use client';
import { useEffect } from 'react';
import styles from './page.module.css';

export default function Home() {
    useEffect(() => {
        void (async () => {
            const newton = await import('@/pkg/newtons_method');
            console.log(newton);
        })();
    }, []);

    return (
        <main className={styles.main}>
            <canvas className={styles.fractal} />
            <button type='button'>Render</button>
        </main>
    )
}
