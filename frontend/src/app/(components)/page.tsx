'use client';
import styles from './page.module.css';
import { useAsyncOnce } from '../(util)/util';
import { initWasmNewtonAsync } from '../(wasm-wrapper)/consts';
import { Settings } from './settings';
import { Status } from './status';
import { Canvas } from './canvas';
import { AppGeneralProps, useAppOnKeyDown, useAppProps } from './app-props';
import { StateMachineProps } from '../(state-machine)/state-machine';
import { devalue } from '../(util)/valued';

export default function Home() {
    const { generalProps, stateMachine } = useAppProps();

    useAppOnKeyDown(generalProps);
    useInitializePage(generalProps, stateMachine);
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

const useInitializePage = (generalProps: AppGeneralProps, stateMachine: StateMachineProps) => {
    useAsyncOnce(async () => {
        console.clear();
        await initWasmNewtonAsync();
        // console.log('WASM has initialized');
        stateMachine.initFns.calculateNewPassFn(devalue(generalProps), stateMachine);
        generalProps.isRendering.value = true;
    });
}
