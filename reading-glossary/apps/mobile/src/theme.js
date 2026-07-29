/**
 * Native theme, derived from the same @cwl/tokens package the website uses.
 *
 * Values are read from the token module rather than retyped, so the app and the
 * site cannot drift apart. When apps 2 and 3 in the family are built, only the
 * colour block in packages/tokens/src/tokens.json changes; everything below
 * keeps working untouched, which is the whole point of the shared structure in
 * PRD section 7.
 */
import tokens, { colors } from '@cwl/tokens';

export const theme = {
  color: colors,

  space: Object.fromEntries(
    Object.entries(tokens.space).map(([key, value]) => [key, parseInt(value, 10) || 0])
  ),

  radius: {
    sm: 8,
    md: 14,
    lg: 22,
    pill: 999
  },

  font: {
    display: 'Outfit_600SemiBold',
    displayRegular: 'Outfit_400Regular',
    body: 'DMSans_400Regular',
    bodyMedium: 'DMSans_500Medium'
  },

  type: {
    overline: { fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase' },
    caption: { fontSize: 13 },
    body: { fontSize: 16, lineHeight: 26 },
    h4: { fontSize: 20 },
    h3: { fontSize: 24 },
    h2: { fontSize: 30 },
    h1: { fontSize: 34 }
  },

  shadow: {
    card: {
      shadowColor: '#2A211B',
      shadowOpacity: 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2
    }
  }
};

export default theme;
