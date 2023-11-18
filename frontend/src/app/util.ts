import { useEffect } from 'react';

type Setter<T> = (_value: T) => void;
export const setterPromise = <T,>(): [Setter<T>, Promise<T>] => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let setter: Setter<T> = (_value: T) => { };
    const promise = new Promise<T>(resolve => {
        setter = (value: T) => { resolve(value) };
    });

    return [setter, promise];
}

export const useAsync = (fn: () => Promise<void>, req?: unknown[]) => {
    useEffect(() => {
        void (async () => {
            await fn();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fn, ...req ?? []]);
}
