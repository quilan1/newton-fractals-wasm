import { MutableRefObject, useCallback, useRef } from "react";
import { useValue } from "./valued";
import { CanvasDrawFn } from "./canvas";
import { setterPromise, useAsync } from "./util";
import { Newton, Polynomial, getNewton } from "./newton";

interface Data {
    isRendering: boolean,
    startTime: number,
    row: number,
    scale: number,
    fz?: Polynomial,
}

const resetData = { row: 0, scale: 32 };
const defaultData: Data = { isRendering: false, startTime: 0, ...resetData };

const renderToCanvas = (context: CanvasRenderingContext2D, newton: Newton, data: Data) => {
    const { row, scale, fz: _fz } = data;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const fz = _fz!;
    const row_data = newton.calculate(fz, scale, row);
    newton.render(context, fz, scale, row, row_data);
}

const renderFn = (context: CanvasRenderingContext2D, newton: Newton, data: MutableRefObject<Data>) => {
    if (!data.current.fz) {
        console.log('No function, for some reason, aborting');
        data.current.isRendering = false;
        return;
    }

    if (data.current.row >= context.canvas.height) {
        if (data.current.scale == 1) {
            _drawRoots(context, data.current.fz);
            data.current.isRendering = false;
            return;
        }
        data.current.row = 0;
        data.current.scale /= 2;
    }

    const start = Date.now();
    let numFrames = 0;
    while (numFrames == 0 || (Date.now() - start < 15 && data.current.row < context.canvas.height)) {
        renderToCanvas(context, newton, data.current);
        data.current.row += data.current.scale;
        numFrames += 1;
    }

    const frameRate = (Date.now() - start) / numFrames;
    return { frameRate, numFrames };
}

export const useFractalDraw = () => {
    const data = useRef(defaultData);
    const startRender = (fz: string) => {
        Object.assign(data.current, resetData);
        data.current.isRendering = true;
        data.current.startTime = Date.now();
        if (newton.current) {
            data.current.fz = new newton.current.Polynomial(fz);
            const roots = data.current.fz.roots();
            console.log('Roots:', roots.map(c => ({ re: c.re.toFixed(8), im: c.im.toFixed(8) })));
        }
    };

    const frameRateStr = useValue('');
    const [setDone, onDone] = setterPromise<number>();
    const newton = useRef<Newton>();

    useAsync(async () => { newton.current = await getNewton(); });

    const drawFn = useCallback<CanvasDrawFn>((context: CanvasRenderingContext2D | null) => {
        if (context == null || !data.current.isRendering || !newton.current) return;

        const result = renderFn(context, newton.current, data);
        if (!result) {
            setDone(Date.now() - data.current.startTime);
            return;
        }

        const { numFrames, frameRate } = result;
        frameRateStr.value = `${numFrames} rows/frame, ${frameRate.toFixed(2)} ms`;
    }, [setDone, frameRateStr]);

    return { drawFn, frameRate: frameRateStr, startRender, onDone };
}

const _drawRoots = (context: CanvasRenderingContext2D, fz: Polynomial) => {
    for (const root of fz.roots()) {
        const x = 400 * (1 + root.re / 1.5);
        const y = 400 * (1 + root.im / 1.5);

        context.strokeStyle = 'black';
        context.beginPath();
        context.arc(x, y, 19, 0, 2 * Math.PI);
        context.stroke();

        context.beginPath();
        context.arc(x, y, 21, 0, 2 * Math.PI);
        context.stroke();

        context.strokeStyle = 'white';
        context.beginPath();
        context.arc(x, y, 20, 0, 2 * Math.PI);
        context.stroke();
    }
}
