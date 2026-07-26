import { StyleSheet } from 'react-native';
import theme from '../theme';

/**
 * Component styles mapped one-to-one to the table in PRD section 5, so a
 * primary button on Android is the same shape and colour as a primary button
 * on the website.
 */
export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.background_primary },
  content: { padding: theme.space['5'], paddingBottom: theme.space['8'] },

  h1: {
    fontFamily: theme.font.display,
    fontSize: theme.type.h1.fontSize,
    color: theme.color.text_primary,
    marginBottom: theme.space['3']
  },
  h2: {
    fontFamily: theme.font.display,
    fontSize: theme.type.h2.fontSize,
    color: theme.color.text_primary,
    marginBottom: theme.space['3']
  },
  h4: {
    fontFamily: theme.font.display,
    fontSize: theme.type.h4.fontSize,
    color: theme.color.text_primary
  },
  overline: {
    fontFamily: theme.font.display,
    ...theme.type.overline,
    color: theme.color.brand_primary,
    marginBottom: theme.space['2']
  },
  body: {
    fontFamily: theme.font.body,
    ...theme.type.body,
    color: theme.color.text_secondary
  },
  bodyStrong: {
    fontFamily: theme.font.body,
    ...theme.type.body,
    color: theme.color.text_primary
  },
  caption: {
    fontFamily: theme.font.body,
    ...theme.type.caption,
    color: theme.color.text_secondary
  },

  card: {
    backgroundColor: theme.color.background_secondary,
    borderColor: theme.color.border_subtle,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.space['5'],
    marginBottom: theme.space['4'],
    ...theme.shadow.card
  },

  btnPrimary: {
    backgroundColor: theme.color.brand_primary,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.space['4'],
    paddingHorizontal: theme.space['5'],
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center'
  },
  btnPrimaryPressed: { backgroundColor: theme.color.brand_primary_active },
  btnPrimaryText: {
    fontFamily: theme.font.display,
    fontSize: 16,
    color: theme.color.on_brand
  },

  btnSecondary: {
    backgroundColor: theme.color.background_primary,
    borderColor: theme.color.border_subtle,
    borderWidth: 1,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.space['4'],
    paddingHorizontal: theme.space['5'],
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center'
  },
  btnSecondaryText: {
    fontFamily: theme.font.display,
    fontSize: 16,
    color: theme.color.text_primary
  },

  input: {
    backgroundColor: theme.color.background_secondary,
    borderColor: theme.color.border_subtle,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingVertical: theme.space['3'],
    paddingHorizontal: theme.space['4'],
    fontFamily: theme.font.body,
    fontSize: 16,
    color: theme.color.text_primary,
    minHeight: 48,
    marginBottom: theme.space['4']
  },
  inputFocused: { borderColor: theme.color.brand_primary, borderWidth: 2 },
  inputInvalid: { borderColor: theme.color.danger, borderWidth: 2 },

  meterTrack: {
    height: 10,
    backgroundColor: theme.color.border_subtle,
    borderRadius: theme.radius.pill,
    overflow: 'hidden'
  },
  meterFill: {
    height: '100%',
    backgroundColor: theme.color.brand_secondary,
    borderRadius: theme.radius.pill
  },

  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space['3'],
    backgroundColor: theme.color.background_secondary,
    borderColor: theme.color.border_subtle,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.space['4'],
    marginBottom: theme.space['3']
  },
  optionSelected: {
    borderColor: theme.color.brand_primary,
    borderWidth: 2,
    backgroundColor: theme.color.accent_warm
  },
  optionCorrect: { borderColor: theme.color.success, borderWidth: 2 },
  optionIncorrect: { borderColor: theme.color.danger, borderWidth: 2 },

  notice: {
    backgroundColor: theme.color.background_secondary,
    borderColor: theme.color.border_subtle,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.space['4'],
    marginBottom: theme.space['4']
  },
  noticeDanger: { borderColor: theme.color.danger },
  noticeSuccess: { borderColor: theme.color.success }
});

export default ui;
