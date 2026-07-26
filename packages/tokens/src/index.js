/**
 * @cwl/tokens - single source of truth for the Code Without Limits design system.
 * Consumed by the web client (CSS variables), the Expo app (JS objects) and the
 * API (for server-rendered emails and certificates).
 */
import tokens from './tokens.json' with { type: 'json' };

/** Flat map of colour token name -> hex, e.g. colors.brand_primary === '#6F4A32' */
export const colors = Object.fromEntries(
  Object.entries(tokens.color).map(([key, def]) => [key, def.value])
);

export const typography = tokens.typography;
export const space = tokens.space;
export const radius = tokens.radius;
export const shadow = tokens.shadow;
export const motion = tokens.motion;
export const breakpoint = tokens.breakpoint;
export const meta = tokens.$meta;

/**
 * PRD section 3 contrast rule, encoded so it can be asserted in tests rather than
 * left as prose: text on a brand surface must be white; text on a sand surface
 * must be one of the two ink tokens.
 */
export const contrastRule = {
  brand_primary: ['on_brand'],
  brand_secondary: ['on_brand'],
  background_primary: ['text_primary', 'text_secondary'],
  background_secondary: ['text_primary', 'text_secondary']
};

export default tokens;
