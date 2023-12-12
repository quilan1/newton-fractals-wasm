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

export const newRoots = (fz?: Polynomial): Roots | null => {
    if (!fz) return null;
    try {
        return new (getNewton().Roots)(fz);
    } catch (err) {
        console.error(err);
        return null;
    }
}

export enum LightnessMode {
    Normal = "Normal",
    Inverted = "Inverted",
    Parabola = "Parabola",
    InvertedParabola = "Inverted Parabola",
}

export const getLightnessMode = (lightnessMode: LightnessMode) => {
    switch (lightnessMode) {
        case LightnessMode.Normal: return 0;
        case LightnessMode.Inverted: return 1;
        case LightnessMode.Parabola: return 2;
        case LightnessMode.InvertedParabola: return 3;
        default:
            const mode: never = lightnessMode;
            throw new Error(`lightnessMode ${mode} not accounted for`);
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

export enum IterRootMethod {
    NewtonsMethod = "Newton's Method",
    SchroedersMethod = "Schröder's Method for Multiple Roots",
    SchroedersMethod2 = "Schröder's Method #2",
    HalleysMethod = "Halley's Method",
    SteffensonsMethod = "Steffenson's Method",
}

export const getIterMethod = (iterMethod: IterRootMethod) => {
    switch (iterMethod) {
        case IterRootMethod.NewtonsMethod: return 0;
        case IterRootMethod.SchroedersMethod: return 1;
        case IterRootMethod.SchroedersMethod2: return 2;
        case IterRootMethod.HalleysMethod: return 3;
        case IterRootMethod.SteffensonsMethod: return 4;
        default:
            const method: never = iterMethod;
            throw new Error(`iterMethod ${method} not accounted for`);
    }
}
