(() => {
  if (typeof window.__agyFontSettingsCleanup === 'function') {
    try { window.__agyFontSettingsCleanup(); } catch {}
  }

  // Clean up any stale elements from previous versions
  document.querySelectorAll('#agy-font-settings-tab').forEach(e => e.remove());
  document.querySelectorAll('#agy-font-settings-panel').forEach(e => e.remove());

  const STORAGE_KEY = 'antigravity_font_settings_v1';
  const DEFAULT_PREFS = {
    sidebarFontSize: 14,
    mainFontSize: 15,
    codeFontSize: 13,
    lineHeight: 1.6,
    customThoughtFontSize: false,
    thoughtFontSize: 13,
    fontFamily: '',
    codeFontFamily: '',
    language: 'en'
  };

  const I18N = {
    zh: {
      navTitle: 'Font Settings',
      headerTitle: 'Font Settings',
      headerSubtitle: '针对对话正文、折叠思考、工作区侧栏及代码块，细粒度定制字号与排版比例。',
      sectionConversation: '对话与正文排版',
      mainTitle: '对话正文字号',
      mainDesc: '控制 AI 回复正文、表格内容、用户消息气泡及底栏输入框。',
      lineHeightTitle: '正文行高比例',
      lineHeightDesc: '调整对话文本与表格内容的垂直行间距，提供更舒适的阅读排版。',
      thoughtTitle: '折叠与思考字号',
      thoughtDesc: 'AI 思考过程（Thought）、步骤折叠栏与工具执行输出文本。',
      thoughtAutoTag: '等比自适应',
      thoughtCustomTag: '独立自定义',
      thoughtCustomLabel: '自定义折叠字号',
      codeTitle: '代码块字号',
      codeDesc: '控制等宽代码块与语法高亮区域字号。',
      sectionSidebar: '工作区导航',
      sidebarTitle: '左侧边栏字号',
      sidebarDesc: '控制项目目录树、历史会话列表及侧栏导航文本。',
      sectionFontFamily: '自定义字体族',
      uiFontLabel: '界面字体族',
      uiFontDesc: '留空使用系统默认字体',
      codeFontLabel: '代码等宽字体族',
      codeFontDesc: '留空使用系统默认等宽',
      resetBtn: '恢复默认设置',
      langLabel: '界面语言',
      langEnBtn: 'English',
      langZhBtn: '简体中文',
      unitPx: 'px'
    },
    en: {
      navTitle: 'Font Settings',
      headerTitle: 'Font Settings',
      headerSubtitle: 'Customize typography and font sizes for conversation, thoughts, sidebar, and code blocks.',
      sectionConversation: 'Conversation & Typography',
      mainTitle: 'Conversation Text Size',
      mainDesc: 'Controls AI responses, tables, user messages, and prompt input text.',
      lineHeightTitle: 'Line Height Ratio',
      lineHeightDesc: 'Vertical spacing between lines for comfortable reading.',
      thoughtTitle: 'Thought & Folded Size',
      thoughtDesc: 'Controls AI thinking blocks, collapsible steps, and tool execution outputs.',
      thoughtAutoTag: 'Auto-scaled',
      thoughtCustomTag: 'Custom Size',
      thoughtCustomLabel: 'Custom Folded Size',
      codeTitle: 'Code Block Font Size',
      codeDesc: 'Controls preformatted monospace code blocks and code fences.',
      sectionSidebar: 'Workspace Sidebar',
      sidebarTitle: 'Sidebar Font Size',
      sidebarDesc: 'Controls project tree, conversation history, and sidebar navigation items.',
      sectionFontFamily: 'Font Families',
      uiFontLabel: 'UI Font Family',
      uiFontDesc: 'Leave blank for system default',
      codeFontLabel: 'Code Font Family',
      codeFontDesc: 'Leave blank for system monospace',
      resetBtn: 'Reset to Defaults',
      langLabel: 'Language',
      langEnBtn: 'English',
      langZhBtn: 'Chinese',
      unitPx: 'px'
    }
  };

  function loadPrefs() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return Object.assign({}, DEFAULT_PREFS, JSON.parse(saved));
      }
    } catch {}
    return Object.assign({}, DEFAULT_PREFS);
  }

  let currentPrefs = loadPrefs();

  function t() {
    const lang = currentPrefs.language === 'en' ? 'en' : 'zh';
    return I18N[lang];
  }

  // 1. Inject or update custom CSS rules
  function applyStyles(prefs) {
    let style = document.getElementById('agy-font-settings-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'agy-font-settings-style';
      document.head.appendChild(style);
    }

    const sbSize = Math.max(8, Number(prefs.sidebarFontSize) || 14);
    const mainSize = Math.max(9, Number(prefs.mainFontSize) || 15);
    const codeSize = Math.max(8, Number(prefs.codeFontSize) || 13);
    const lHeight = Math.max(1, Number(prefs.lineHeight) || 1.6);
    const customThought = Boolean(prefs.customThoughtFontSize);
    const thoughtSize = customThought
      ? Math.max(8, Number(prefs.thoughtFontSize) || 13)
      : Math.round(mainSize * 0.85);
    const uiFont = (prefs.fontFamily || '').trim();
    const codeFont = (prefs.codeFontFamily || '').trim();

    style.textContent = `
      :root {
        --agy-font-sidebar: ${sbSize}px;
        --agy-font-main: ${mainSize}px;
        --agy-font-code: ${codeSize}px;
        --agy-font-thought: ${customThought ? `${thoughtSize}px` : `calc(var(--agy-font-main) * 0.85)`};
        --agy-font-line-height: ${lHeight};
        ${uiFont ? `--agy-font-family-ui: ${uiFont};` : ''}
        ${codeFont ? `--agy-font-family-code: ${codeFont};` : ''}
      }

      /* Slim, elegant slider controls adapting cleanly to both light & dark themes */
      .agy-slider {
        -webkit-appearance: none;
        appearance: none;
        height: 4px;
        border-radius: 9999px;
        background: var(--border, rgba(128, 128, 128, 0.25));
        outline: none;
        margin: 0;
        padding: 0;
        cursor: pointer;
        display: block;
        transition: background-color 0.15s ease;
      }
      .agy-slider:hover {
        background: var(--muted-foreground, rgba(128, 128, 128, 0.45));
      }
      .agy-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #0ea5e9;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
        cursor: pointer;
        transition: transform 0.12s ease, background-color 0.12s ease;
        border: 2px solid var(--background, #fff);
      }
      .agy-slider::-webkit-slider-thumb:hover {
        transform: scale(1.18);
        background: #0284c7;
      }
      .agy-slider::-webkit-slider-thumb:active {
        transform: scale(1.05);
      }

      /* Hide native number input spin arrows to eliminate number squeezing */
      #agy-font-settings-panel input[type="number"]::-webkit-inner-spin-button,
      #agy-font-settings-panel input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none !important;
        margin: 0 !important;
        display: none !important;
      }
      #agy-font-settings-panel input[type="number"] {
        -moz-appearance: textfield !important;
        appearance: textfield !important;
      }

      /* Left Sidebar Typography (Main app window only, strictly exclude settings modal) */
      body > #root .bg-sidebar:not([role="dialog"] *):not(.settings-modal-container *) {
        font-size: var(--agy-font-sidebar) !important;
        ${uiFont ? 'font-family: var(--agy-font-family-ui) !important;' : ''}
      }
      body > #root .bg-sidebar:not([role="dialog"] *):not(.settings-modal-container *) .text-xs {
        font-size: calc(var(--agy-font-sidebar) * 0.85) !important;
      }
      body > #root .bg-sidebar:not([role="dialog"] *):not(.settings-modal-container *) .text-sm {
        font-size: var(--agy-font-sidebar) !important;
      }
      body > #root .bg-sidebar:not([role="dialog"] *):not(.settings-modal-container *) .text-base {
        font-size: calc(var(--agy-font-sidebar) * 1.15) !important;
      }
      body > #root .bg-sidebar:not([role="dialog"] *):not(.settings-modal-container *) button,
      body > #root .bg-sidebar:not([role="dialog"] *):not(.settings-modal-container *) span,
      body > #root .bg-sidebar:not([role="dialog"] *):not(.settings-modal-container *) div {
        ${uiFont ? 'font-family: var(--agy-font-family-ui);' : ''}
      }

      /* Settings Modal Left Sidebar: Strictly lock to native sizes */
      [role="dialog"] .bg-sidebar,
      .settings-modal-container .bg-sidebar,
      [role="dialog"] .bg-sidebar button,
      .settings-modal-container .bg-sidebar button,
      [role="dialog"] .bg-sidebar span,
      .settings-modal-container .bg-sidebar span {
        font-size: 0.875rem !important; /* native text-sm = 14px */
      }
      [role="dialog"] .bg-sidebar .text-xs,
      .settings-modal-container .bg-sidebar .text-xs {
        font-size: 0.75rem !important; /* native text-xs = 12px */
      }
      [role="dialog"] .bg-sidebar .text-sm,
      .settings-modal-container .bg-sidebar .text-sm {
        font-size: 0.875rem !important; /* native text-sm = 14px */
      }

      /* Right Main Area Typography (Synchronized AI response, User message bubble, and Input) */
      .bg-border.w-\\[1px\\] ~ div,
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]) {
        ${uiFont ? 'font-family: var(--agy-font-family-ui);' : ''}
      }

      [class*="user-input-step"] .whitespace-pre-wrap,
      [class*="user-input-step"] [class*="whitespace-pre-wrap"],
      [class*="user-input-step"] .text-sm,
      [class*="user-input-step"] p,
      .bg-card .whitespace-pre-wrap,
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]) [class*="user-input-step"] .whitespace-pre-wrap,
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]) p,
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]) li,
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]) [class*="prose"],
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]) [class*="prose"] p,
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]) [class*="prose"] li,
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]) [class*="prose"] span:not([class*="lucide"]):not(svg *) {
        font-size: var(--agy-font-main) !important;
        line-height: var(--agy-font-line-height) !important;
        ${uiFont ? 'font-family: var(--agy-font-family-ui);' : ''}
      }

      /* Markdown Headings Typography: Hierarchical scaling based on mainFontSize (strictly exclude dialogs) */
      .bg-border.w-\\[1px\\] ~ div:not([role="dialog"]):not(.settings-modal-container) h1:not([role="dialog"] *):not(.settings-modal-container *),
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]):not([role="dialog"]):not(.settings-modal-container) h1:not([role="dialog"] *):not(.settings-modal-container *),
      [data-testid="conversation-view"] h1 {
        font-size: calc(var(--agy-font-main) * 1.45) !important;
        line-height: 1.3 !important;
        font-weight: 700 !important;
        ${uiFont ? 'font-family: var(--agy-font-family-ui);' : ''}
      }
      .bg-border.w-\\[1px\\] ~ div:not([role="dialog"]):not(.settings-modal-container) h2:not(.bg-sidebar *):not([role="dialog"] *):not(.settings-modal-container *),
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]):not([role="dialog"]):not(.settings-modal-container) h2:not(.bg-sidebar *):not([role="dialog"] *):not(.settings-modal-container *),
      [data-testid="conversation-view"] h2:not(.bg-sidebar *):not([role="dialog"] *):not(.settings-modal-container *) {
        font-size: calc(var(--agy-font-main) * 1.30) !important;
        line-height: 1.35 !important;
        font-weight: 650 !important;
        ${uiFont ? 'font-family: var(--agy-font-family-ui);' : ''}
      }
      .bg-border.w-\\[1px\\] ~ div:not([role="dialog"]):not(.settings-modal-container) h3:not([role="dialog"] *):not(.settings-modal-container *),
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]):not([role="dialog"]):not(.settings-modal-container) h3:not([role="dialog"] *):not(.settings-modal-container *),
      [data-testid="conversation-view"] h3:not([role="dialog"] *):not(.settings-modal-container *) {
        font-size: calc(var(--agy-font-main) * 1.15) !important;
        line-height: 1.4 !important;
        font-weight: 600 !important;
        ${uiFont ? 'font-family: var(--agy-font-family-ui);' : ''}
      }
      .bg-border.w-\\[1px\\] ~ div:not([role="dialog"]):not(.settings-modal-container) h4:not([role="dialog"] *):not(.settings-modal-container *),
      .bg-border.w-\\[1px\\] ~ div:not([role="dialog"]):not(.settings-modal-container) h5:not([role="dialog"] *):not(.settings-modal-container *),
      .bg-border.w-\\[1px\\] ~ div:not([role="dialog"]):not(.settings-modal-container) h6:not([role="dialog"] *):not(.settings-modal-container *),
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]):not([role="dialog"]):not(.settings-modal-container) h4:not([role="dialog"] *):not(.settings-modal-container *),
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]):not([role="dialog"]):not(.settings-modal-container) h5:not([role="dialog"] *):not(.settings-modal-container *),
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]):not([role="dialog"]):not(.settings-modal-container) h6:not([role="dialog"] *):not(.settings-modal-container *),
      [data-testid="conversation-view"] h4:not([role="dialog"] *):not(.settings-modal-container *),
      [data-testid="conversation-view"] h5:not([role="dialog"] *):not(.settings-modal-container *),
      [data-testid="conversation-view"] h6:not([role="dialog"] *):not(.settings-modal-container *) {
        font-size: calc(var(--agy-font-main) * 1.05) !important;
        line-height: 1.45 !important;
        font-weight: 600 !important;
        ${uiFont ? 'font-family: var(--agy-font-family-ui);' : ''}
      }

      /* Markdown Tables Typography: Strict 1:1 synchronization with mainFontSize (strictly exclude dialogs) */
      .bg-border.w-\\[1px\\] ~ div:not([role="dialog"]):not(.settings-modal-container) table:not([role="dialog"] *):not(.settings-modal-container *),
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]):not([role="dialog"]):not(.settings-modal-container) table:not([role="dialog"] *):not(.settings-modal-container *),
      [data-testid="conversation-view"] table {
        font-size: var(--agy-font-main) !important;
        line-height: var(--agy-font-line-height) !important;
        ${uiFont ? 'font-family: var(--agy-font-family-ui);' : ''}
      }
      .bg-border.w-\\[1px\\] ~ div:not([role="dialog"]):not(.settings-modal-container) table th:not([role="dialog"] *):not(.settings-modal-container *),
      .bg-border.w-\\[1px\\] ~ div:not([role="dialog"]):not(.settings-modal-container) table td:not([role="dialog"] *):not(.settings-modal-container *),
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]):not([role="dialog"]):not(.settings-modal-container) table th:not([role="dialog"] *):not(.settings-modal-container *),
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]):not([role="dialog"]):not(.settings-modal-container) table td:not([role="dialog"] *):not(.settings-modal-container *),
      [data-testid="conversation-view"] table th,
      [data-testid="conversation-view"] table td {
        font-size: var(--agy-font-main) !important;
        line-height: var(--agy-font-line-height) !important;
        ${uiFont ? 'font-family: var(--agy-font-family-ui);' : ''}
      }
      .bg-border.w-\\[1px\\] ~ div:not([role="dialog"]):not(.settings-modal-container) table th:not([role="dialog"] *):not(.settings-modal-container *),
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]):not([role="dialog"]):not(.settings-modal-container) table th:not([role="dialog"] *):not(.settings-modal-container *),
      [data-testid="conversation-view"] table th {
        font-weight: 600 !important;
      }

      /* Thought & Collapsible Sections Typography */
      [data-testid="thinking-collapsible-trigger"],
      [data-testid="thinking-collapsible-trigger"] *,
      div:has(> [data-testid="thinking-collapsible-trigger"]),
      div:has(> [data-testid="thinking-collapsible-trigger"]) *,
      [data-testid="tool-group-collapsible"],
      [data-testid="tool-group-collapsible"] *,
      [data-testid="worked-for-collapsible"],
      [data-testid="worked-for-collapsible"] *,
      div:has(> [data-testid="tool-group-collapsible"]),
      div:has(> [data-testid="tool-group-collapsible"]) *,
      div:has(> [data-testid="worked-for-collapsible"]),
      div:has(> [data-testid="worked-for-collapsible"]) *,
      [data-testid*="-step"]:not([data-testid="user-input-step"]),
      [data-testid*="-step"]:not([data-testid="user-input-step"]) *,
      [role="group"][aria-labelledby*=":r"],
      [role="group"][aria-labelledby*=":r"] * {
        font-size: var(--agy-font-thought) !important;
        line-height: 1.5 !important;
        ${uiFont ? 'font-family: var(--agy-font-family-ui);' : ''}
      }
      div:has(> [data-testid="thinking-collapsible-trigger"]) pre,
      div:has(> [data-testid="thinking-collapsible-trigger"]) code,
      [data-testid*="-step"]:not([data-testid="user-input-step"]) pre,
      [data-testid*="-step"]:not([data-testid="user-input-step"]) code,
      [role="group"][aria-labelledby*=":r"] pre,
      [role="group"][aria-labelledby*=":r"] code {
        font-size: var(--agy-font-thought) !important;
        ${codeFont ? 'font-family: var(--agy-font-family-code) !important;' : ''}
      }

      .bg-border.w-\\[1px\\] ~ div textarea,
      .bg-border.w-\\[1px\\] ~ div [contenteditable="true"],
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]) textarea,
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]) [contenteditable="true"] {
        font-size: var(--agy-font-main) !important;
        ${uiFont ? 'font-family: var(--agy-font-family-ui);' : ''}
      }

      /* Code Block Typography (Regular conversation pre & code outside thought/steps) */
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]) pre:not([data-testid*="-step"] pre):not(div:has(> [data-testid="thinking-collapsible-trigger"]) pre),
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]) code:not([data-testid*="-step"] code):not(div:has(> [data-testid="thinking-collapsible-trigger"]) code),
      [class*="code-block"], .monaco-editor {
        font-size: var(--agy-font-code) !important;
        ${codeFont ? 'font-family: var(--agy-font-family-code) !important;' : ''}
      }

      /* Settings Modal Font Tab Display */
      #agy-font-settings-panel {
        display: none;
      }
    `;
  }

  // 2. Save preferences and sync with backend
  function savePrefs(newPrefs) {
    currentPrefs = Object.assign({}, currentPrefs, newPrefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPrefs));
    } catch {}
    applyStyles(currentPrefs);
    if (typeof window.__agyFontSavePrefs === 'function') {
      try {
        window.__agyFontSavePrefs(JSON.stringify(currentPrefs));
      } catch {}
    }
  }

  applyStyles(currentPrefs);

  function getRightPane(dialog) {
    if (!dialog) dialog = document.querySelector('div[role="dialog"].settings-modal-container');
    if (!dialog) return null;
    const split = dialog.querySelector('.relative.flex.w-full.h-full.outline-none') ||
                  dialog.querySelector('.relative.flex.w-full.h-full');
    return split && split.children.length >= 2 ? split.children[1] : null;
  }

  function showFontSettingsPanel(dialog, tabBtn) {
    const rightPane = getRightPane(dialog);
    if (!rightPane) {
      requestAnimationFrame(() => showFontSettingsPanel(dialog, tabBtn));
      return;
    }

    // 1. Hide all native content views in rightPane
    for (const child of rightPane.children) {
      if (child.id !== 'agy-font-settings-panel') {
        child.style.setProperty('display', 'none', 'important');
      }
    }

    // 2. Ensure font settings panel exists in rightPane and is visible
    let panel = rightPane.querySelector('#agy-font-settings-panel');
    if (!panel) {
      panel = renderSettingsPanel(dialog, tabBtn);
      rightPane.appendChild(panel);
    }
    panel.style.setProperty('display', 'block', 'important');

    // 3. Highlight tabBtn and deactivate other buttons in sidebar
    const sidebar = dialog.querySelector('.bg-sidebar');
    if (sidebar) {
      sidebar.querySelectorAll('button').forEach(b => {
        if (b !== tabBtn) {
          b.classList.remove('bg-sidebar-secondary');
          const span = b.querySelector('span');
          if (span) {
            span.classList.remove('text-foreground');
            span.classList.add('text-secondary-foreground');
          }
        }
      });
    }

    tabBtn.classList.add('bg-sidebar-secondary');
    const tabSpan = tabBtn.querySelector('span');
    if (tabSpan) {
      tabSpan.classList.add('text-foreground');
      tabSpan.classList.remove('text-secondary-foreground');
    }
  }

  function hideFontSettingsPanel(dialog, tabBtn) {
    const rightPane = getRightPane(dialog);
    if (rightPane) {
      const panel = rightPane.querySelector('#agy-font-settings-panel');
      if (panel) {
        panel.style.setProperty('display', 'none', 'important');
      }
      for (const child of rightPane.children) {
        if (child.id !== 'agy-font-settings-panel') {
          child.style.removeProperty('display');
        }
      }
    }

    if (tabBtn) {
      tabBtn.classList.remove('bg-sidebar-secondary');
      const tabSpan = tabBtn.querySelector('span');
      if (tabSpan) {
        tabSpan.classList.remove('text-foreground');
        tabSpan.classList.add('text-secondary-foreground');
      }
    }
  }

  function injectTabAndPanel(dialog, appearanceBtn) {
    dialog.querySelectorAll('#agy-font-settings-tab').forEach(t => t.remove());
    const texts = t();

    // Create Nav Button (plain text, NO icon, perfectly matching Appearance / General)
    const tabBtn = document.createElement('button');
    tabBtn.id = 'agy-font-settings-tab';
    tabBtn.type = 'button';
    tabBtn.className = appearanceBtn.className || 'flex items-center gap-1.5 group mx-2 px-2 py-1 rounded-lg cursor-pointer border-none text-left transition-all outline-none hover:bg-sidebar-muted';
    tabBtn.innerHTML = `
      <span class="text-sm transition-colors select-none truncate flex-1 text-secondary-foreground group-hover:text-foreground">${texts.navTitle}</span>
    `;

    // Insert right after Appearance button
    appearanceBtn.parentElement.insertBefore(tabBtn, appearanceBtn.nextSibling);

    // Clicks on our tabBtn
    tabBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showFontSettingsPanel(dialog, tabBtn);
    });
    tabBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    tabBtn.addEventListener('mousedown', (e) => e.stopPropagation());

    // Listen on dialog with capture phase for clicks on other tabs
    const onDialogClick = (e) => {
      const clickedBtn = e.target.closest('button');
      if (!clickedBtn) return;
      if (clickedBtn === tabBtn || clickedBtn.id === 'agy-font-settings-tab') return;
      if (clickedBtn.closest('.bg-sidebar') || clickedBtn.querySelector('svg')) {
        hideFontSettingsPanel(dialog, tabBtn);
      }
    };
    dialog.addEventListener('click', onDialogClick, true);

    // Keep native views hidden if React re-renders while font settings is active
    const rightPane = getRightPane(dialog);
    if (rightPane) {
      const observer = new MutationObserver(() => {
        const panel = rightPane.querySelector('#agy-font-settings-panel');
        if (panel && panel.style.display === 'block') {
          for (const child of rightPane.children) {
            if (child.id !== 'agy-font-settings-panel' && child.style.display !== 'none') {
              child.style.setProperty('display', 'none', 'important');
            }
          }
        }
      });
      observer.observe(rightPane, { childList: true });
    }
  }

  // 3. Settings Modal Observer
  function setupSettingsObserver() {
    const checkAndInject = () => {
      const dialog = document.querySelector('div[role="dialog"].settings-modal-container');
      if (!dialog) return;

      if (dialog.querySelector('#agy-font-settings-tab')) return;

      const appearanceBtn = Array.from(dialog.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Appearance');
      if (!appearanceBtn) return;

      injectTabAndPanel(dialog, appearanceBtn);
    };

    const observer = new MutationObserver(checkAndInject);
    observer.observe(document.body, { childList: true, subtree: true });
    checkAndInject();
    return observer;
  }

  // 4. Render Settings Panel with clean spacing and language toggle
  function renderSettingsPanel(dialog, tabBtn) {
    const texts = t();
    const container = document.createElement('div');
    container.id = 'agy-font-settings-panel';
    container.className = 'h-full w-full overflow-y-auto px-8 py-6 pb-12 select-none';

    function buildHTML() {
      const curTexts = t();
      return `
        <div class="max-w-2xl mx-auto flex flex-col gap-6">
          <!-- Header -->
          <div class="flex flex-col gap-1 mb-1">
            <h2 class="text-xl m-0 font-medium truncate flex-1 text-foreground">${curTexts.headerTitle}</h2>
            <div class="text-sm text-muted-foreground bg-transparent">${curTexts.headerSubtitle}</div>
          </div>

          <!-- Section 1: Conversation & Typography -->
          <div class="space-y-2">
            <div class="px-0.5">
              <h3 class="m-0 text-sm font-medium text-foreground">${curTexts.sectionConversation}</h3>
            </div>
            <div class="bg-transparent rounded-xl border border-border overflow-hidden divide-y divide-border">
              
              <!-- 1. Conversation Text Size -->
              <div class="py-2 px-3 w-full bg-transparent flex justify-between gap-4 items-center hover:bg-secondary/15 transition-colors">
                <div class="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div class="flex items-center gap-1.5">
                    <span class="text-sm text-foreground">${curTexts.mainTitle}</span>
                  </div>
                  <span class="text-xs text-muted-foreground whitespace-pre-wrap leading-normal">${curTexts.mainDesc}</span>
                </div>
                <div class="shrink-0 flex items-center gap-3">
                  <input type="range" id="agy-range-main" min="11" max="36" step="1" value="${currentPrefs.mainFontSize}" class="agy-slider w-28 sm:w-36" />
                  <div class="flex items-center justify-center bg-background border border-border/80 rounded-md px-2 py-1 min-w-[54px] text-xs font-mono font-medium text-foreground shadow-sm shrink-0">
                    <input type="number" id="agy-input-main" min="9" max="60" value="${currentPrefs.mainFontSize}" class="w-7 text-right bg-transparent outline-none font-mono text-xs font-medium text-foreground pr-0.5" />
                    <span class="text-[11px] text-muted-foreground select-none">${curTexts.unitPx}</span>
                  </div>
                </div>
              </div>

              <!-- 2. Line Height Ratio -->
              <div class="py-2 px-3 w-full bg-transparent flex justify-between gap-4 items-center hover:bg-secondary/15 transition-colors">
                <div class="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div class="flex items-center gap-1.5">
                    <span class="text-sm text-foreground">${curTexts.lineHeightTitle}</span>
                  </div>
                  <span class="text-xs text-muted-foreground whitespace-pre-wrap leading-normal">${curTexts.lineHeightDesc}</span>
                </div>
                <div class="shrink-0 flex items-center gap-3">
                  <input type="range" id="agy-range-line-height" min="1.0" max="2.6" step="0.05" value="${currentPrefs.lineHeight}" class="agy-slider w-28 sm:w-36" />
                  <div class="flex items-center justify-center bg-background border border-border/80 rounded-md px-2 py-1 min-w-[48px] text-xs font-mono font-medium text-foreground shadow-sm shrink-0">
                    <input type="number" id="agy-input-line-height" min="1.0" max="3.0" step="0.05" value="${currentPrefs.lineHeight}" class="w-9 text-center bg-transparent outline-none font-mono text-xs font-medium text-foreground" />
                  </div>
                </div>
              </div>

              <!-- 3. Thought & Collapsible Font Size -->
              <div class="py-2 px-3 w-full bg-transparent flex flex-col gap-2 hover:bg-secondary/15 transition-colors">
                <div class="flex items-center justify-between gap-4">
                  <div class="flex-1 min-w-0 flex flex-col gap-0.5">
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-foreground">${curTexts.thoughtTitle}</span>
                      <span id="agy-thought-tag" class="text-[10px] px-2 py-0.5 rounded-full font-medium transition-all ${currentPrefs.customThoughtFontSize ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary text-secondary-foreground border border-border/60'}">${currentPrefs.customThoughtFontSize ? curTexts.thoughtCustomTag : curTexts.thoughtAutoTag}</span>
                    </div>
                    <span class="text-xs text-muted-foreground whitespace-pre-wrap leading-normal">${curTexts.thoughtDesc}</span>
                  </div>
                  <div class="shrink-0 flex items-center gap-2">
                    <button type="button" id="agy-switch-thought" role="switch" aria-checked="${currentPrefs.customThoughtFontSize ? 'true' : 'false'}" class="relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out shrink-0 h-6 w-11 cursor-pointer outline-none ${currentPrefs.customThoughtFontSize ? 'bg-primary' : 'bg-secondary'}">
                      <span class="inline-block rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm h-4 w-4" style="transform: ${currentPrefs.customThoughtFontSize ? 'translateX(24px)' : 'translateX(4px)'};"></span>
                    </button>
                  </div>
                </div>
                <!-- Sub-row when Custom is enabled -->
                <div id="agy-thought-slider-group" class="pt-2 mt-1 border-t border-border/50 flex items-center justify-between gap-4 ${currentPrefs.customThoughtFontSize ? '' : 'hidden'}">
                  <span class="text-xs text-muted-foreground">${curTexts.thoughtCustomLabel}</span>
                  <div class="shrink-0 flex items-center gap-3">
                    <input type="range" id="agy-range-thought" min="9" max="24" step="1" value="${currentPrefs.thoughtFontSize || 13}" class="agy-slider w-28 sm:w-36" />
                    <div class="flex items-center justify-center bg-background border border-border/80 rounded-md px-2 py-1 min-w-[54px] text-xs font-mono font-medium text-foreground shadow-sm shrink-0">
                      <input type="number" id="agy-input-thought" min="8" max="30" value="${currentPrefs.thoughtFontSize || 13}" class="w-7 text-right bg-transparent outline-none font-mono text-xs font-medium text-foreground pr-0.5" />
                      <span class="text-[11px] text-muted-foreground select-none">${curTexts.unitPx}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 4. Code Block Font Size -->
              <div class="py-2 px-3 w-full bg-transparent flex justify-between gap-4 items-center hover:bg-secondary/15 transition-colors">
                <div class="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div class="flex items-center gap-1.5">
                    <span class="text-sm text-foreground">${curTexts.codeTitle}</span>
                  </div>
                  <span class="text-xs text-muted-foreground whitespace-pre-wrap leading-normal">${curTexts.codeDesc}</span>
                </div>
                <div class="shrink-0 flex items-center gap-3">
                  <input type="range" id="agy-range-code" min="10" max="28" step="1" value="${currentPrefs.codeFontSize}" class="agy-slider w-28 sm:w-36" />
                  <div class="flex items-center justify-center bg-background border border-border/80 rounded-md px-2 py-1 min-w-[54px] text-xs font-mono font-medium text-foreground shadow-sm shrink-0">
                    <input type="number" id="agy-input-code" min="8" max="40" value="${currentPrefs.codeFontSize}" class="w-7 text-right bg-transparent outline-none font-mono text-xs font-medium text-foreground pr-0.5" />
                    <span class="text-[11px] text-muted-foreground select-none">${curTexts.unitPx}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Section 2: Workspace Sidebar -->
          <div class="space-y-2">
            <div class="px-0.5">
              <h3 class="m-0 text-sm font-medium text-foreground">${curTexts.sectionSidebar}</h3>
            </div>
            <div class="bg-transparent rounded-xl border border-border overflow-hidden divide-y divide-border">
              <div class="py-2 px-3 w-full bg-transparent flex justify-between gap-4 items-center hover:bg-secondary/15 transition-colors">
                <div class="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div class="flex items-center gap-1.5">
                    <span class="text-sm text-foreground">${curTexts.sidebarTitle}</span>
                  </div>
                  <span class="text-xs text-muted-foreground whitespace-pre-wrap leading-normal">${curTexts.sidebarDesc}</span>
                </div>
                <div class="shrink-0 flex items-center gap-3">
                  <input type="range" id="agy-range-sidebar" min="10" max="24" step="1" value="${currentPrefs.sidebarFontSize}" class="agy-slider w-28 sm:w-36" />
                  <div class="flex items-center justify-center bg-background border border-border/80 rounded-md px-2 py-1 min-w-[54px] text-xs font-mono font-medium text-foreground shadow-sm shrink-0">
                    <input type="number" id="agy-input-sidebar" min="8" max="40" value="${currentPrefs.sidebarFontSize}" class="w-7 text-right bg-transparent outline-none font-mono text-xs font-medium text-foreground pr-0.5" />
                    <span class="text-[11px] text-muted-foreground select-none">${curTexts.unitPx}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 3: Custom Font Families -->
          <div class="space-y-2">
            <div class="px-0.5">
              <h3 class="m-0 text-sm font-medium text-foreground">${curTexts.sectionFontFamily}</h3>
            </div>
            <div class="bg-transparent rounded-xl border border-border overflow-hidden divide-y divide-border">
              <!-- UI Font Family -->
              <div class="py-2.5 px-3 w-full flex flex-col gap-1.5 hover:bg-secondary/15 transition-colors">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-foreground">${curTexts.uiFontLabel}</span>
                  <span class="text-xs text-muted-foreground">${curTexts.uiFontDesc}</span>
                </div>
                <input type="text" id="agy-input-font-family" placeholder='e.g. "PingFang SC", "Segoe UI", sans-serif' value="${currentPrefs.fontFamily || ''}" class="w-full px-3 py-1.5 text-xs bg-background border border-border/80 rounded-lg text-foreground outline-none focus:border-primary shadow-sm" />
              </div>
              <!-- Code Font Family -->
              <div class="py-2.5 px-3 w-full flex flex-col gap-1.5 hover:bg-secondary/15 transition-colors">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-foreground">${curTexts.codeFontLabel}</span>
                  <span class="text-xs text-muted-foreground">${curTexts.codeFontDesc}</span>
                </div>
                <input type="text" id="agy-input-code-font-family" placeholder='e.g. "JetBrains Mono", "Cascadia Code", monospace' value="${currentPrefs.codeFontFamily || ''}" class="w-full px-3 py-1.5 text-xs bg-background border border-border/80 rounded-lg text-foreground outline-none focus:border-primary shadow-sm" />
              </div>
            </div>
          </div>

          <!-- Bottom Action Bar: Language Switch & Reset -->
          <div class="flex items-center justify-between pt-3 pb-10 border-t border-border/50">
            <div class="flex items-center gap-2.5">
              <span class="text-xs text-muted-foreground font-medium">${curTexts.langLabel}</span>
              <div class="inline-flex items-center bg-secondary/50 p-0.5 rounded-lg border border-border/60 text-xs">
                <button type="button" id="agy-lang-en" class="px-2.5 py-1 rounded-md text-xs font-medium transition-all ${currentPrefs.language === 'en' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}">${curTexts.langEnBtn}</button>
                <button type="button" id="agy-lang-zh" class="px-2.5 py-1 rounded-md text-xs font-medium transition-all ${currentPrefs.language === 'zh' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}">${curTexts.langZhBtn}</button>
              </div>
            </div>

            <button type="button" id="agy-btn-reset" class="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-foreground transition-all cursor-pointer border border-border/60 shadow-sm">
              ${curTexts.resetBtn}
            </button>
          </div>

        </div>
      `;
    }

    function setupEventListeners() {
      const rangeSidebar = container.querySelector('#agy-range-sidebar');
      const inputSidebar = container.querySelector('#agy-input-sidebar');
      const rangeMain = container.querySelector('#agy-range-main');
      const inputMain = container.querySelector('#agy-input-main');
      const rangeLineHeight = container.querySelector('#agy-range-line-height');
      const inputLineHeight = container.querySelector('#agy-input-line-height');
      const switchThought = container.querySelector('#agy-switch-thought');
      const rangeThought = container.querySelector('#agy-range-thought');
      const inputThought = container.querySelector('#agy-input-thought');
      const rangeCode = container.querySelector('#agy-range-code');
      const inputCode = container.querySelector('#agy-input-code');
      const inputFontFamily = container.querySelector('#agy-input-font-family');
      const inputCodeFontFamily = container.querySelector('#agy-input-code-font-family');
      const btnReset = container.querySelector('#agy-btn-reset');
      const btnEn = container.querySelector('#agy-lang-en');
      const btnZh = container.querySelector('#agy-lang-zh');

      function syncSidebar(val) {
        rangeSidebar.value = val;
        inputSidebar.value = val;
        savePrefs({ sidebarFontSize: Number(val) });
      }
      rangeSidebar.addEventListener('input', e => syncSidebar(e.target.value));
      inputSidebar.addEventListener('input', e => syncSidebar(e.target.value));

      function syncMain(val) {
        rangeMain.value = val;
        inputMain.value = val;
        savePrefs({ mainFontSize: Number(val) });
      }
      rangeMain.addEventListener('input', e => syncMain(e.target.value));
      inputMain.addEventListener('input', e => syncMain(e.target.value));

      function syncLineHeight(val) {
        rangeLineHeight.value = val;
        inputLineHeight.value = val;
        savePrefs({ lineHeight: Number(val) });
      }
      rangeLineHeight.addEventListener('input', e => syncLineHeight(e.target.value));
      inputLineHeight.addEventListener('input', e => syncLineHeight(e.target.value));

      function syncThought(val) {
        if (rangeThought) rangeThought.value = val;
        if (inputThought) inputThought.value = val;
        savePrefs({ thoughtFontSize: Number(val) });
      }
      if (rangeThought) rangeThought.addEventListener('input', e => syncThought(e.target.value));
      if (inputThought) inputThought.addEventListener('input', e => syncThought(e.target.value));

      if (switchThought) {
        switchThought.addEventListener('click', (e) => {
          e.preventDefault();
          const nextState = !currentPrefs.customThoughtFontSize;
          savePrefs({
            customThoughtFontSize: nextState,
            thoughtFontSize: currentPrefs.thoughtFontSize || 13
          });
          reRender();
        });
      }

      function syncCode(val) {
        rangeCode.value = val;
        inputCode.value = val;
        savePrefs({ codeFontSize: Number(val) });
      }
      rangeCode.addEventListener('input', e => syncCode(e.target.value));
      inputCode.addEventListener('input', e => syncCode(e.target.value));

      inputFontFamily.addEventListener('input', e => {
        savePrefs({ fontFamily: e.target.value });
      });

      inputCodeFontFamily.addEventListener('input', e => {
        savePrefs({ codeFontFamily: e.target.value });
      });

      function reRender() {
        container.innerHTML = buildHTML();
        setupEventListeners();
        // Update nav button text
        const navSpan = tabBtn?.querySelector('span');
        if (navSpan) {
          navSpan.textContent = t().navTitle;
        }
      }

      btnEn.addEventListener('click', () => {
        if (currentPrefs.language !== 'en') {
          savePrefs({ language: 'en' });
          reRender();
        }
      });

      btnZh.addEventListener('click', () => {
        if (currentPrefs.language !== 'zh') {
          savePrefs({ language: 'zh' });
          reRender();
        }
      });

      btnReset.addEventListener('click', () => {
        savePrefs(DEFAULT_PREFS);
        reRender();
      });
    }

    container.innerHTML = buildHTML();
    setupEventListeners();
    return container;
  }

  const modalObserver = setupSettingsObserver();
  window.__agyFontSettingsCleanup = () => {
    try { modalObserver.disconnect(); } catch {}
    document.querySelectorAll('#agy-font-settings-tab').forEach(e => e.remove());
    document.querySelectorAll('#agy-font-settings-panel').forEach(e => e.remove());
  };
})();
