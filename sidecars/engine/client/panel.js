// @ts-check

/**
 * @typedef {import('./types.js').FontPreferences} FontPreferences
 * @typedef {import('./types.js').I18nTextMap} I18nTextMap
 */

/**
 * Initialize Font Settings client injector inside Antigravity workbench renderer
 * @param {string} clientStyles - Raw CSS stylesheet rules
 * @param {FontPreferences} defaultPrefs - Default preference options
 * @param {(lang?: string) => I18nTextMap} getTexts - Function returning i18n text map
 */
export function initClient(clientStyles, defaultPrefs, getTexts) {
  if (typeof window.__agyFontSettingsCleanup === 'function') {
    try { window.__agyFontSettingsCleanup(); } catch {}
  }

  // Clean up any stale elements from previous versions
  document.querySelectorAll('#agy-font-settings-tab').forEach(e => e.remove());
  document.querySelectorAll('#agy-font-settings-panel').forEach(e => e.remove());

  const STORAGE_KEY = 'antigravity_font_settings_v1';

  /**
   * @returns {FontPreferences}
   */
  function loadPrefs() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return Object.assign({}, defaultPrefs, JSON.parse(saved));
      }
    } catch {}
    return Object.assign({}, defaultPrefs);
  }

  let currentPrefs = loadPrefs();

  function t() {
    return getTexts(currentPrefs.language);
  }

  // 1. Inject or update custom CSS stylesheet and root variables
  /**
   * @param {FontPreferences} prefs
   */
  function applyStyles(prefs) {
    let style = document.getElementById('agy-font-settings-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'agy-font-settings-style';
      (document.head || document.documentElement).appendChild(style);
    }

    const sbSize = Math.max(8, Number(prefs.sidebarFontSize) || 14);
    const mainSize = Math.max(9, Number(prefs.mainFontSize) || 15);
    const lHeight = Math.max(1, Number(prefs.lineHeight) || 1.6);
    const customThought = Boolean(prefs.customThoughtFontSize);
    const thoughtSize = customThought
      ? Math.max(8, Number(prefs.thoughtFontSize) || 13)
      : Math.round(mainSize * 0.85);

    const rootVars = `
      :root {
        --agy-font-sidebar: ${sbSize}px;
        --agy-font-main: ${mainSize}px;
        --agy-font-code: var(--agy-font-main);
        --agy-font-thought: ${customThought ? `${thoughtSize}px` : `calc(var(--agy-font-main) * 0.85)`};
        --agy-font-line-height: ${lHeight};
      }
    `;

    style.textContent = rootVars + '\n' + clientStyles;
  }

  // 2. Save preferences and sync with backend
  /**
   * @param {Partial<FontPreferences>} newPrefs
   */
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

  /**
   * @param {Element | null} [dialog]
   * @returns {Element | null}
   */
  function getRightPane(dialog) {
    if (!dialog) dialog = document.querySelector('div[role="dialog"].settings-modal-container');
    if (!dialog) return null;
    const split = dialog.querySelector('.relative.flex.w-full.h-full.outline-none') ||
                  dialog.querySelector('.relative.flex.w-full.h-full');
    return split && split.children.length >= 2 ? split.children[1] : null;
  }

  /**
   * @param {Element} dialog
   * @param {HTMLElement} tabBtn
   */
  function showFontSettingsPanel(dialog, tabBtn) {
    const rightPane = getRightPane(dialog);
    if (!rightPane) {
      requestAnimationFrame(() => showFontSettingsPanel(dialog, tabBtn));
      return;
    }

    // 1. Hide all native content views in rightPane
    for (const child of Array.from(rightPane.children)) {
      if (child.id !== 'agy-font-settings-panel' && child instanceof HTMLElement) {
        child.style.setProperty('display', 'none', 'important');
      }
    }

    // 2. Ensure font settings panel exists in rightPane and is visible
    let panel = rightPane.querySelector('#agy-font-settings-panel');
    if (!panel) {
      panel = renderSettingsPanel(dialog, tabBtn);
      rightPane.appendChild(panel);
    }
    if (panel instanceof HTMLElement) {
      panel.style.setProperty('display', 'block', 'important');
    }

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

  /**
   * @param {Element} dialog
   * @param {HTMLElement | null} [tabBtn]
   */
  function hideFontSettingsPanel(dialog, tabBtn) {
    const rightPane = getRightPane(dialog);
    if (rightPane) {
      const panel = rightPane.querySelector('#agy-font-settings-panel');
      if (panel instanceof HTMLElement) {
        panel.style.setProperty('display', 'none', 'important');
      }
      for (const child of Array.from(rightPane.children)) {
        if (child.id !== 'agy-font-settings-panel' && child instanceof HTMLElement) {
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

  /**
   * @param {Element} dialog
   * @param {HTMLButtonElement} appearanceBtn
   */
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
    if (appearanceBtn.parentElement) {
      appearanceBtn.parentElement.insertBefore(tabBtn, appearanceBtn.nextSibling);
    }

    // Clicks on our tabBtn
    tabBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showFontSettingsPanel(dialog, tabBtn);
    });
    tabBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    tabBtn.addEventListener('mousedown', (e) => e.stopPropagation());

    // Listen on dialog with capture phase for clicks on other tabs
    /**
     * @param {MouseEvent} e
     */
    const onDialogClick = (e) => {
      const target = /** @type {Element | null} */ (e.target);
      const clickedBtn = target?.closest('button');
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
        if (panel instanceof HTMLElement && panel.style.display === 'block') {
          for (const child of Array.from(rightPane.children)) {
            if (child.id !== 'agy-font-settings-panel' && child instanceof HTMLElement && child.style.display !== 'none') {
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
      const dialog = document.querySelector('div[role="dialog"].settings-modal-container') ||
                     document.querySelector('div[role="dialog"][aria-label="Settings"]') ||
                     document.querySelector('div[role="dialog"]');
      if (!dialog) return;

      if (dialog.querySelector('#agy-font-settings-tab')) return;

      const appearanceBtn = /** @type {HTMLButtonElement | undefined} */ (
        Array.from(dialog.querySelectorAll('button')).find(b => {
          const txt = b.textContent?.trim();
          return txt === 'Appearance' || txt === '外观';
        })
      );
      if (!appearanceBtn) return;

      injectTabAndPanel(dialog, appearanceBtn);
    };

    const target = document.body || document.documentElement;
    const observer = new MutationObserver(checkAndInject);
    if (target) {
      observer.observe(target, { childList: true, subtree: true });
    }
    checkAndInject();
    return observer;
  }

  // 4. Render Settings Panel with clean spacing and language toggle
  /**
   * @param {Element} dialog
   * @param {HTMLElement} tabBtn
   * @returns {HTMLElement}
   */
  function renderSettingsPanel(dialog, tabBtn) {
    const container = document.createElement('div');
    container.id = 'agy-font-settings-panel';
    container.className = 'h-full w-full overflow-y-auto px-8 py-6 pb-12 select-none';

    function buildHTML() {
      const curTexts = t();
      return `
        <div class="max-w-2xl mx-auto flex flex-col gap-6">
          <!-- Header -->
          <div class="agy-peek-hide flex flex-col gap-1 mb-1">
            <h2 class="text-xl m-0 font-medium truncate flex-1 text-foreground">${curTexts.headerTitle}</h2>
            <div class="text-sm text-muted-foreground bg-transparent">${curTexts.headerSubtitle}</div>
          </div>

          <!-- Section 1: Conversation & Typography -->
          <div class="space-y-2">
            <div class="agy-peek-hide px-0.5">
              <h3 class="m-0 text-sm font-medium text-foreground">${curTexts.sectionConversation}</h3>
            </div>
            <div class="bg-transparent rounded-xl border border-border overflow-hidden divide-y divide-border">
              
              <!-- 1. Conversation Text Size -->
              <div class="agy-setting-row py-2 px-3 w-full bg-transparent flex justify-between gap-4 items-center hover:bg-secondary/15 transition-colors">
                <div class="agy-row-label flex-1 min-w-0 flex flex-col gap-0.5">
                  <div class="flex items-center gap-1.5">
                    <span class="text-sm text-foreground">${curTexts.mainTitle}</span>
                  </div>
                  <span class="text-xs text-muted-foreground whitespace-pre-wrap leading-normal">${curTexts.mainDesc}</span>
                </div>
                <div class="agy-slider-control-group shrink-0 flex items-center justify-end gap-3 w-56 sm:w-64">
                  <input type="range" id="agy-range-main" min="11" max="36" step="1" value="${currentPrefs.mainFontSize}" class="agy-slider w-28 sm:w-36 shrink-0" />
                  <div class="agy-number-capsule flex items-center justify-end bg-background border border-border/80 rounded-md px-1.5 py-1 w-[62px] h-7 text-xs font-mono font-medium text-foreground shadow-sm shrink-0">
                    <input type="number" id="agy-input-main" min="9" max="60" value="${currentPrefs.mainFontSize}" class="w-8 text-right bg-transparent outline-none font-mono text-xs font-semibold text-foreground pr-0.5" />
                    <span class="text-[11px] text-muted-foreground select-none w-3.5 text-left shrink-0">${curTexts.unitPx}</span>
                  </div>
                </div>
              </div>

              <!-- 2. Line Height Ratio -->
              <div class="agy-setting-row py-2 px-3 w-full bg-transparent flex justify-between gap-4 items-center hover:bg-secondary/15 transition-colors">
                <div class="agy-row-label flex-1 min-w-0 flex flex-col gap-0.5">
                  <div class="flex items-center gap-1.5">
                    <span class="text-sm text-foreground">${curTexts.lineHeightTitle}</span>
                  </div>
                  <span class="text-xs text-muted-foreground whitespace-pre-wrap leading-normal">${curTexts.lineHeightDesc}</span>
                </div>
                <div class="agy-slider-control-group shrink-0 flex items-center justify-end gap-3 w-56 sm:w-64">
                  <input type="range" id="agy-range-line-height" min="1.0" max="2.6" step="0.05" value="${currentPrefs.lineHeight}" class="agy-slider w-28 sm:w-36 shrink-0" />
                  <div class="agy-number-capsule flex items-center justify-end bg-background border border-border/80 rounded-md px-1.5 py-1 w-[62px] h-7 text-xs font-mono font-medium text-foreground shadow-sm shrink-0">
                    <input type="number" id="agy-input-line-height" min="1.0" max="3.0" step="0.05" value="${currentPrefs.lineHeight}" class="w-8 text-right bg-transparent outline-none font-mono text-xs font-semibold text-foreground pr-0.5" />
                    <span class="text-[11px] text-muted-foreground/70 select-none w-3.5 text-left shrink-0">x</span>
                  </div>
                </div>
              </div>

              <!-- 3. Thought & Collapsible Font Size -->
              <div class="agy-setting-row py-2 px-3 w-full bg-transparent flex flex-col gap-2 hover:bg-secondary/15 transition-colors">
                <div class="flex items-center justify-between gap-4">
                  <div class="agy-row-label flex-1 min-w-0 flex flex-col gap-0.5">
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-foreground">${curTexts.thoughtTitle}</span>
                      <span id="agy-thought-tag" class="text-[10px] px-2 py-0.5 rounded-full font-medium transition-all ${currentPrefs.customThoughtFontSize ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary text-secondary-foreground border border-border/60'}">${currentPrefs.customThoughtFontSize ? curTexts.thoughtCustomTag : curTexts.thoughtAutoTag}</span>
                    </div>
                    <span class="text-xs text-muted-foreground whitespace-pre-wrap leading-normal">${curTexts.thoughtDesc}</span>
                  </div>
                  <div class="shrink-0 flex items-center justify-end w-56 sm:w-64">
                    <button type="button" id="agy-switch-thought" role="switch" aria-checked="${currentPrefs.customThoughtFontSize ? 'true' : 'false'}" class="relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out shrink-0 h-6 w-11 cursor-pointer outline-none ${currentPrefs.customThoughtFontSize ? 'bg-primary' : 'bg-secondary'}">
                      <span class="inline-block rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm h-4 w-4" style="transform: ${currentPrefs.customThoughtFontSize ? 'translateX(24px)' : 'translateX(4px)'};"></span>
                    </button>
                  </div>
                </div>
                <!-- Sub-row when Custom is enabled -->
                <div id="agy-thought-slider-group" class="agy-setting-row pt-2 mt-1 border-t border-border/50 flex items-center justify-between gap-4 ${currentPrefs.customThoughtFontSize ? '' : 'hidden'}">
                  <span class="agy-row-label text-xs text-muted-foreground">${curTexts.thoughtCustomLabel}</span>
                  <div class="agy-slider-control-group shrink-0 flex items-center justify-end gap-3 w-56 sm:w-64">
                    <input type="range" id="agy-range-thought" min="9" max="24" step="1" value="${currentPrefs.thoughtFontSize || 13}" class="agy-slider w-28 sm:w-36 shrink-0" />
                    <div class="agy-number-capsule flex items-center justify-end bg-background border border-border/80 rounded-md px-1.5 py-1 w-[62px] h-7 text-xs font-mono font-medium text-foreground shadow-sm shrink-0">
                      <input type="number" id="agy-input-thought" min="8" max="30" value="${currentPrefs.thoughtFontSize || 13}" class="w-8 text-right bg-transparent outline-none font-mono text-xs font-semibold text-foreground pr-0.5" />
                      <span class="text-[11px] text-muted-foreground select-none w-3.5 text-left shrink-0">${curTexts.unitPx}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Section 2: Workspace Sidebar -->
          <div class="space-y-2">
            <div class="agy-peek-hide px-0.5">
              <h3 class="m-0 text-sm font-medium text-foreground">${curTexts.sectionSidebar}</h3>
            </div>
            <div class="bg-transparent rounded-xl border border-border overflow-hidden divide-y divide-border">
              <div class="agy-setting-row py-2 px-3 w-full bg-transparent flex justify-between gap-4 items-center hover:bg-secondary/15 transition-colors">
                <div class="agy-row-label flex-1 min-w-0 flex flex-col gap-0.5">
                  <div class="flex items-center gap-1.5">
                    <span class="text-sm text-foreground">${curTexts.sidebarTitle}</span>
                  </div>
                  <span class="text-xs text-muted-foreground whitespace-pre-wrap leading-normal">${curTexts.sidebarDesc}</span>
                </div>
                <div class="agy-slider-control-group shrink-0 flex items-center justify-end gap-3 w-56 sm:w-64">
                  <input type="range" id="agy-range-sidebar" min="10" max="24" step="1" value="${currentPrefs.sidebarFontSize}" class="agy-slider w-28 sm:w-36 shrink-0" />
                  <div class="agy-number-capsule flex items-center justify-end bg-background border border-border/80 rounded-md px-1.5 py-1 w-[62px] h-7 text-xs font-mono font-medium text-foreground shadow-sm shrink-0">
                    <input type="number" id="agy-input-sidebar" min="8" max="40" value="${currentPrefs.sidebarFontSize}" class="w-8 text-right bg-transparent outline-none font-mono text-xs font-semibold text-foreground pr-0.5" />
                    <span class="text-[11px] text-muted-foreground select-none w-3.5 text-left shrink-0">${curTexts.unitPx}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Action Bar: Language Switch & Reset -->
          <div class="agy-peek-hide flex items-center justify-between pt-3 pb-10 border-t border-border/50">
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
      const rangeSidebar = /** @type {HTMLInputElement | null} */ (container.querySelector('#agy-range-sidebar'));
      const inputSidebar = /** @type {HTMLInputElement | null} */ (container.querySelector('#agy-input-sidebar'));
      const rangeMain = /** @type {HTMLInputElement | null} */ (container.querySelector('#agy-range-main'));
      const inputMain = /** @type {HTMLInputElement | null} */ (container.querySelector('#agy-input-main'));
      const rangeLineHeight = /** @type {HTMLInputElement | null} */ (container.querySelector('#agy-range-line-height'));
      const inputLineHeight = /** @type {HTMLInputElement | null} */ (container.querySelector('#agy-input-line-height'));
      const switchThought = /** @type {HTMLButtonElement | null} */ (container.querySelector('#agy-switch-thought'));
      const rangeThought = /** @type {HTMLInputElement | null} */ (container.querySelector('#agy-range-thought'));
      const inputThought = /** @type {HTMLInputElement | null} */ (container.querySelector('#agy-input-thought'));
      const btnReset = /** @type {HTMLButtonElement | null} */ (container.querySelector('#agy-btn-reset'));
      const btnEn = /** @type {HTMLButtonElement | null} */ (container.querySelector('#agy-lang-en'));
      const btnZh = /** @type {HTMLButtonElement | null} */ (container.querySelector('#agy-lang-zh'));

      /**
       * Enable transparent peeking mode during slider drag/adjustment
       * @param {HTMLInputElement} slider
       */
      function bindSliderPeeking(slider) {
        const row = /** @type {HTMLElement | null} */ (slider.closest('.agy-setting-row'));
        const controlGroup = /** @type {HTMLElement | null} */ (slider.closest('.agy-slider-control-group'));
        if (!row || !controlGroup) return;

        const startPeeking = () => {
          document.body.classList.add('agy-peeking');
          row.classList.add('agy-active-peeking-row');
          controlGroup.classList.add('agy-active-peeking-control');
        };

        const stopPeeking = () => {
          document.body.classList.remove('agy-peeking');
          row.classList.remove('agy-active-peeking-row');
          controlGroup.classList.remove('agy-active-peeking-control');
          window.removeEventListener('pointerup', stopPeeking);
          window.removeEventListener('pointercancel', stopPeeking);
        };

        slider.addEventListener('pointerdown', () => {
          startPeeking();
          window.addEventListener('pointerup', stopPeeking);
          window.addEventListener('pointercancel', stopPeeking);
        });
      }

      if (rangeMain) bindSliderPeeking(rangeMain);
      if (rangeLineHeight) bindSliderPeeking(rangeLineHeight);
      if (rangeThought) bindSliderPeeking(rangeThought);
      if (rangeSidebar) bindSliderPeeking(rangeSidebar);

      /** @param {string} val */
      function syncSidebar(val) {
        if (rangeSidebar) rangeSidebar.value = val;
        if (inputSidebar) inputSidebar.value = val;
        savePrefs({ sidebarFontSize: Number(val) });
      }
      if (rangeSidebar) rangeSidebar.addEventListener('input', e => syncSidebar(/** @type {HTMLInputElement} */ (e.target).value));
      if (inputSidebar) inputSidebar.addEventListener('input', e => syncSidebar(/** @type {HTMLInputElement} */ (e.target).value));

      /** @param {string} val */
      function syncMain(val) {
        if (rangeMain) rangeMain.value = val;
        if (inputMain) inputMain.value = val;
        savePrefs({ mainFontSize: Number(val) });
      }
      if (rangeMain) rangeMain.addEventListener('input', e => syncMain(/** @type {HTMLInputElement} */ (e.target).value));
      if (inputMain) inputMain.addEventListener('input', e => syncMain(/** @type {HTMLInputElement} */ (e.target).value));

      /** @param {string} val */
      function syncLineHeight(val) {
        if (rangeLineHeight) rangeLineHeight.value = val;
        if (inputLineHeight) inputLineHeight.value = val;
        savePrefs({ lineHeight: Number(val) });
      }
      if (rangeLineHeight) rangeLineHeight.addEventListener('input', e => syncLineHeight(/** @type {HTMLInputElement} */ (e.target).value));
      if (inputLineHeight) inputLineHeight.addEventListener('input', e => syncLineHeight(/** @type {HTMLInputElement} */ (e.target).value));

      /** @param {string} val */
      function syncThought(val) {
        if (rangeThought) rangeThought.value = val;
        if (inputThought) inputThought.value = val;
        savePrefs({ thoughtFontSize: Number(val) });
      }
      if (rangeThought) rangeThought.addEventListener('input', e => syncThought(/** @type {HTMLInputElement} */ (e.target).value));
      if (inputThought) inputThought.addEventListener('input', e => syncThought(/** @type {HTMLInputElement} */ (e.target).value));

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

      function reRender() {
        container.innerHTML = buildHTML();
        setupEventListeners();
        // Update nav button text
        const navSpan = tabBtn?.querySelector('span');
        if (navSpan) {
          navSpan.textContent = t().navTitle;
        }
      }

      if (btnEn) {
        btnEn.addEventListener('click', () => {
          if (currentPrefs.language !== 'en') {
            savePrefs({ language: 'en' });
            reRender();
          }
        });
      }

      if (btnZh) {
        btnZh.addEventListener('click', () => {
          if (currentPrefs.language !== 'zh') {
            savePrefs({ language: 'zh' });
            reRender();
          }
        });
      }

      if (btnReset) {
        btnReset.addEventListener('click', () => {
          savePrefs(defaultPrefs);
          reRender();
        });
      }
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
    const style = document.getElementById('agy-font-settings-style');
    if (style) style.remove();
    document.body.classList.remove('agy-peeking');
    const root = document.documentElement;
    root.style.removeProperty('--agy-font-sidebar');
    root.style.removeProperty('--agy-font-main');
    root.style.removeProperty('--agy-font-code');
    root.style.removeProperty('--agy-font-thought');
    root.style.removeProperty('--agy-font-line-height');
  };
}
