import {
  useState,
  useEffect,
  useCallback,
  useEffectEvent,
  useRef,
} from "react";
import useDebounce from "./useDebounce";

/**
 * Hook that manages state with automatic debounced localStorage persistence.
 * @param name Storage key name
 * @param initialValue Initial state value
 * @param dependencies Optional dependencies for unique storage keys
 * @param debounceMs Debounce delay in ms (default is 1000ms which is 1 second)
 * @returns [value, setValue, clear]
 */
export function useSaveOnWrite<T extends object>(
  name: string,
  initialValue: T,
  dependencies: unknown[] = [],
  debounceMs = 1000,
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  /**
   * Builds a unique storage key by combining the base name with dependency values.
   *
   * @param name - The base storage key name
   * @param dependencies - Array of dependency values to include in the key
   * @returns The complete storage key string
   */
  function buildStorageKey(name: string, dependencies: unknown[]): string {
    return dependencies.length > 0
      ? `${name}_${dependencies.map((dep, index) => `dep${index + 1}=${dep}`).join("_")}`
      : name;
  }

  const storageKey = buildStorageKey(name, dependencies);

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

  /**
   * Clears the stored value from localStorage and resets the state to the initial value.
   */
  const clear = useCallback(() => {
    localStorage.removeItem(storageKey);
    setValue(initialValueRef.current);
  }, [storageKey]);

  return [value, setValue, clear] as const;
}
