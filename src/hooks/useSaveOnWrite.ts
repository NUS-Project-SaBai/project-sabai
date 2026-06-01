import {
  useState,
  useEffect,
  useCallback,
  useEffectEvent,
  useRef,
} from "react";
import useDebounce from "./useDebounce";

export function useSaveOnWrite<T extends object>(
  name: string,
  initialValue: T,
  dependencies: unknown[] = [],
  debounceMs = 1000,
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const storageKey =
    dependencies.length > 0
      ? `${name}_${dependencies.map((dep, index) => `dep${index + 1}=${dep}`).join("_")}`
      : name;

  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const stored = window.localStorage.getItem(storageKey);
      return stored != null ? JSON.parse(stored) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${storageKey}":`, error);
      return initialValue;
    }
  });
  const debouncedValue = useDebounce(value, debounceMs);

  const saveToStorage = useEffectEvent(() => {
    localStorage.setItem(storageKey, JSON.stringify(debouncedValue));
  });

  useEffect(() => {
    saveToStorage();
  }, [debouncedValue]);

  const initialValueRef = useRef(initialValue);

  const clear = useCallback(() => {
    localStorage.removeItem(storageKey);
    setValue(initialValueRef.current);
  }, [storageKey]);

  return [value, setValue, clear] as const;
}
