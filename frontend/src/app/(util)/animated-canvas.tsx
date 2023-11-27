import { memo, useEffect, useRef } from "react";

export type CanvasDrawFn = (context: CanvasRenderingContext2D, animationFrameId?: number) => void;

export interface CanvasProps extends React.ComponentPropsWithoutRef<"canvas"> {
    drawFn: CanvasDrawFn;
}

export const _Canvas = ({ drawFn, ...otherProps }: CanvasProps) => {
    const canvasRef = useAnimatedCanvas(drawFn);
    return <canvas ref={canvasRef} {...otherProps} />
};

export const AnimatedCanvas = memo(_Canvas) as typeof _Canvas;

function useAnimatedCanvas(drawFn: CanvasDrawFn) {
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