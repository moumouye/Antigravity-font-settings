// @ts-check

/** @type {import('./types.js').FontPreferences} */
export const DEFAULT_PREFS = {
  sidebarFontSize: 14,
  mainFontSize: 15,
  lineHeight: 1.6,
  customThoughtFontSize: false,
  thoughtFontSize: 13,
  language: 'en'
};

/** @type {import('./types.js').I18nDictionary} */
export const I18N = {
  zh: {
    navTitle: 'Font Settings',
    headerTitle: 'Font Settings',
    headerSubtitle: '针对对话正文与代码块、折叠思考、工作区侧栏，细粒度定制字号与排版比例。',
    sectionConversation: '对话与正文排版',
    mainTitle: '对话正文字号',
    mainDesc: '控制 AI 回复正文、代码块、表格内容、用户消息气泡及底栏输入框。',
    lineHeightTitle: '正文行高比例',
    lineHeightDesc: '调整对话文本与表格内容的垂直行间距，提供更舒适的阅读排版。',
    thoughtTitle: '折叠与思考字号',
    thoughtDesc: 'AI 思考过程（Thought）、步骤折叠栏与工具执行输出文本。',
    thoughtAutoTag: '等比自适应',
    thoughtCustomTag: '独立自定义',
    thoughtCustomLabel: '自定义折叠字号',
    sectionSidebar: '工作区导航',
    sidebarTitle: '左侧边栏字号',
    sidebarDesc: '控制项目目录树、历史会话列表及侧栏导航文本。',
    resetBtn: '恢复默认设置',
    langLabel: '界面语言',
    langEnBtn: 'English',
    langZhBtn: '简体中文',
    unitPx: 'px'
  },
  en: {
    navTitle: 'Font Settings',
    headerTitle: 'Font Settings',
    headerSubtitle: 'Customize typography and font sizes for conversation & code blocks, thoughts, and workspace sidebar.',
    sectionConversation: 'Conversation & Typography',
    mainTitle: 'Conversation Text Size',
    mainDesc: 'Controls AI responses, code blocks, tables, user messages, and prompt input text.',
    lineHeightTitle: 'Line Height Ratio',
    lineHeightDesc: 'Vertical spacing between lines for comfortable reading.',
    thoughtTitle: 'Thought & Folded Size',
    thoughtDesc: 'Controls AI thinking blocks, collapsible steps, and tool execution outputs.',
    thoughtAutoTag: 'Auto-scaled',
    thoughtCustomTag: 'Custom Size',
    thoughtCustomLabel: 'Custom Folded Size',
    sectionSidebar: 'Workspace Sidebar',
    sidebarTitle: 'Sidebar Font Size',
    sidebarDesc: 'Controls project tree, conversation history, and sidebar navigation items.',
    resetBtn: 'Reset to Defaults',
    langLabel: 'Language',
    langEnBtn: 'English',
    langZhBtn: 'Chinese',
    unitPx: 'px'
  }
};

/**
 * Get i18n text mapping for current language
 * @param {string} [lang]
 * @returns {import('./types.js').I18nTextMap}
 */
export function getTexts(lang = 'en') {
  return lang === 'zh' ? I18N.zh : I18N.en;
}
