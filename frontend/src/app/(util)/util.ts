import { useEffect, useRef } from 'react';

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

export const classNames = (styles: Record<string, string>, classes: (string | undefined)[]): string => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unnecessary-condition
    return classes.filter(c => c?.length ?? 0).map(c => styles[c!]).filter(c => c?.length ?? 0).join(' ');
}

export const lerp = (v: number, a: number, b: number) => a + v * (b - a);

export const toSplitArray = <T,>(arr: T[], fn: (v: T) => boolean): [T[], T[]] => {
    const [fArray, tArray]: [T[], T[]] = [[], []];
    arr.forEach(v => { if (fn(v)) tArray.push(v); else fArray.push(v); });
    return [tArray, fArray];
}