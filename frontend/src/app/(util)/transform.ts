export interface Transform {
    scale: number,
    translate: Point,
}

export interface Point {
    x: number,
    y: number,
}

export const transformIdent = (): Transform => {
    return newTransform(1.0, 0.0, 0.0);
}

export const newTransform = (scale: number, x: number, y: number): Transform => {
    return { scale, translate: { x, y } }
}

export const scale = (scale: number): Transform => {
    return { scale, translate: { x: 0, y: 0 } }
}

export function translate(translate: Point): Transform;
export function translate(x: number, y: number): Transform;
export function translate(translate: Point | number, y?: number): Transform {
    if (typeof translate === "number") {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return { scale: 1, translate: { x: translate, y: y! } };
    } else {
        return { scale: 1, translate };
    }
}

export const invert = (transform: Transform) => {
    return {
        scale: 1 / transform.scale,
        translate: {
            x: -transform.translate.x / transform.scale,
            y: -transform.translate.y / transform.scale
        }
    };
}

export const transformMany = (...transforms: Transform[]) => {
    const transform = { scale: 1, translate: { x: 0, y: 0 } };
    for (const t of transforms) {
        transform.scale *= t.scale;
        transform.translate.x *= t.scale;
        transform.translate.y *= t.scale;
        transform.translate.x += t.translate.x;
        transform.translate.y += t.translate.y;
    }
    return transform;
}

export function applyTransforms(x: number, y: number, ...transforms: Transform[]): Point
export function applyTransforms(p: Point, ...transforms: Transform[]): Point
export function applyTransforms(p: Point | number, y: number | Transform, ...transforms: Transform[]): Point {
    if (typeof p === "number") {
        return transformMany(translate(p, y as unknown as number), ...transforms).translate;
    }
    return transformMany(translate(p), y as Transform, ...transforms).translate;
}

