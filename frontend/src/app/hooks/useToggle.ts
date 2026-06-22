import { useCallback, useState } from "react";

/**
 * Manages a boolean state with convenient toggle/set helpers.
 *
 * Returns a tuple of [value, toggle, setValue] so callers can either
 * flip the boolean or force a specific value (useful for dropdowns that
 * should close on outside click).
 *
 * @example
 *   const [isOpen, toggleOpen, setOpen] = useToggle();
 *   <button onClick={toggleOpen}>Toggle</button>
 *   <div onClick={() => setOpen(false)}>Close</div>
 */
export function useToggle(
  initialValue: boolean = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState<boolean>(initialValue);

  const toggle = useCallback(() => {
    setValue((v) => !v);
  }, []);

  const set = useCallback((next: boolean) => {
    setValue(next);
  }, []);

  return [value, toggle, set];
}
