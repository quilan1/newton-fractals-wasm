import { useEffect } from "react";

export const usePeriodicFn = (msTimeout: number, fn: () => void) => {
    useEffect(() => {
        const interval = setInterval(() => { fn() }, msTimeout);
        return () => { clearInterval(interval) };
    }, [msTimeout, fn]);
}
