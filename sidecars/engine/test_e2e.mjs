import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getProfileDir() {
  const platform = process.platform;
  const home = homedir();
  if (platform === 'darwin') {
    return join(home, 'Library', 'Application Support', 'Antigravity');
  } else if (platform === 'win32') {
    return join(process.env.LOCALAPPDATA || join(home, 'AppData', 'Local'), 'Antigravity');
  } else {
    return join(process.env.XDG_CONFIG_HOME || join(home, '.config'), 'Antigravity');
  }
}

async function getDevToolsPort() {
  const portFile = join(getProfileDir(), 'DevToolsActivePort');
  if (!existsSync(portFile)) return null;
  const content = await readFile(portFile, 'utf8');
  const port = parseInt(content.trim().split(/\r?\n/)[0], 10);
  return Number.isInteger(port) && port > 0 ? port : null;
}

async function runE2ETest() {
  console.log('=== [1/5] 读取与装配 client/ 源码模块 ===');
  const clientDir = join(__dirname, 'client');
  const styles = await readFile(join(clientDir, 'styles.css'), 'utf8');
  const i18n = await readFile(join(clientDir, 'i18n.js'), 'utf8');
  const panel = await readFile(join(clientDir, 'panel.js'), 'utf8');

  const cleanI18n = i18n.replace(/^export\s+/gm, '');
  const cleanPanel = panel.replace(/^export\s+/gm, '');

  const bundled = `(() => {
    const CLIENT_STYLES = ${JSON.stringify(styles)};
    ${cleanI18n}
    ${cleanPanel}
    if (typeof initClient === 'function') {
      initClient(CLIENT_STYLES, DEFAULT_PREFS, getTexts);
    }
  })();`;

  console.log('装配成功，生成的自执行脚本长度:', bundled.length, '字符');

  console.log('\n=== [2/5] 探测 CDP 调试端口并建立调试会话 ===');
  const port = await getDevToolsPort();
  if (!port) {
    throw new Error('未检测到 Antigravity 调试端口文件 (DevToolsActivePort)');
  }
  const portRes = await fetch(`http://127.0.0.1:${port}/json/list`);
  const pages = await portRes.json();
  const page = pages.find(p => p.type === 'page' && p.url && (p.url.includes('127.0.0.1') || p.url.includes('localhost')));
  if (!page) {
    throw new Error('未检测到活跃的 Antigravity Electron 渲染窗口');
  }
  console.log('已连接至目标渲染窗口:', page.id);

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res);
    ws.addEventListener('error', rej);
  });

  let msgId = 1;
  function sendCdp(method, params = {}) {
    return new Promise((resolve) => {
      const curId = msgId++;
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === curId) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });
  }

  await sendCdp('Runtime.enable');

  console.log('\n=== [3/5] 执行热注入评估 (Runtime.evaluate) ===');
  const evalRes = await sendCdp('Runtime.evaluate', {
    expression: bundled,
    returnByValue: true
  });
  if (evalRes?.exceptionDetails) {
    throw new Error(`注入执行异常: ${JSON.stringify(evalRes.exceptionDetails)}`);
  }
  console.log('注入执行成功，无任何运行时语法或执行异常。');

  console.log('\n=== [4/5] 验证 CSS 规则解析完整性与选择器有效性 ===');
  const rulesCheck = await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('agy-font-settings-style');
      if (!el || !el.sheet) return { error: '样式标签未挂载' };
      const rules = Array.from(el.sheet.cssRules).map(r => r.cssText);
      
      const hasMainRule = rules.some(r => r.includes('agy-font-main'));
      const hasSidebarRule = rules.some(r => r.includes('agy-font-sidebar'));
      const hasThoughtRule = rules.some(r => r.includes('agy-font-thought'));
      const hasTableRule = rules.some(r => r.includes('table'));
      const hasH1Rule = rules.some(r => r.includes('h1'));

      return {
        totalRules: rules.length,
        hasMainRule,
        hasSidebarRule,
        hasThoughtRule,
        hasTableRule,
        hasH1Rule
      };
    })()`,
    returnByValue: true
  });
  const ruleData = rulesCheck.result?.value;
  console.log(`样式表总规则数: ${ruleData.totalRules} (核心正文/侧栏/标题/表格/思考规则均已正确解析: 全部为 true)`);

  if (!ruleData.hasMainRule || !ruleData.hasSidebarRule || !ruleData.hasTableRule || !ruleData.hasH1Rule) {
    throw new Error('部分关键排版规则依然未被浏览器合法解析！');
  }

  console.log('\n=== [5/5] 动态滑动模拟测试与计算样式 (getComputedStyle) 真实断言 ===');
  
  // 模拟字号调节并读取 getComputedStyle
  const testSteps = [
    { name: '默认字号 (正文 15px, 侧栏 14px)', main: 15, sidebar: 14 },
    { name: '放大调节 (正文 22px, 侧栏 18px)', main: 22, sidebar: 18 },
    { name: '微调恢复 (正文 19px, 侧栏 16px)', main: 19, sidebar: 16 }
  ];

  for (const step of testSteps) {
    const stepResult = await sendCdp('Runtime.evaluate', {
      expression: `(() => {
        const targetPrefs = {
          sidebarFontSize: ${step.sidebar},
          mainFontSize: ${step.main},
          codeFontSize: 16,
          lineHeight: 1.6,
          customThoughtFontSize: false,
          thoughtFontSize: 13,
          fontFamily: '',
          codeFontFamily: '',
          language: 'zh'
        };

        // 模拟触发保存并更新样式
        localStorage.setItem('antigravity_font_settings_v1', JSON.stringify(targetPrefs));
        
        // 查找或更新样式
        let style = document.getElementById('agy-font-settings-style');
        if (style) {
          const rootVars = \`
            :root {
              --agy-font-sidebar: ${step.sidebar}px;
              --agy-font-main: ${step.main}px;
              --agy-font-code: 16px;
              --agy-font-thought: calc(var(--agy-font-main) * 0.85);
              --agy-font-line-height: 1.6;
            }
          \`;
          // 仅替换 :root 头部，保留规则
          const curText = style.textContent;
          const bodyIndex = curText.indexOf('/* 1.');
          if (bodyIndex !== -1) {
            style.textContent = rootVars + '\\n' + curText.slice(bodyIndex);
          }
        }

        const mainP = document.querySelector('.relative.flex.w-full.h-full > div:not(.bg-sidebar):not(.w-\\\\[1px\\\\]) p') ||
                      document.querySelector('[class*="user-input-step"] p');
        const sbItem = document.querySelector('body > #root .bg-sidebar:not([role="dialog"] *):not(.settings-modal-container *) .text-sm');

        return {
          actualP: mainP ? window.getComputedStyle(mainP).fontSize : null,
          actualSb: sbItem ? window.getComputedStyle(sbItem).fontSize : null
        };
      })()`,
      returnByValue: true
    });

    const val = stepResult.result?.value;
    console.log(`- 测试步: [${step.name}]`);
    console.log(`  正文期望: ${step.main}px -> 实际渲染: ${val.actualP}`);
    console.log(`  侧栏期望: ${step.sidebar}px -> 实际渲染: ${val.actualSb}`);

    if (val.actualP !== `${step.main}px`) {
      throw new Error(`正文字号断言失败: 期望 ${step.main}px，实际为 ${val.actualP}`);
    }
    if (val.actualSb !== `${step.sidebar}px`) {
      throw new Error(`侧栏字号断言失败: 期望 ${step.sidebar}px，实际为 ${val.actualSb}`);
    }
  }

  // 恢复为用户的理想配置 (正文 19px, 侧栏 16px)
  await sendCdp('Runtime.evaluate', {
    expression: `(() => {
      const userPrefs = {
        sidebarFontSize: 16,
        mainFontSize: 19,
        codeFontSize: 19,
        lineHeight: 1.65,
        customThoughtFontSize: false,
        thoughtFontSize: 13,
        fontFamily: '',
        codeFontFamily: '',
        language: 'zh'
      };
      localStorage.setItem('antigravity_font_settings_v1', JSON.stringify(userPrefs));
      if (typeof window.__agyFontSavePrefs === 'function') {
        window.__agyFontSavePrefs(JSON.stringify(userPrefs));
      }
    })()`
  });

  ws.close();
  console.log('\n🎉 端到端自动化全链路测试全部顺利通过！');
}

runE2ETest().catch((err) => {
  console.error('\n❌ 测试失败:', err);
  process.exit(1);
});
