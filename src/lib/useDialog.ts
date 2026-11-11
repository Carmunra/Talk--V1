import { useEffect, useRef } from 'react';

// Keep keyboard navigation in the open dialog and return focus to its trigger.
export function useDialog(onClose: () => void, canClose = true, enabled = true) {
  const ref = useRef<HTMLDivElement>(null);
  const action = useRef({ onClose, canClose });
  action.current = { onClose, canClose };
  useEffect(() => {
    if (!enabled) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = ref.current;
    if (!panel) return;
    const focusable = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), iframe, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length && !element.hasAttribute('hidden'));
    (focusable()[0] || panel).focus();
    const containFocus = (event: FocusEvent) => {
      if (!panel.contains(event.target as Node)) (focusable()[0] || panel).focus();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && action.current.canClose) {
        event.preventDefault();
        action.current.onClose();
      }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0],
        last = elements.at(-1);
      if (!first || !last) {
        event.preventDefault();
        panel.focus();
      } else if (
        !panel.contains(document.activeElement) ||
        document.activeElement === panel ||
        (event.shiftKey && document.activeElement === first) ||
        (!event.shiftKey && document.activeElement === last)
      ) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('focusin', containFocus);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('focusin', containFocus);
      if (previous?.isConnected) previous.focus();
    };
  }, [enabled]);
  return ref;
}
