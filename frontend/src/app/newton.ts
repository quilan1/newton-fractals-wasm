export type Newton = typeof import('@/pkg/newton_wasm');
export const getNewton = async (): Promise<Newton> => {
    return await import('@/pkg/newton_wasm');
}

import { Polynomial as P, Complex as C } from '@/pkg/newton_wasm';
export type Polynomial = P;
export type Complex = C;
