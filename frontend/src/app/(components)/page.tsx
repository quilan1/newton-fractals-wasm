'use client';
import styles from './page.module.css';
import { useAsyncOnce } from '../(util)/util';
import { initWasmNewtonAsync } from '../(wasm-wrapper)/consts';
import { Settings } from './settings';
import { Status } from './status';
import { Canvas } from './canvas';
import { AppGeneralProps, useAppOnKeyDown, useAppProps } from './app-props';

export default function Home() {
    const { generalProps, stateMachine } = useAppProps();

    useAppOnKeyDown(generalProps);
    useInitializePage(generalProps);
    void stateMachine.onDone.then(_duration => {
        // console.log("Rendered:", _duration);
        generalProps.isRendering.value = false;
    });

    return (
        <main className={styles.main}>
            <div className={styles.appContainer}>
                <div className={styles.settingsStatusContainer}>
                    <Settings {...generalProps} />
                    <Status {...generalProps} />
                </div>
                <Canvas props={generalProps} drawFn={stateMachine.stepFn} />
            </div>
        </main>
    );
}

const useInitializePage = (generalProps: AppGeneralProps) => {
    useAsyncOnce(async () => {
        console.clear();
        await initWasmNewtonAsync();
        generalProps.isRendering.value = true;
    });
}
