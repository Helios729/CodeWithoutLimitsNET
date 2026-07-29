/**
 * Inline status icons.
 *
 * These exist so that meaning never rests on colour alone (WCAG 1.4.1). An
 * error is a red message AND a warning triangle AND the word "error"; a
 * colour-blind learner, or anyone on a failing screen, still gets the signal.
 *
 * Drawn inline rather than pulled from an icon font so they work with no
 * network request and no external dependency - which matters for the
 * low-bandwidth audience this product is built for.
 */

const base = { width: '1em', height: '1em', viewBox: '0 0 24 24', 'aria-hidden': true, focusable: false };

export function WarningIcon({ size = 18, style }) {
  return (
    <svg {...base} style={{ width: size, height: size, flexShrink: 0, ...style }}>
      <path
        fill="currentColor"
        d="M12 2 1 21h22L12 2Zm0 5.5a1 1 0 0 1 1 1v5a1 1 0 0 1-2 0v-5a1 1 0 0 1 1-1Zm0 9.25a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z"
      />
    </svg>
  );
}

export function CheckIcon({ size = 18, style }) {
  return (
    <svg {...base} style={{ width: size, height: size, flexShrink: 0, ...style }}>
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.2 14.2-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7Z"
      />
    </svg>
  );
}

export function CrossIcon({ size = 18, style }) {
  return (
    <svg {...base} style={{ width: size, height: size, flexShrink: 0, ...style }}>
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm3.5 12.1-1.4 1.4L12 13.4l-2.1 2.1-1.4-1.4L10.6 12 8.5 9.9l1.4-1.4L12 10.6l2.1-2.1 1.4 1.4L13.4 12l2.1 2.1Z"
      />
    </svg>
  );
}
