import { useRef, useMemo, useEffect } from "react";
import debounce from "lodash/debounce";

export default (callback, time) => {
    const ref = useRef();

    useEffect(() => {
        ref.current = callback;
    }, [callback]);

    const debouncedCallback = useMemo(() => {
        const func = () => {
            ref.current?.();
        };

        return debounce(func, time);
    }, []);

    return debouncedCallback;
};