import { useEffect } from 'react';

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

export const classNames = (styles: Record<string, string>, classes: (string | undefined)[]): string => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unnecessary-condition
    return classes.filter(c => c?.length ?? 0).map(c => styles[c!]).filter(c => c?.length ?? 0).join(' ');
}
