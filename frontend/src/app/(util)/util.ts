import { throttle } from 'lodash';
import { useEffect, useMemo, useRef } from 'react';

type Setter<T> = (value: T | PromiseLike<T>) => void;
export const setterPromise = <T>(): [Setter<T>, Promise<T>] => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let setter: Setter<T> = (_value: T | PromiseLike<T>) => { };
    const promise = new Promise<T>(resolve => {
        setter = (value: T | PromiseLike<T>) => { resolve(value) };
    });

    return [setter, promise];
}

export const useAsyncOnce = (fn: () => Promise<void>) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { void fn(); }, []);
}

export const useEventListener = (eventName: string, handler: EventListener, getElement?: <T extends Element>() => T) => {
    const savedHandler = useRef<EventListener>();
    useEffect(() => { savedHandler.current = handler; }, [handler]);

    useEffect(
        () => {
            const element = getElement ? getElement() : window;
            const eventListener = (event: Event) => { if (savedHandler.current) savedHandler.current(event); };
            element.addEventListener(eventName, eventListener);
            return () => { element.removeEventListener(eventName, eventListener); };
        },
        [eventName, getElement] // Re-run if eventName or element changes
    );
};

export const useThrottle = (timeoutMs: number, fn: () => void) => {
    const ref = useRef<() => void>();

    useEffect(() => {
        ref.current = fn;
    }, [fn]);

    const throttledCallback = useMemo(() => {
        return throttle(() => { ref.current?.(); }, timeoutMs);
    }, [timeoutMs]);

    return throttledCallback;
};

export const classNames = (styles: Record<string, string>, classes: (string | undefined)[]): string => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unnecessary-condition
    return classes.filter(c => c?.length ?? 0).map(c => styles[c!]).filter(c => c?.length ?? 0).join(' ');
}

export const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
export const lerp = (v: number, a: number, b: number) => a + v * (b - a);
export const lerpClamped = (v: number, a: number, b: number) => clamp(a + v * (b - a), a, b);

export const toSplitArray = <T,>(arr: T[], fn: (v: T) => boolean): [T[], T[]] => {
    const [fArray, tArray]: [T[], T[]] = [[], []];
    arr.forEach(v => { if (fn(v)) tArray.push(v); else fArray.push(v); });
    return [tArray, fArray];
}

export const dotProduct = (a: number[], b: number[]): number => {
    return vecMult(a, b).reduce((p, v) => p + v, 0);
}

export const vecMult = (a: number[], b: number[]): number[] => {
    return a.map((v, i) => v * b[i]);
}

export const randRange = (a: number, b: number) => lerp(Math.random(), a, b);
export const randRangeI = (a: number, b: number) => Math.floor(randRange(a, b + 1));
