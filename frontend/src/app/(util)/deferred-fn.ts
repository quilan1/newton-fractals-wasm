import { useRef } from "react";

export type DeferredFn = (fn: () => Promise<void>) => void;

export function useDeferredFnAsync(timeout: number) {
    const isRunning = useRef(false);
    const timeoutId = useRef<NodeJS.Timeout | undefined>(undefined);

    return (fn: () => Promise<void>) => {
        if (timeoutId.current !== undefined) clearTimeout(timeoutId.current);

        const timerFn = () => {
            timeoutId.current = undefined;

            // If we're currently busy, reschedule later.
            if (isRunning.current) {
                timeoutId.current = setTimeout(timerFn, timeout);
                return;
            }

            isRunning.current = true;
            void fn().then(() => { isRunning.current = false; });
        };

        timeoutId.current = setTimeout(timerFn, timeout);
    }
}

export function useDeferredFn(timeout: number) {
    const isRunning = useRef(false);
    const timeoutId = useRef<NodeJS.Timeout | undefined>(undefined);

    return (fn: () => void) => {
        if (timeoutId.current !== undefined) clearTimeout(timeoutId.current);

        const timerFn = () => {
            timeoutId.current = undefined;

            // If we're currently busy, reschedule later.
            if (isRunning.current) {
                timeoutId.current = setTimeout(timerFn, timeout);
                return;
            }

            isRunning.current = true;
            try { fn(); }
            finally { isRunning.current = false; }
        };

        timeoutId.current = setTimeout(timerFn, timeout);
        return () => { clearTimeout(timeoutId.current); };
    }
}

export function useDeferredFnExec(timeout: number, fn: () => void) {
    const deferredFn = useDeferredFn(timeout);
    return () => { deferredFn(fn); };
}
