
import { memo, useEffect, useRef } from "react";

export type CanvasDrawFn = (context: CanvasRenderingContext2D | null) => Promise<void>;

export interface CanvasProps extends React.ComponentPropsWithoutRef<"canvas"> {
    drawFn: CanvasDrawFn;
}

export const _Canvas = ({ drawFn, ...otherProps }: CanvasProps) => {
    const canvasRef = useCanvas(drawFn);
    return <canvas ref={canvasRef} {...otherProps} />
};

export const Canvas = memo(_Canvas) as typeof _Canvas;

function useCanvas(drawFn: CanvasDrawFn) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ready = useRef(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let animationFrameId = 0;

        const context = canvas.getContext('2d', { willReadFrequently: true });
        const render = () => {
            if (ready.current) {
                ready.current = false;
                void (async () => {
                    try {
                        await drawFn(context);
                    } finally {
                        ready.current = true;
                    }
                })();
            }
            animationFrameId = window.requestAnimationFrame(render)
        }
        render();

        return () => {
            window.cancelAnimationFrame(animationFrameId)
        }
    }, [drawFn]);

    return canvasRef;
}