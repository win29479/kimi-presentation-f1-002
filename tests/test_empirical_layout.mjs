import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = process.cwd();
const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

console.log('Using browser at:', CHROME_PATH);

// 1. Generate test HTML with actual CSS files and CareerTimeline markup
const tokensCss = fs.readFileSync(path.join(ROOT_DIR, 'src', 'styles', 'tokens.css'), 'utf8');
const indexCss = fs.readFileSync(path.join(ROOT_DIR, 'src', 'styles', 'index.css'), 'utf8');
const timelineCss = fs.readFileSync(path.join(ROOT_DIR, 'src', 'components', 'CareerTimeline.css'), 'utf8');

const testHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Empirical Layout Test</title>
  <style>
    ${tokensCss}
    ${indexCss}
    ${timelineCss}
  </style>
</head>
<body style="margin: 0; padding: 0; background: #0a0d14;">
  <section id="timeline" class="career-timeline-section" aria-label="Career Trajectory Timeline" data-timeline>
    <div class="timeline-header">
      <div class="timeline-eyebrow"><span class="eyebrow-slash">//</span> 03 — CAREER TRAJECTORY</div>
      <h2 class="timeline-heading">FROM KARTS TO FORMULA 1</h2>
      <p class="timeline-lead">Seven defining epochs.</p>
    </div>

    <div class="timeline-track-container">
      <div class="timeline-spine-track" aria-hidden="true">
        <div class="timeline-spine-glow" style="transform: scaleY(0.5)"></div>
      </div>

      <ol class="timeline-list" role="list">
        <!-- Milestone 0: Left -->
        <li id="milestone-1" class="timeline-row timeline-left timeline-row-left is-visible is-active" tabindex="0">
          <div class="timeline-connector pointing-right" style="--item-accent: #00d2be"></div>
          <div class="timeline-node node-active" style="--item-accent: #00d2be">
            <span class="node-outer-ring"></span>
            <span class="node-core"><span class="node-number">1</span></span>
          </div>
          <article class="timeline-card">
            <div class="card-top-bar">
              <div class="card-meta">
                <span class="meta-category">Grassroots Karting</span>
                <span class="meta-divider">•</span>
                <span class="meta-year">2014-2018</span>
              </div>
              <span class="card-tag-pill">KARTING</span>
            </div>
            <h3 class="card-title">Grassroots Prodigy</h3>
            <p class="card-subtitle">Antonelli Motorsport</p>
          </article>
        </li>

        <!-- Milestone 1: Right -->
        <li id="milestone-2" class="timeline-row timeline-right timeline-row-right is-visible is-active" tabindex="0">
          <div class="timeline-connector pointing-left" style="--item-accent: #00a19b"></div>
          <div class="timeline-node node-active" style="--item-accent: #00a19b">
            <span class="node-outer-ring"></span>
            <span class="node-core"><span class="node-number">2</span></span>
          </div>
          <article class="timeline-card">
            <div class="card-top-bar">
              <div class="card-meta">
                <span class="meta-category">Mercedes F1 Junior</span>
                <span class="meta-divider">•</span>
                <span class="meta-year">2019-2021</span>
              </div>
              <span class="card-tag-pill">ACADEMY</span>
            </div>
            <h3 class="card-title">Silver Arrows Signing</h3>
            <p class="card-subtitle">Mercedes-AMG PETRONAS F1</p>
          </article>
        </li>
      </ol>
    </div>
  </section>
</body>
</html>`;

const tempHtmlPath = path.join(ROOT_DIR, 'test_harness_temp.html');
fs.writeFileSync(tempHtmlPath, testHtml, 'utf8');

// Helper to run headless Chrome CDP commands
async function runChromeTest(viewportWidth, viewportHeight, reducedMotion = false) {
  const port = 9222 + Math.floor(Math.random() * 500);
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--remote-debugging-port=${port}`,
    `--window-size=${viewportWidth},${viewportHeight}`,
    'about:blank',
  ];

  const chromeProc = spawn(CHROME_PATH, args);

  // Wait for DevTools port to be ready
  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 100));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const tabs = await res.json();
      if (tabs && tabs.length > 0 && tabs[0].webSocketDebuggerUrl) {
        wsUrl = tabs[0].webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    chromeProc.kill();
    throw new Error('Failed to connect to Chrome CDP');
  }

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.onopen = resolve);

  let msgId = 1;
  function sendCdp(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  try {
    await sendCdp('Page.enable');
    await sendCdp('DOM.enable');
    await sendCdp('CSS.enable');

    // Set viewport
    await sendCdp('Emulation.setDeviceMetricsOverride', {
      width: viewportWidth,
      height: viewportHeight,
      deviceScaleFactor: 1,
      mobile: viewportWidth < 768,
    });

    if (reducedMotion) {
      await sendCdp('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
      });
    }

    const fileUrl = 'file:///' + tempHtmlPath.replace(/\\/g, '/');
    await sendCdp('Page.navigate', { url: fileUrl });
    await new Promise((r) => setTimeout(r, 200));

    // Evaluate empirical measurements in the browser
    const evalResult = await sendCdp('Runtime.evaluate', {
      expression: `(() => {
        const doc = document.documentElement;
        const body = document.body;
        const section = document.querySelector('.career-timeline-section');
        const spine = document.querySelector('.timeline-spine-track');
        const row0 = document.querySelector('#milestone-1');
        const card0 = row0.querySelector('.timeline-card');
        const conn0 = row0.querySelector('.timeline-connector');
        const node0 = row0.querySelector('.timeline-node');

        const row1 = document.querySelector('#milestone-2');
        const card1 = row1.querySelector('.timeline-card');
        const conn1 = row1.querySelector('.timeline-connector');
        const node1 = row1.querySelector('.timeline-node');

        const getRect = (el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
        };

        const getStyle = (el) => {
          if (!el) return null;
          const s = window.getComputedStyle(el);
          return {
            left: s.left,
            right: s.right,
            width: s.width,
            maxWidth: s.maxWidth,
            paddingLeft: s.paddingLeft,
            paddingRight: s.paddingRight,
            marginLeft: s.marginLeft,
            marginRight: s.marginRight,
            transform: s.transform,
            transition: s.transition,
            display: s.display,
            overflowX: s.overflowX
          };
        };

        return {
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          hasHorizontalScrollbar: doc.scrollWidth > window.innerWidth,
          sectionStyle: getStyle(section),
          spineRect: getRect(spine),
          spineStyle: getStyle(spine),
          row0: {
            rect: getRect(row0),
            style: getStyle(row0),
            cardRect: getRect(card0),
            cardStyle: getStyle(card0),
            connRect: getRect(conn0),
            connStyle: getStyle(conn0),
            nodeRect: getRect(node0),
            nodeStyle: getStyle(node0),
          },
          row1: {
            rect: getRect(row1),
            style: getStyle(row1),
            cardRect: getRect(card1),
            cardStyle: getStyle(card1),
            connRect: getRect(conn1),
            connStyle: getStyle(conn1),
            nodeRect: getRect(node1),
            nodeStyle: getStyle(node1),
          }
        };
      })()`,
      returnByValue: true,
    });

    return evalResult.result.value;
  } finally {
    ws.close();
    chromeProc.kill();
  }
}

async function runAll() {
  console.log('\n======================================================');
  console.log('   EMPIRICAL CHALLENGER: BROWSER HARNESS EXECUTION');
  console.log('======================================================\n');

  try {
    // TEST 1: Exactly 767px (Mobile breakpoint)
    console.log('--- TEST 1: Viewport at exactly 767px (Mobile) ---');
    const res767 = await runChromeTest(767, 900);
    console.log('Viewport Width:', res767.viewportWidth);
    console.log('Document scrollWidth vs clientWidth:', res767.scrollWidth, 'vs', res767.clientWidth);
    console.log('Horizontal scrollbar present?:', res767.hasHorizontalScrollbar);
    console.log('Spine left style & rect:', res767.spineStyle.left, res767.spineStyle.transform, 'Rect left:', res767.spineRect.left);
    console.log('Row 0 padding-left:', res767.row0.style.paddingLeft);
    console.log('Row 0 card width & margin:', res767.row0.cardStyle.width, 'Margin:', res767.row0.cardStyle.marginLeft);
    console.log('Row 0 connector left & width:', res767.row0.connStyle.left, res767.row0.connStyle.width, 'Rect:', res767.row0.connRect);
    console.log('Row 0 node rect left:', res767.row0.nodeRect.left);

    // TEST 2: Exactly 768px (Desktop breakpoint)
    console.log('\n--- TEST 2: Viewport at exactly 768px (Desktop) ---');
    const res768 = await runChromeTest(768, 900);
    console.log('Viewport Width:', res768.viewportWidth);
    console.log('Spine style left & transform:', res768.spineStyle.left, res768.spineStyle.transform, 'Rect left:', res768.spineRect.left);
    console.log('Row 0 (Left Card):');
    console.log('  Card rect: left =', res768.row0.cardRect.left, 'right =', res768.row0.cardRect.right, 'width =', res768.row0.cardRect.width);
    console.log('  Spine rect: left =', res768.spineRect.left, 'right =', res768.spineRect.right);
    console.log('  Connector rect: left =', res768.row0.connRect.left, 'right =', res768.row0.connRect.right, 'width =', res768.row0.connRect.width);
    console.log('  -> Gap between Left Card and Spine is:', res768.spineRect.left - res768.row0.cardRect.right);
    console.log('  -> Is Connector inside [card.right, spine.left]?:',
      res768.row0.connRect.left >= res768.row0.cardRect.right - 1 && res768.row0.connRect.right <= res768.spineRect.left + 2);

    console.log('Row 1 (Right Card):');
    console.log('  Spine rect: left =', res768.spineRect.left, 'right =', res768.spineRect.right);
    console.log('  Card rect: left =', res768.row1.cardRect.left, 'right =', res768.row1.cardRect.right, 'width =', res768.row1.cardRect.width);
    console.log('  Connector rect: left =', res768.row1.connRect.left, 'right =', res768.row1.connRect.right, 'width =', res768.row1.connRect.width);
    console.log('  -> Gap between Spine and Right Card is:', res768.row1.cardRect.left - res768.spineRect.right);
    console.log('  -> Is Connector inside [spine.right, card.left]?:',
      res768.row1.connRect.left >= res768.spineRect.right - 2 && res768.row1.connRect.right <= res768.row1.cardRect.left + 1);

    // TEST 3: Desktop 1200px
    console.log('\n--- TEST 3: Viewport at 1200px (Wide Desktop) ---');
    const res1200 = await runChromeTest(1200, 900);
    console.log('Spine rect left:', res1200.spineRect.left);
    console.log('Row 0 Card rect: [', res1200.row0.cardRect.left, ',', res1200.row0.cardRect.right, ']');
    console.log('Row 0 Connector rect: [', res1200.row0.connRect.left, ',', res1200.row0.connRect.right, ']');
    console.log('Row 1 Card rect: [', res1200.row1.cardRect.left, ',', res1200.row1.cardRect.right, ']');
    console.log('Row 1 Connector rect: [', res1200.row1.connRect.left, ',', res1200.row1.connRect.right, ']');

    // TEST 4: Reduced motion
    console.log('\n--- TEST 4: Prefers-reduced-motion: reduce ---');
    const resMotion = await runChromeTest(1200, 900, true);
    console.log('Row 0 transform with reduced motion:', resMotion.row0.style.transform);
    console.log('Card 0 transform with reduced motion:', resMotion.row0.cardStyle.transform);
    console.log('Card 0 transition with reduced motion:', resMotion.row0.cardStyle.transition);

  } finally {
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
  }
}

runAll().catch(console.error);
