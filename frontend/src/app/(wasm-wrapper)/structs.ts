import { Polynomial, Roots } from "@/pkg/newton_wasm";
import { getNewton } from "./consts";
import { Transform as _Transform, newTransform } from "@/app/(util)/transform";

export const newPolynomial = (formula: string): Polynomial | null => {
    try {
        return new (getNewton().Polynomial)(formula);
    } catch (err) {
        console.error(err);
        return null;
    }
}

export const newRoots = (fz: Polynomial): Roots | null => {
    try {
        return new (getNewton().Roots)(fz);
    } catch (err) {
        console.error(err);
        return null;
    }
}

export type Transform = _Transform;
export const __newTransform = (scale: number, x: number, y: number): Transform => {
    return newTransform(scale, x, y);
}

export interface Complex { re: number, im: number };
export const __newComplex = (re: number, im: number): Complex => {
    return { re, im };
}

export interface OklchColor { h: number, c: number };
export const __newOklchColor = (h: number, c: number): OklchColor => {
    return { h, c };
}
