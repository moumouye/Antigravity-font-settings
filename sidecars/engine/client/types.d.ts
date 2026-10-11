/**
 * TypeScript Type Definitions for Antigravity Font Settings Client Module.
 */

export interface FontPreferences {
  sidebarFontSize: number;
  mainFontSize: number;
  codeFontSize: number;
  lineHeight: number;
  customThoughtFontSize: boolean;
  thoughtFontSize: number;
  fontFamily: string;
  codeFontFamily: string;
  language: 'en' | 'zh';
}

export interface I18nTextMap {
  navTitle: string;
  headerTitle: string;
  headerSubtitle: string;
  sectionConversation: string;
  mainTitle: string;
  mainDesc: string;
  lineHeightTitle: string;
  lineHeightDesc: string;
  thoughtTitle: string;
  thoughtDesc: string;
  thoughtAutoTag: string;
  thoughtCustomTag: string;
  thoughtCustomLabel: string;
  codeTitle: string;
  codeDesc: string;
  sectionSidebar: string;
  sidebarTitle: string;
  sidebarDesc: string;
  sectionFontFamily: string;
  uiFontLabel: string;
  uiFontDesc: string;
  codeFontLabel: string;
  codeFontDesc: string;
  resetBtn: string;
  langLabel: string;
  langEnBtn: string;
  langZhBtn: string;
  unitPx: string;
}

export type I18nDictionary = Record<'en' | 'zh', I18nTextMap>;

declare global {
  interface Window {
    __agyFontSettingsCleanup?: () => void;
    __agyFontSavePrefs?: (prefsJson: string) => void;
  }
}
