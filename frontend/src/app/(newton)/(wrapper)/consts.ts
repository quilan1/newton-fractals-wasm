export type Newton = typeof import('@/pkg/newton_wasm');
export type Wasm = typeof import('@/pkg/newton_wasm_bg.wasm');

///////////////////////////////////////////////////////////////////

export let _newton: Newton | null = null;

export const getNewtonSync = (): Newton | null => {
    if (!_newton) { void getNewtonAsync(); }
    return _newton;
}

export const getNewton = (): Newton => {
    if (!_newton) throw new Error("Web Assembly is not yet loaded");
    return _newton;
}

export const getNewtonAsync = async (): Promise<Newton> => {
    _newton = await import('@/pkg/newton_wasm');
    return _newton;
}

///////////////////////////////////////////////////////////////////

export let _wasm: Wasm | null = null;

export const getWasmSync = (): Wasm | null => {
    if (!_wasm) { void getWasmAsync(); };
    return _wasm;
}

export const getWasmAsync = async (): Promise<Wasm> => {
    _wasm = await import("@/pkg/newton_wasm_bg.wasm");
    return _wasm;
}

///////////////////////////////////////////////////////////////////

export const initWasmNewtonAsync = async () => {
    await getNewtonAsync();
    await getWasmAsync();
}

///////////////////////////////////////////////////////////////////

let _canvasSize: number | undefined;

export const getCanvasSize = () => {
    if (_canvasSize !== undefined) return _canvasSize;
    _canvasSize = getNewton().__canvasSize();
    return _canvasSize;
}

let _unitsPerPixel: number | undefined;

export const getUnitsPerPixel = () => {
    if (_unitsPerPixel !== undefined) return _unitsPerPixel;
    _unitsPerPixel = getNewton().__unitsPerPixelBase();
    return _unitsPerPixel;
}
