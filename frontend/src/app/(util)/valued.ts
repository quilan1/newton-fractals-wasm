import { useState } from "react";

export type SimpleSetter<T> = (_: T) => void;
export type SimpleValueSetter<T> = [T, SimpleSetter<T>];

export type ToValued<T extends object> = {
    [K in keyof T]-?: Valued<T[K]>
};

export type FromValued<T extends object> = {
    [K in keyof T]: T[K] extends Valued<infer U> ? U : T[K]
};

export class Valued<T> {
    private state: T;
    private readonly setState: SimpleSetter<T>;
    constructor(def: SimpleValueSetter<T>) {
        const [state, setState] = def;
        this.state = state;
        this.setState = setState;
    }

    get value(): T { return this.state };
    set value(value: T) { this.setState(value); this.state = value; }
}

export function useValue<T = undefined>(): Valued<T | undefined>;
export function useValue<T>(val: T): Valued<T>;

export function useValue<T>(val?: T): Valued<T> | Valued<T | undefined> {
    return new Valued(useState(val));
}

export const devalue = <T extends object>(obj: T): FromValued<T> => {
    if (typeof obj != "object") throw new Error("Invalid type for devalue, expected object");

    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
        if ((typeof value != "object") || !("value" in value))
            throw new Error("Invalid type for devalue item, expected Value");

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        out[key] = value.value;
    }

    return out as FromValued<T>;
}