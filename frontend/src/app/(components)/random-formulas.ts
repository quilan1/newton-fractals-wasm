import { dotProduct, randRange, randRangeI, vecMult } from "../(util)/util";

const polynomialFromTerms = (coefs: number[]) => {
    const n = coefs.length;
    const terms = [...new Array(n).keys()].map((p, i) => {
        const c = Math.round(coefs[i]);
        if (c == 0) return "";
        if (p == 0) return c.toString();
        if (p == 1) return `${c}*z`;
        return `${c}*z^${p}`;
    }).reverse();

    const formula = terms.filter(t => t.length > 0).join(" + ");
    return formula.replaceAll("+ -", "- ");
}

const randomCritPoints2 = (): [number, number] => {
    const kMode = randRangeI(0, 4);
    switch (kMode) {
        case 0: return [randRange(-1, 1), randRange(-1, 1)];
        case 1: return [0, randRange(-1, 1)];
        case 2: { const k1 = randRange(-1, 1); return [k1, -k1]; }
        case 3: return [0, 1];
        case 4: return [-1, 1];
        default: throw new Error("Invalid kMode");
    }
}

export const cycle2 = ([k1, k2]: [number, number], leadingCoefficients: number[]): string => {
    // f(k1, k2) =>
    //      a*z^5+b*z^4+c*z^3+d*z^2
    //      +(-(4*a*k2^4)+(a*k1-3*b)*k2^3+(a*k1^2+b*k1-2*c)*k2^2+(a*k1^3+b*k1^2+c*k1-d)*k2-4*a*k1^4-3*b*k1^3-2*c*k1^2-d*k1)*z
    //      +4*a*k2^5+(3*b-a*k1)*k2^4+(-(a*k1^2)-b*k1+2*c)*k2^3+(-(a*k1^3)-b*k1^2-c*k1+d)*k2^2
    //          +(-(a*k1^4)-b*k1^3-c*k1^2-d*k1)*k2+4*a*k1^5+3*b*k1^4+2*c*k1^3+d*k1^2

    const [a, b, c, d] = leadingCoefficients;
    const k1Powers = [...new Array(6).keys()].map(p => Math.pow(k1, p));
    const k2Powers = [...new Array(6).keys()].map(p => Math.pow(k2, p));

    const leadingCoefficient4 = dotProduct([
        -dotProduct(vecMult([0, 1, 2, 3, 4, 0], [0, d, c, b, a, 0]), k1Powers),
        dotProduct(vecMult([-1, 1, 1, 1, 0, 0], [d, c, b, a, 0, 0]), k1Powers),
        dotProduct(vecMult([-2, 1, 1, 0, 0, 0], [c, b, a, 0, 0, 0]), k1Powers),
        dotProduct(vecMult([-3, 1, 0, 0, 0, 0], [b, a, 0, 0, 0, 0]), k1Powers),
        dotProduct(vecMult([-4, 0, 0, 0, 0, 0], [a, 0, 0, 0, 0, 0]), k1Powers),
        0,
    ], k2Powers);

    const leadingCoefficient5 = -dotProduct([
        -dotProduct(vecMult([0, 0, 1, 2, 3, 4], [0, 0, d, c, b, a]), k1Powers),
        dotProduct(vecMult([0, 1, 1, 1, 1, 0], [0, d, c, b, a, 0]), k1Powers),
        dotProduct(vecMult([-1, 1, 1, 1, 0, 0], [d, c, b, a, 0, 0]), k1Powers),
        dotProduct(vecMult([-2, 1, 1, 0, 0, 0], [c, b, a, 0, 0, 0]), k1Powers),
        dotProduct(vecMult([-3, 1, 0, 0, 0, 0], [b, a, 0, 0, 0, 0]), k1Powers),
        dotProduct(vecMult([-4, 0, 0, 0, 0, 0], [a, 0, 0, 0, 0, 0]), k1Powers),
    ], k2Powers);

    const coefficients = [...leadingCoefficients, leadingCoefficient4, leadingCoefficient5];
    const formula = polynomialFromTerms(coefficients.toReversed());
    // console.log("c2", [k1, k2], coefficients, formula);
    return formula;
}

const cycle2a = ([k1, k2]: [number, number], leadingCoefficients: number[]) => {
    leadingCoefficients.splice(-1);
    const [a, b, c] = leadingCoefficients;
    const k1Powers = [...new Array(6).keys()].map(p => Math.pow(k1, p));
    const k2Powers = [...new Array(6).keys()].map(p => Math.pow(k2, p));

    const leadingCoefficient3 = dotProduct([
        -dotProduct(vecMult([0, 3, 6, 10, 0, 0], [0, c, b, a, 0, 0]), k1Powers),
        0, 0, 0, 0, 0,
    ], k2Powers);

    const leadingCoefficient4 = dotProduct([
        dotProduct(vecMult([0, 0, 1, 3, 6, 0], [0, 0, c, b, a, 0]), k1Powers),
        dotProduct(vecMult([0, 4, 7, 11, 0, 0], [0, c, b, a, 0, 0]), k1Powers),
        dotProduct(vecMult([-2, 1, 1, 0, 0, 0], [c, b, a, 0, 0, 0]), k1Powers),
        dotProduct(vecMult([-3, 1, 0, 0, 0, 0], [b, a, 0, 0, 0, 0]), k1Powers),
        dotProduct(vecMult([-4, 0, 0, 0, 0, 0], [a, 0, 0, 0, 0, 0]), k1Powers),
        0,
    ], k2Powers);

    const leadingCoefficient5 = -dotProduct([
        dotProduct(vecMult([0, 0, 0, 1, 3, 6], [0, 0, 0, c, b, a]), k1Powers),
        -dotProduct(vecMult([0, 0, 2, 5, 9, 0], [0, 0, c, b, a, 0]), k1Powers),
        dotProduct(vecMult([0, 4, 7, 11, 0, 0], [0, c, b, a, 0, 0]), k1Powers),
        dotProduct(vecMult([-2, 1, 1, 0, 0, 0], [c, b, a, 0, 0, 0]), k1Powers),
        dotProduct(vecMult([-3, 1, 0, 0, 0, 0], [b, a, 0, 0, 0, 0]), k1Powers),
        dotProduct(vecMult([-4, 0, 0, 0, 0, 0], [a, 0, 0, 0, 0, 0]), k1Powers),
    ], k2Powers);

    const coefficients = [...leadingCoefficients, leadingCoefficient3, leadingCoefficient4, leadingCoefficient5];
    const formula = polynomialFromTerms(coefficients.toReversed());
    // console.log("c2a", [k1, k2], coefficients, formula);
    return formula;
}

export const randomCycle2 = () => {
    const leadingCoefficients = [...new Array(4).keys()].map(_ => randRangeI(-10, 10));
    const critPoints = randomCritPoints2();
    if (Math.random() < 0.5) critPoints.reverse();

    const [k1, k2] = critPoints;

    const cMode = randRangeI(0, 1);
    switch (cMode) {
        case 0: return cycle2([k1, k2], leadingCoefficients);
        case 1: return cycle2a([k1, k2], leadingCoefficients);
        default: throw new Error("Invalid cMode");
    }
}

export const randomFormula = () => {
    const numCoefficients = randRangeI(3, 7);
    const coefficients = new Array<number>(10);
    coefficients.fill(0);

    for (let i = 0; i < numCoefficients; ++i) {
        do {
            const power = randRangeI(0, coefficients.length - 1);
            if (coefficients[power] != 0) continue;
            const coefficientRange = 100 * Math.pow(power + 1, -1.25);
            coefficients[power] = randRangeI(-coefficientRange, coefficientRange);
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } while (false)
    }

    // Let's set some 0 & 1 power coefficients, so it's not all zero-roots
    for (let i = 0; i < 2; ++i) {
        do {
            const power = i;
            if (coefficients[power] != 0) break;
            const coefficientRange = 100 * Math.pow(power + 1, -1.25);
            coefficients[power] = randRangeI(-coefficientRange, coefficientRange);
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } while (false)
    }

    const formula = polynomialFromTerms(coefficients);
    // console.log(formula);
    return formula;
}