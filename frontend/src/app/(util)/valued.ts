import { useState } from "react";

export type SimpleSetter<T> = (_: T) => void;
export type SimpleValueSetter<T> = [T, SimpleSetter<T>];

export type Valueded<T extends object> = {
    [K in keyof T]-?: Valued<T[K]>
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
