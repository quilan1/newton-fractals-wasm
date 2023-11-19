import { useState } from "react";

export type SimpleSetter<T> = (_: T) => void;
export type SimpleValueSetter<T> = [T, SimpleSetter<T>];

export class Valued<T> {
    readonly state: T;
    readonly setState: SimpleSetter<T>;
    constructor(def: SimpleValueSetter<T>) {
        const [state, setState] = def;
        this.state = state;
        this.setState = setState;
    }

    get value(): T { return this.state };
    set value(value: T) { this.setState(value); }
}

export function useValue<T = undefined>(): Valued<T | undefined>;
export function useValue<T>(val: T): Valued<T>;

export function useValue<T>(val?: T): Valued<T> | Valued<T | undefined> {
    return new Valued(useState(val));
}
