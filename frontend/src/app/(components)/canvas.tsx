import styles from './page.module.css';
import { FractalParams } from "./page";
import { MouseEvent, RefObject, useCallback, useEffect, useRef } from 'react';
import { getCanvasSize, getNewtonSync } from '../(wasm-wrapper)/consts';
import { canvasToUnitTransform, toCanvasCenterOrigin } from '../(wasm-wrapper)/transform';
import { applyTransforms, scale } from '../(util)/transform';

export type CanvasDrawFn = (context: CanvasRenderingContext2D, animationFrameId?: number) => void;

export interface CanvasProps extends React.ComponentPropsWithoutRef<"canvas"> {
    drawFn: CanvasDrawFn,
    canvasRef: RefObject<HTMLCanvasElement>,
}

export const Canvas = (props: FractalParams) => {
    const canvasRef = useAnimatedCanvas(props.drawFn);
    const { onMouseMove, onMouseLeave } = useOnChanges(props, canvasRef);

    return (
        <div className={styles.canvasContainer}>
            <canvas
                className={styles.fractalCanvas}
                ref={canvasRef}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
                width={800}
                height={800}
            />
        </div>
    );
}

const useOnChanges = (props: FractalParams, canvasRef: RefObject<HTMLCanvasElement>) => {
    const onWheel = useCallback((e: WheelEvent) => {
        const { transform, render, curPoint } = props;
        const zoomAdjust = e.deltaY / 1000;
        e.preventDefault();
        transform.current.scale *= Math.pow(2, zoomAdjust);
        curPoint.value = "";
        render();
    }, [props]);

    const canvas = canvasRef.current;
    useEffect(() => {
        if (!canvas) return;
        const options: AddEventListenerOptions = { passive: false };
        canvas.addEventListener('wheel', onWheel as EventListener, options);
        return () => { canvas.removeEventListener('wheel', onWheel as EventListener, options); };
    }, [onWheel, canvas]);

    const onMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
        const { isRendering, transform, renderNow, curPoint } = props;
        e.preventDefault();

        const newton = getNewtonSync();
        if (!newton) return;

        const _transform = canvasToUnitTransform(transform.current);
        const curPt = applyTransforms(e.nativeEvent.offsetX, e.nativeEvent.offsetY,
            scale(getCanvasSize() / e.currentTarget.clientWidth),   // Scale up to the internal canvas size
            toCanvasCenterOrigin(),
            _transform
        );
        curPoint.value = `${curPt.x.toFixed(5)} ${curPt.y < 0 ? '-' : '+'} ${Math.abs(curPt.y).toFixed(5)}i`;

        if (!(e.buttons & 1)) return;

        transform.current.translate = applyTransforms(-e.movementX, -e.movementY, _transform);
        isRendering.value = false;
        renderNow();
    }

    const onMouseLeave = (_e: MouseEvent<HTMLCanvasElement>) => {
        props.curPoint.value = "";
    }

    return { onMouseMove, onMouseLeave };
}

export function useAnimatedCanvas(drawFn: CanvasDrawFn) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return;

        let animationFrameId = 0;
        const render = () => {
            try { drawFn(context); } catch { }
            animationFrameId = window.requestAnimationFrame(render)
        }
        render();

        return () => { window.cancelAnimationFrame(animationFrameId); }
    }, [drawFn]);

    return canvasRef;
}
