import { Polynomial, Roots } from "@/pkg/newton_wasm";
import { getNewton } from "./consts";

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
