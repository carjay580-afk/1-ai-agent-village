import type { BuilderFile } from '../../shared/types.js';

function cleanBuildTitle(prompt: string): string {
  const cleaned = prompt
    .replace(/^(please\s+)?(build|create|make|code|develop|generate|design)\s+(me\s+)?(a\s+|an\s+)?(web\s+app|app|website|tool|game|dashboard|calculator|page|system)?\s*(for|that|to|about|with)?\s*/i, '')
    .trim();
  if (!cleaned) return 'Aurora Interactive Studio App';
  return cleaned
    .split(/\s+/)
    .slice(0, 6)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).replace(/[^\w'-]/g, ''))
    .join(' ');
}

export function forgeBuilderApplication(prompt: string): {
  title: string;
  blueprintType: string;
  summary: string;
  previewHtml: string;
  files: BuilderFile[];
} {
  const p = prompt.toLowerCase();
  const title = cleanBuildTitle(prompt);

  // Detect specialized interactive archetypes so the preview is genuinely useful & fun!
  if (/game|arcade|space|pong|snake|catch|aurora|play/.test(p)) {
    const previewHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
  body { margin: 0; background: #070B14; color: #F8FAFC; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 16px; }
  .hud { display: flex; gap: 20px; margin-bottom: 12px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); padding: 10px 20px; border-radius: 999px; font-weight: 600; }
  canvas { background: linear-gradient(180deg, #060D1F 0%, #0F2942 100%); border: 1px solid rgba(255,255,255,0.14); border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); max-width: 100%; cursor: pointer; }
  .hint { margin-top: 10px; font-size: 13px; color: #94A3B8; }
</style>
</head>
<body>
  <div class="hud">
    <span>🍁 ${title}</span>
    <span>Score: <strong id="score" style="color:#10B981">0</strong></span>
    <span>Best: <strong id="best" style="color:#F59E0B">0</strong></span>
  </div>
  <canvas id="game" width="560" height="360"></canvas>
  <div class="hint">Move mouse / touch or use ← → Arrow Keys to catch glowing Aurora Orbs & dodge ice meteors!</div>
<script>
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let paddleX = 230, score = 0, best = 0;
  const items = [];
  window.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    paddleX = Math.max(0, Math.min(canvas.width - 96, (e.clientX - r.left) * (canvas.width / r.width) - 48));
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') paddleX = Math.max(0, paddleX - 32);
    if (e.key === 'ArrowRight') paddleX = Math.min(canvas.width - 96, paddleX + 32);
  });
  function spawn() {
    const hazard = Math.random() < 0.25;
    items.push({ x: 24 + Math.random() * (canvas.width - 48), y: -16, vy: 2.2 + Math.random() * 2.2, hazard });
  }
  setInterval(spawn, 550);
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.roundRect(paddleX, canvas.height - 26, 96, 14, 7);
    ctx.fill();
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.y += it.vy;
      ctx.beginPath();
      ctx.fillStyle = it.hazard ? '#EF4444' : '#F59E0B';
      ctx.arc(it.x, it.y, it.hazard ? 10 : 8, 0, Math.PI * 2);
      ctx.fill();
      if (it.y >= canvas.height - 32 && it.y <= canvas.height - 10 && it.x >= paddleX && it.x <= paddleX + 96) {
        if (it.hazard) { score = Math.max(0, score - 3); } else { score += 1; best = Math.max(best, score); }
        document.getElementById('score').textContent = score;
        document.getElementById('best').textContent = best;
        items.splice(i, 1);
      } else if (it.y > canvas.height + 20) {
        items.splice(i, 1);
      }
    }
    requestAnimationFrame(loop);
  }
  loop();
</script>
</body>
</html>`;
    return {
      title,
      blueprintType: 'interactive-game',
      summary: `Playable HTML5 Canvas arcade game built by Builder MacKenzie for "${prompt}".`,
      previewHtml,
      files: [{ name: 'index.html', language: 'html', content: previewHtml }],
    };
  }

  if (/budget|finance|calculator|mortgage|tax|compound|savings|money|cost|roi/.test(p)) {
    const previewHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
  body { margin: 0; background: #090E1A; color: #E2E8F0; padding: 24px; }
  .card { max-width: 640px; margin: 0 auto; background: #11192C; border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; padding: 24px; }
  h2 { margin: 0 0 6px; color: #F8FAFC; }
  p { margin: 0 0 18px; color: #94A3B8; font-size: 14px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
  label { display: block; font-size: 12px; color: #94A3B8; margin-bottom: 6px; }
  input { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.14); background: #070B14; color: #fff; font-size: 15px; }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px; }
  .stat { background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.25); padding: 14px; border-radius: 12px; }
  .stat span { display: block; font-size: 11px; color: #94A3B8; }
  .stat strong { font-size: 20px; color: #10B981; margin-top: 4px; display: block; }
  .bar-wrap { margin-top: 18px; background: #070B14; height: 14px; border-radius: 999px; overflow: hidden; display: flex; }
</style>
</head>
<body>
  <div class="card">
    <h2>🍁 ${title} (CAD $)</h2>
    <p>Real-time Canadian financial growth & cashflow planner forged in the Village.</p>
    <div class="grid">
      <div><label>Initial Principal ($ CAD)</label><input id="principal" type="number" value="10000" /></div>
      <div><label>Monthly Contribution ($ CAD)</label><input id="monthly" type="number" value="500" /></div>
      <div><label>Annual Return Rate (%)</label><input id="rate" type="number" step="0.1" value="7.0" /></div>
      <div><label>Time Horizon (Years)</label><input id="years" type="number" value="10" /></div>
    </div>
    <div class="stats">
      <div class="stat"><span>Projected Total</span><strong id="total">$0</strong></div>
      <div class="stat"><span>Total Contributed</span><strong id="contrib" style="color:#38BDF8">$0</strong></div>
      <div class="stat"><span>Compound Growth</span><strong id="growth" style="color:#F59E0B">$0</strong></div>
    </div>
    <div class="bar-wrap">
      <div id="cBar" style="background:#38BDF8;width:50%"></div>
      <div id="gBar" style="background:#10B981;width:50%"></div>
    </div>
  </div>
<script>
  const fmt = (n) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
  function calc() {
    const P = parseFloat(document.getElementById('principal').value) || 0;
    const M = parseFloat(document.getElementById('monthly').value) || 0;
    const r = (parseFloat(document.getElementById('rate').value) || 0) / 100 / 12;
    const n = Math.max(1, (parseFloat(document.getElementById('years').value) || 1) * 12);
    const total = r > 0 ? P * Math.pow(1 + r, n) + M * ((Math.pow(1 + r, n) - 1) / r) : P + M * n;
    const contrib = P + M * n;
    const growth = Math.max(0, total - contrib);
    document.getElementById('total').textContent = fmt(total);
    document.getElementById('contrib').textContent = fmt(contrib);
    document.getElementById('growth').textContent = fmt(growth);
    const pct = total > 0 ? Math.min(100, Math.round((contrib / total) * 100)) : 50;
    document.getElementById('cBar').style.width = pct + '%';
    document.getElementById('gBar').style.width = (100 - pct) + '%';
  }
  document.querySelectorAll('input').forEach(el => el.addEventListener('input', calc));
  calc();
</script>
</body>
</html>`;
    return {
      title,
      blueprintType: 'financial-calculator',
      summary: `Interactive CAD compound growth & financial planner tailored to "${prompt}".`,
      previewHtml,
      files: [{ name: 'index.html', language: 'html', content: previewHtml }],
    };
  }

  // Versatile interactive Workspace / Tracker / Planner App tailored to any custom prompt
  const safeTitle = title.replace(/</g, '&lt;');
  const safePrompt = prompt.replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const previewHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${safeTitle}</title>
<style>
  * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
  body { margin: 0; background: #080D1A; color: #F1F5F9; padding: 22px; }
  .shell { max-width: 720px; margin: 0 auto; background: #111A2E; border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; padding: 22px; box-shadow: 0 20px 45px rgba(0,0,0,0.45); }
  .top { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; }
  .badge { background: rgba(16,185,129,0.15); color: #34D399; border: 1px solid rgba(16,185,129,0.3); padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
  .row { display: flex; gap: 10px; margin-bottom: 16px; }
  input, select { padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.15); background: #070B14; color: #fff; font-size: 14px; }
  input { flex: 1; }
  button { background: linear-gradient(135deg, #10B981, #059669); color: #04130D; font-weight: 700; border: none; border-radius: 10px; padding: 10px 16px; cursor: pointer; }
  .list { display: flex; flex-direction: column; gap: 8px; }
  .item { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: #0B1222; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; }
  .item.done span { text-decoration: line-through; color: #64748B; }
  .tag { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: rgba(56,189,248,0.15); color: #38BDF8; margin-left: 8px; }
  .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
  .metric { background: #0B1222; padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); }
  .metric small { color: #94A3B8; font-size: 11px; display: block; }
  .metric b { font-size: 20px; color: #F59E0B; }
</style>
</head>
<body>
  <div class="shell">
    <div class="top">
      <div>
        <h2 style="margin:0 0 4px">🍁 ${safeTitle}</h2>
        <div style="font-size:13px;color:#94A3B8">Custom interactive application built from: "${safePrompt}"</div>
      </div>
      <span class="badge">Live App</span>
    </div>
    <div class="metrics">
      <div class="metric"><small>Active Items</small><b id="activeCount">0</b></div>
      <div class="metric"><small>Completed</small><b id="doneCount" style="color:#10B981">0</b></div>
      <div class="metric"><small>Completion Rate</small><b id="pctCount" style="color:#38BDF8">0%</b></div>
    </div>
    <div class="row">
      <input id="itemInput" placeholder="Add an entry, milestone, or workflow item..." />
      <select id="priorityInput">
        <option value="Core">Core</option>
        <option value="Priority">Priority</option>
        <option value="Stretch">Stretch</option>
      </select>
      <button id="addBtn">+ Add</button>
    </div>
    <div class="list" id="list"></div>
  </div>
<script>
  const items = [
    { text: 'Initialize ${safeTitle} core workflow', tag: 'Core', done: true },
    { text: 'Configure real-time dashboard metrics & milestones', tag: 'Priority', done: false },
    { text: 'Review & share deliverable with team', tag: 'Stretch', done: false }
  ];
  function render() {
    const list = document.getElementById('list');
    list.innerHTML = '';
    items.forEach((it, idx) => {
      const div = document.createElement('div');
      div.className = 'item' + (it.done ? ' done' : '');
      div.innerHTML = '<div><input type="checkbox" ' + (it.done ? 'checked' : '') + ' data-idx="' + idx + '" style="margin-right:10px"/><span>' + it.text + '</span><span class="tag">' + it.tag + '</span></div><button data-del="' + idx + '" style="background:#1E293B;color:#CBD5E1;padding:5px 10px;font-size:12px">Remove</button>';
      list.appendChild(div);
    });
    const done = items.filter(i => i.done).length;
    document.getElementById('activeCount').textContent = items.length - done;
    document.getElementById('doneCount').textContent = done;
    document.getElementById('pctCount').textContent = items.length ? Math.round((done / items.length) * 100) + '%' : '0%';
  }
  document.getElementById('addBtn').onclick = () => {
    const inp = document.getElementById('itemInput');
    const tag = document.getElementById('priorityInput').value;
    if (!inp.value.trim()) return;
    items.unshift({ text: inp.value.trim(), tag, done: false });
    inp.value = '';
    render();
  };
  document.getElementById('list').onclick = (e) => {
    if (e.target.dataset.idx !== undefined) {
      items[Number(e.target.dataset.idx)].done = e.target.checked;
      render();
    } else if (e.target.dataset.del !== undefined) {
      items.splice(Number(e.target.dataset.del), 1);
      render();
    }
  };
  render();
</script>
</body>
</html>`;

  const sqlSchema = `-- Generated PostgreSQL companion schema for ${title}
CREATE TABLE IF NOT EXISTS app_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  priority_tag text NOT NULL DEFAULT 'Core',
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);`;

  return {
    title,
    blueprintType: 'web-application',
    summary: `Full interactive web application + companion PostgreSQL schema built by Builder MacKenzie for "${prompt}".`,
    previewHtml,
    files: [
      { name: 'index.html', language: 'html', content: previewHtml },
      { name: 'schema.sql', language: 'sql', content: sqlSchema },
    ],
  };
}
