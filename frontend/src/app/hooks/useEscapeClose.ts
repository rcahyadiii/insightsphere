import { RefObject, useEffect } from "react";

/**
 * Lightweight accessibility helper for popovers and dropdowns (NOT modals).
 *
 * Unlike `useModalA11y`, this hook does NOT trap focus, lock scroll, or
 * force autofocus. Popovers should let the user freely tab back to the
 * trigger and continue keyboard navigation through the page.
 *
 * What it does:
 * - Closes on Escape key (capturing phase so it fires before children).
 * - Restores focus to `triggerRef` when closed via Escape.
 *
 * @example
 *   const triggerRef = useRef<HTMLButtonElement>(null);
 *   useEscapeClose({ isOpen, onClose, triggerRef });
 *
 *   return (
 *     <button ref={triggerRef} onClick={toggle}>Open</button>
 *     {isOpen && <div role="menu">...</div>}
 *   );
 */
export function useEscapeClose({
  isOpen,
  onClose,
  triggerRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        // Return focus to the trigger so keyboard flow isn't lost
        if (triggerRef?.current) {
          triggerRef.current.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, triggerRef]);
}
