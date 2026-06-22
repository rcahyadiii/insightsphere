import { RefObject, useEffect } from "react";

/**
 * Accessibility helpers for modal-like overlays (dialogs, drawers).
 *
 * When `isOpen` is true:
 * - Closes on Escape key.
 * - Traps Tab focus within the container so keyboard users can't accidentally
 *   tab to elements behind the overlay.
 * - Auto-focuses the first focusable element (or the container itself) on open.
 * - Restores focus to the element that was focused before open when closing.
 * - Locks body scroll to prevent background jitter.
 *
 * The container ref must point to the modal's outermost focusable element
 * (ideally with `tabIndex={-1}` so it can receive focus as a fallback).
 *
 * @example
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   useModalA11y({ isOpen, onClose, containerRef });
 *
 *   return isOpen ? (
 *     <div ref={containerRef} role="dialog" aria-modal="true" tabIndex={-1}>
 *       ...
 *     </div>
 *   ) : null;
 */
export function useModalA11y({
  isOpen,
  onClose,
  containerRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  containerRef: RefObject<HTMLElement | null>;
}) {
  // Restore focus on close
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Auto-focus first focusable element inside container, or the container itself
    const focusInside = () => {
      const container = containerRef.current;
      if (!container) return;
      const focusables = getFocusableElements(container);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        container.focus();
      }
    };
    // Delay slightly to allow mount/animation
    const timer = window.setTimeout(focusInside, 10);

    return () => {
      window.clearTimeout(timer);
      // Restore focus to the element that had it before the modal opened
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, containerRef]);

  // Escape + Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const container = containerRef.current;
      if (!container) return;
      const focusables = getFocusableElements(container);
      if (focusables.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, containerRef]);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);
}

// Selector for focusable elements. Excludes disabled, hidden, and tabIndex=-1 items.
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
}
