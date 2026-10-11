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
      navTitle: '字体设置',
      headerTitle: '字体与排版设置',
      headerSubtitle: '独立自定义左侧边栏、右侧主对话区、折叠思考及排版样式。',
      sidebarTitle: '左侧边栏字号',
      sidebarDesc: '控制项目目录树、历史会话列表及侧栏导航文本。',
      mainTitle: '对话正文字号',
      mainDesc: '控制 AI 回复正文、表格内容、用户消息气泡及底栏输入框。',
      lineHeightTitle: '正文行高比例',
      lineHeightDesc: '调整对话文本与表格内容的垂直行间距，提供更舒适的阅读排版。',
      thoughtTitle: '折叠与思考字号',
      thoughtDesc: '控制 AI 思考过程（Thought）、步骤折叠栏与工具执行输出文本。',
      thoughtAutoTag: '等比自适应',
      thoughtCustomTag: '独立自定义',
      codeTitle: '代码块字号',
      codeDesc: '控制等宽代码块与语法高亮区域字号。',
      customFontTitle: '自定义字体族',
      customFontDesc: '留空即使用系统默认字体。可输入系统已安装的字体名称，多个字体用逗号分隔。',
      uiFontLabel: '界面字体族',
      codeFontLabel: '代码等宽字体族',
      resetBtn: '恢复默认设置',
      langLabel: '界面语言',
      langEnBtn: '英文',
      langZhBtn: '简体中文',
      unitPx: 'px'
    },
    en: {
      navTitle: 'Font Settings',
      headerTitle: 'Font & Typography Settings',
      headerSubtitle: 'Customize typography for sidebar, conversation, thoughts, and code blocks.',
      sidebarTitle: 'Sidebar Font Size',
      sidebarDesc: 'Controls project tree, conversation history, and sidebar navigation items.',
      mainTitle: 'Conversation Text Size',
      mainDesc: 'Controls AI responses, tables, user messages, and prompt input text.',
      lineHeightTitle: 'Line Height Ratio',
      lineHeightDesc: 'Vertical spacing between lines for comfortable reading.',
      thoughtTitle: 'Thought & Folded Size',
      thoughtDesc: 'Controls AI thinking blocks, collapsible steps, and tool execution outputs.',
      thoughtAutoTag: 'Auto-scaled',
      thoughtCustomTag: 'Custom Size',
      codeTitle: 'Code Block Font Size',
      codeDesc: 'Controls preformatted monospace code blocks and code fences.',
      customFontTitle: 'Custom Font Families',
      customFontDesc: 'Leave blank to use system defaults. Enter installed font family names separated by commas.',
      uiFontLabel: 'UI Font Family',
      codeFontLabel: 'Code Font Family',
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

      /* Slim, elegant slider controls */
      .agy-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 4px;
        border-radius: 9999px;
        background: rgba(255, 255, 255, 0.14);
        outline: none;
        margin: 0;
        padding: 0;
        cursor: pointer;
        display: block;
      }
      .agy-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 13px;
        height: 13px;
        border-radius: 50%;
        background: #38bdf8;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
        cursor: pointer;
        transition: transform 0.12s ease, background-color 0.12s ease;
        border: 1.5px solid rgba(255, 255, 255, 0.9);
      }
      .agy-slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        background: #0284c7;
      }
      .agy-slider::-webkit-slider-thumb:active {
        transform: scale(1.05);
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

      /* Markdown Headings Typography: Hierarchical scaling based on mainFontSize */
      .bg-border.w-\\[1px\\] ~ div h1,
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]) h1,
      [data-testid="conversation-view"] h1 {
        font-size: calc(var(--agy-font-main) * 1.45) !important;
        line-height: 1.3 !important;
        font-weight: 700 !important;
        ${uiFont ? 'font-family: var(--agy-font-family-ui);' : ''}
      }
      .bg-border.w-\\[1px\\] ~ div h2:not(.bg-sidebar *):not([role="dialog"] *),
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]) h2:not(.bg-sidebar *):not([role="dialog"] *),
      [data-testid="conversation-view"] h2:not(.bg-sidebar *):not([role="dialog"] *) {
        font-size: calc(var(--agy-font-main) * 1.30) !important;
        line-height: 1.35 !important;
        font-weight: 650 !important;
        ${uiFont ? 'font-family: var(--agy-font-family-ui);' : ''}
      }
      .bg-border.w-\\[1px\\] ~ div h3,
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]) h3,
      [data-testid="conversation-view"] h3 {
        font-size: calc(var(--agy-font-main) * 1.15) !important;
        line-height: 1.4 !important;
        font-weight: 600 !important;
        ${uiFont ? 'font-family: var(--agy-font-family-ui);' : ''}
      }
      .bg-border.w-\\[1px\\] ~ div h4,
      .bg-border.w-\\[1px\\] ~ div h5,
      .bg-border.w-\\[1px\\] ~ div h6,
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]) h4,
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]) h5,
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]) h6,
      [data-testid="conversation-view"] h4,
      [data-testid="conversation-view"] h5,
      [data-testid="conversation-view"] h6 {
        font-size: calc(var(--agy-font-main) * 1.05) !important;
        line-height: 1.45 !important;
        font-weight: 600 !important;
        ${uiFont ? 'font-family: var(--agy-font-family-ui);' : ''}
      }

      /* Markdown Tables Typography: Strict 1:1 synchronization with mainFontSize */
      .bg-border.w-\\[1px\\] ~ div table,
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]) table,
      [data-testid="conversation-view"] table {
        font-size: var(--agy-font-main) !important;
        line-height: var(--agy-font-line-height) !important;
        ${uiFont ? 'font-family: var(--agy-font-family-ui);' : ''}
      }
      .bg-border.w-\\[1px\\] ~ div table th,
      .bg-border.w-\\[1px\\] ~ div table td,
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]) table th,
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]) table td,
      [data-testid="conversation-view"] table th,
      [data-testid="conversation-view"] table td {
        font-size: var(--agy-font-main) !important;
        line-height: var(--agy-font-line-height) !important;
        ${uiFont ? 'font-family: var(--agy-font-family-ui);' : ''}
      }
      .bg-border.w-\\[1px\\] ~ div table th,
      .relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\[1px\\]) table th,
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
    container.className = 'h-full w-full overflow-y-auto px-8 py-6 select-none';

    function buildHTML() {
      const curTexts = t();
      return `
        <div class="max-w-xl mx-auto space-y-4">
          <!-- Header -->
          <div class="mb-5">
            <h2 class="text-xl font-semibold text-foreground tracking-tight">${curTexts.headerTitle}</h2>
            <p class="text-xs text-secondary-foreground mt-1 leading-relaxed">${curTexts.headerSubtitle}</p>
          </div>

          <!-- 1. Sidebar Font Size -->
          <div class="bg-secondary/20 border border-border/50 rounded-xl p-4 flex flex-col gap-3">
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0 flex-1">
                <div class="text-xs font-semibold text-foreground">${curTexts.sidebarTitle}</div>
                <div class="text-[11px] text-secondary-foreground mt-0.5 leading-normal">${curTexts.sidebarDesc}</div>
              </div>
              <div class="flex items-center bg-background border border-border/80 rounded-md px-2 py-0.5 text-xs text-foreground shrink-0 shadow-sm">
                <input type="number" id="agy-input-sidebar" min="8" max="40" value="${currentPrefs.sidebarFontSize}" class="w-8 text-right bg-transparent outline-none font-mono text-xs pr-1 text-foreground" />
                <span class="text-[11px] text-secondary-foreground select-none">${curTexts.unitPx}</span>
              </div>
            </div>
            <div>
              <input type="range" id="agy-range-sidebar" min="10" max="24" step="1" value="${currentPrefs.sidebarFontSize}" class="agy-slider" />
            </div>
          </div>

          <!-- 2. Main Conversation Font Size -->
          <div class="bg-secondary/20 border border-border/50 rounded-xl p-4 flex flex-col gap-3">
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0 flex-1">
                <div class="text-xs font-semibold text-foreground">${curTexts.mainTitle}</div>
                <div class="text-[11px] text-secondary-foreground mt-0.5 leading-normal">${curTexts.mainDesc}</div>
              </div>
              <div class="flex items-center bg-background border border-border/80 rounded-md px-2 py-0.5 text-xs text-foreground shrink-0 shadow-sm">
                <input type="number" id="agy-input-main" min="9" max="60" value="${currentPrefs.mainFontSize}" class="w-8 text-right bg-transparent outline-none font-mono text-xs pr-1 text-foreground" />
                <span class="text-[11px] text-secondary-foreground select-none">${curTexts.unitPx}</span>
              </div>
            </div>
            <div>
              <input type="range" id="agy-range-main" min="11" max="36" step="1" value="${currentPrefs.mainFontSize}" class="agy-slider" />
            </div>
          </div>

          <!-- 3. Line Height Ratio -->
          <div class="bg-secondary/20 border border-border/50 rounded-xl p-4 flex flex-col gap-3">
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0 flex-1">
                <div class="text-xs font-semibold text-foreground">${curTexts.lineHeightTitle}</div>
                <div class="text-[11px] text-secondary-foreground mt-0.5 leading-normal">${curTexts.lineHeightDesc}</div>
              </div>
              <div class="flex items-center bg-background border border-border/80 rounded-md px-2 py-0.5 text-xs text-foreground shrink-0 shadow-sm">
                <input type="number" id="agy-input-line-height" min="1.0" max="3.0" step="0.05" value="${currentPrefs.lineHeight}" class="w-9 text-right bg-transparent outline-none font-mono text-xs text-foreground" />
              </div>
            </div>
            <div>
              <input type="range" id="agy-range-line-height" min="1.0" max="2.6" step="0.05" value="${currentPrefs.lineHeight}" class="agy-slider" />
            </div>
          </div>

          <!-- 4. Thought & Collapsible Font Size (Switch + Expandable Slider) -->
          <div class="bg-secondary/20 border border-border/50 rounded-xl p-4 flex flex-col gap-3">
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold text-foreground">${curTexts.thoughtTitle}</span>
                  <span id="agy-thought-tag" class="text-[10px] px-1.5 py-0.5 rounded-full ${currentPrefs.customThoughtFontSize ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary/60 text-secondary-foreground border border-border/60'}">${currentPrefs.customThoughtFontSize ? curTexts.thoughtCustomTag : curTexts.thoughtAutoTag}</span>
                </div>
                <div class="text-[11px] text-secondary-foreground mt-0.5 leading-normal">${curTexts.thoughtDesc}</div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button type="button" id="agy-switch-thought" role="switch" aria-checked="${currentPrefs.customThoughtFontSize ? 'true' : 'false'}" class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${currentPrefs.customThoughtFontSize ? 'bg-primary' : 'bg-secondary'}">
                  <span class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-md ring-0 transition duration-200 ease-in-out ${currentPrefs.customThoughtFontSize ? 'translate-x-4' : 'translate-x-0'}"></span>
                </button>
              </div>
            </div>
            <div id="agy-thought-slider-group" class="pt-1 flex flex-col gap-3 ${currentPrefs.customThoughtFontSize ? '' : 'hidden'}">
              <div class="flex items-center justify-between gap-4">
                <span class="text-[11px] text-secondary-foreground">${curTexts.thoughtTitle}</span>
                <div class="flex items-center bg-background border border-border/80 rounded-md px-2 py-0.5 text-xs text-foreground shrink-0 shadow-sm">
                  <input type="number" id="agy-input-thought" min="8" max="30" value="${currentPrefs.thoughtFontSize || 13}" class="w-8 text-right bg-transparent outline-none font-mono text-xs pr-1 text-foreground" />
                  <span class="text-[11px] text-secondary-foreground select-none">${curTexts.unitPx}</span>
                </div>
              </div>
              <div>
                <input type="range" id="agy-range-thought" min="9" max="24" step="1" value="${currentPrefs.thoughtFontSize || 13}" class="agy-slider" />
              </div>
            </div>
          </div>

          <!-- 5. Code Block Font Size -->
          <div class="bg-secondary/20 border border-border/50 rounded-xl p-4 flex flex-col gap-3">
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0 flex-1">
                <div class="text-xs font-semibold text-foreground">${curTexts.codeTitle}</div>
                <div class="text-[11px] text-secondary-foreground mt-0.5 leading-normal">${curTexts.codeDesc}</div>
              </div>
              <div class="flex items-center bg-background border border-border/80 rounded-md px-2 py-0.5 text-xs text-foreground shrink-0 shadow-sm">
                <input type="number" id="agy-input-code" min="8" max="40" value="${currentPrefs.codeFontSize}" class="w-8 text-right bg-transparent outline-none font-mono text-xs pr-1 text-foreground" />
                <span class="text-[11px] text-secondary-foreground select-none">${curTexts.unitPx}</span>
              </div>
            </div>
            <div>
              <input type="range" id="agy-range-code" min="10" max="28" step="1" value="${currentPrefs.codeFontSize}" class="agy-slider" />
            </div>
          </div>

          <!-- 6. Custom Font Families -->
          <div class="bg-secondary/20 border border-border/50 rounded-xl p-4 flex flex-col gap-3">
            <div>
              <div class="text-xs font-semibold text-foreground">${curTexts.customFontTitle}</div>
              <div class="text-[11px] text-secondary-foreground mt-0.5 leading-normal">${curTexts.customFontDesc}</div>
            </div>
            <div class="space-y-3 pt-1">
              <div>
                <label class="block text-[11px] font-medium text-secondary-foreground mb-1">${curTexts.uiFontLabel}</label>
                <input type="text" id="agy-input-font-family" placeholder='e.g. "PingFang SC", "Segoe UI", sans-serif' value="${currentPrefs.fontFamily || ''}" class="w-full px-2.5 py-1 text-xs bg-background border border-border/80 rounded-md text-foreground outline-none focus:border-primary shadow-sm" />
              </div>
              <div>
                <label class="block text-[11px] font-medium text-secondary-foreground mb-1">${curTexts.codeFontLabel}</label>
                <input type="text" id="agy-input-code-font-family" placeholder='e.g. "JetBrains Mono", "Cascadia Code", monospace' value="${currentPrefs.codeFontFamily || ''}" class="w-full px-2.5 py-1 text-xs bg-background border border-border/80 rounded-md text-foreground outline-none focus:border-primary shadow-sm" />
              </div>
            </div>
          </div>

          <!-- Bottom Bar: Language Switch & Reset Button -->
          <div class="flex items-center justify-between pt-3 pb-6 border-t border-border/40">
            <!-- Language Toggle Switch -->
            <div class="flex items-center gap-2">
              <span class="text-xs text-secondary-foreground font-medium">${curTexts.langLabel}</span>
              <div class="inline-flex items-center bg-secondary/50 p-0.5 rounded-lg border border-border/60 text-xs">
                <button type="button" id="agy-lang-en" class="px-2.5 py-1 rounded-md text-xs transition-all ${currentPrefs.language === 'en' ? 'bg-background text-foreground font-medium shadow-sm' : 'text-secondary-foreground hover:text-foreground'}">${curTexts.langEnBtn}</button>
                <button type="button" id="agy-lang-zh" class="px-2.5 py-1 rounded-md text-xs transition-all ${currentPrefs.language === 'zh' ? 'bg-background text-foreground font-medium shadow-sm' : 'text-secondary-foreground hover:text-foreground'}">${curTexts.langZhBtn}</button>
              </div>
            </div>

            <!-- Reset Button -->
            <button type="button" id="agy-btn-reset" class="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-secondary/60 text-secondary-foreground hover:bg-secondary hover:text-foreground transition-all cursor-pointer border border-border/60">
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
