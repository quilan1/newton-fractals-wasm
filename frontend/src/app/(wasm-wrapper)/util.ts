import { lerp } from "../(util)/util";
import { getWasmSync } from "./consts";

export const wasmMemoryUsage = () => {
    return getWasmSync()?.memory.buffer.byteLength ?? null;
}

export const isValidFormula = (formula: string) => {
    if (!formula.includes("z")) return false;
    formula = formula.replaceAll(/[\s\(\)\*]+/g, "");

    const nonEmpty = (s: string) => s.length > 0;
    const terms = formula
        .split("+")
        .filter(nonEmpty)
        .map(terms => terms.split("-").filter(nonEmpty))
        .flat();

    const re = new RegExp(/^(\d+)?z(\^\d+)?$|^(\d+)$/);
    return terms.length > 0 && terms.every(term => term.match(re));
}

export const calcDropoff = (dropoff: number) => lerp(dropoff, 1.0, 0.6);

export const hexF32 = (n: number) => {
    const getHex = (i: number) => ('00' + i.toString(16)).slice(-2);

    const view = new DataView(new ArrayBuffer(4));
    view.setFloat32(0, n);

    return [...new Array(4).keys()]
        .map(i => getHex(view.getUint8(i)))
        .join('');
}

export const hexF64 = (n: number) => {
    const getHex = (i: number) => ('00' + i.toString(16)).slice(-2);

    const view = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, n);

    return [...new Array(8).keys()]
        .map(i => getHex(view.getUint8(i)))
        .join('');
}
