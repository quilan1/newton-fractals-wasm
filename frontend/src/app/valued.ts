import { useState } from "react";

export type SimpleSetter<T> = (_: T) => void;
export type SimpleValueSetter<T> = [T, SimpleSetter<T>];

export type Valueded<T extends object> = {
    [K in keyof T]-?: Valued<T[K]>
};

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

// function isAtom<T>(obj: unknown): obj is Atom<T> {
//     if (!obj) return false;
//     if (typeof obj !== "object") return false;
//     // eslint-disable-next-line @typescript-eslint/no-base-to-string
//     return obj.toString().startsWith("atom");
// }

// function useStateOrAtom<T>(val: T | Atom<T>): SimpleValueSetter<T> {
//     return (isAtom(val))
//         // eslint-disable-next-line react-hooks/rules-of-hooks
//         ? useAtom(val) as SimpleValueSetter<T>
//         // eslint-disable-next-line react-hooks/rules-of-hooks
//         : useState(val);
// }

export function useValue<T>(val: T): Valued<T> {
    return new Valued(useState(val));
}
