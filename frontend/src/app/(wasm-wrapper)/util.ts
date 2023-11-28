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
