import { Dispatch, SetStateAction, useState } from "react";

/**
 * Custom hook to toggle of the value of a state between true and false.
 *
 * @param {boolean} initialState - the initial value to pass to useState
 * @returns The `useToggle` function returns an array containing three elements: [val, toggleVal, setVal]
 * 1. val - the value of the state
 * 2. toggleVal - nullary function that toggles the state
 * 3. setVal - set the state to the value.
 */
export function useToggle(
  initialState: boolean,
): [boolean, () => void, Dispatch<SetStateAction<boolean>>] {
  const [val, setVal] = useState(initialState);
  const toggleVal = () => setVal((prev) => !prev);
  return [val, toggleVal, setVal];
}
