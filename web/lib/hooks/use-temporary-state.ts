"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useTemporaryState<T>(initialValue: T, timeoutMs = 3000) {
  const [value, setValueState] = useState<T>(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimeoutRef = useCallback(() => {
    if (!timeoutRef.current) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const setValue = useCallback(
    (nextValue: T) => {
      clearTimeoutRef();
      setValueState(nextValue);
    },
    [clearTimeoutRef]
  );

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue, setValue]);

  const setTemporaryValue = useCallback(
    (nextValue: T, nextTimeoutMs = timeoutMs) => {
      clearTimeoutRef();
      setValueState(nextValue);
      timeoutRef.current = setTimeout(() => {
        setValueState(initialValue);
        timeoutRef.current = null;
      }, nextTimeoutMs);
    },
    [clearTimeoutRef, initialValue, timeoutMs]
  );

  useEffect(() => clearTimeoutRef, [clearTimeoutRef]);

  return { value, setValue, setTemporaryValue, reset };
}

export function useTemporaryFlag(timeoutMs = 2000) {
  const { value, setTemporaryValue, reset } = useTemporaryState(false, timeoutMs);

  const activate = useCallback(() => {
    setTemporaryValue(true);
  }, [setTemporaryValue]);

  return { active: value, activate, reset };
}
