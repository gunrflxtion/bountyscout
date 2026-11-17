/* BountyScout UI — sample data is injected by `node scripts/build.js`
   from data/programs.json so the page works from file:// with no server. */
'use strict';

const SAMPLE_PROGRAMS = [
  {
    "id": "mor",
    "name": "Morpheus (MOR)",
    "note": "Report sent 17 Nov 2026, awaiting verdict.",
    "platform": "Direct email",
    "text": "Morpheus bug bounty program v2, effective 7 Aug 2026, pool up to $100,000. Critical up to $100,000, High $10,000-50,000, Medium $2,500-10,000, Low $500-2,500. Submit free via email to the security team. No fee, no reputation needed. Scope: EVM smart contracts on Ethereum and Base, Appendix A addresses only. A working proof of concept on a forked mainnet block is required. Live program.",
    "url": "https://mor.org/bug-bounty"
  },
  {
    "id": "safe",
    "name": "Safe",
    "note": "3 reports sent 16 Nov 2026, awaiting assessment.",
    "platform": "Direct email",
    "text": "Safe bug bounty program. Submit free via email to the bounty address. No fee, no reputation gate. Scope: EVM smart contracts of the Safe protocol. Rewards paid per severity. Live program.",
    "url": "https://safe.global/bug-bounty"
  },
  {
    "id": "relay",
    "name": "Relay Protocol",
    "note": "3 reports sent 14 Nov 2026, awaiting acknowledgement.",
    "platform": "Direct email",
    "text": "Relay Protocol bug bounty. Submit free via email to support. No fee, no reputation gate. Scope: EVM smart contracts, cross-chain bridge and solvers. Rewards paid in crypto after KYC and tax documents. Live program.",
    "url": "https://relay.link"
  },
  {
    "id": "raac",
    "name": "RAAC Core Contracts",
    "note": "Contest 9 Nov-9 Dec 2026, Critical-only. Audit rounds 1-3 found 0 Critical.",
    "platform": "Guardian Defender",
    "text": "RAAC Core Contracts bounty contest on Guardian Defender, 9 Nov to 9 Dec 2026, $100,000 seasonal pool shared between winners. Critical-only, findings above 20% of total funds at risk. KYC approved for payout. Scope: EVM smart contracts, 20 contracts in scope. Submit free on the platform. Live contest.",
    "url": "https://guardian.defender.xyz"
  },
  {
    "id": "stakedhype",
    "name": "StakedHypeEscrow",
    "note": "Contest 16 Nov-16 Dec 2026, Critical-only. Audit found 0 Critical.",
    "platform": "Guardian Defender",
    "text": "StakedHypeEscrow bounty contest on Guardian Defender, 16 Nov to 16 Dec 2026, $100,000 pool. Critical-only contest. Submit free on the platform. Scope: EVM smart contracts. Live contest.",
    "url": "https://guardian.defender.xyz"
  },
  {
    "id": "ticko",
    "name": "Ticko",
    "note": "5 reports sent 13-14 Nov 2026. Testing on testnet only.",
    "platform": "Tally",
    "text": "Ticko bug bounty on testnet only. Testing on mainnet disqualifies the report. Critical up to 200,000 USDT, High 25,000 USDT, Medium 3,000 USDT. Submit free via Tally form. Scope: EVM smart contracts on testnet. Live program.",
    "url": "https://ticko.market"
  },
  {
    "id": "seven-exchange",
    "name": "7.Exchange",
    "note": "Discord ticket sent 17 Nov 2026 asking for contract source access.",
    "platform": "Discord ticket",
    "text": "7.Exchange bug bounty program, updated 8 Nov 2026. Submit free via Discord ticket. Rewards are discretionary and not published. Acknowledgement within 48 hours, assessment within 5 working days. Scope: Diamond Router contracts, EVM. Contract source is not public yet.",
    "url": "https://docs.7.exchange/security/bug-bounty-program"
  },
  {
    "id": "iota",
    "name": "IOTA",
    "note": "Live since 16 Nov 2026. Move/Rust scope, not EVM.",
    "platform": "Sherlock",
    "text": "IOTA bug bounty on Sherlock. Max rewards 5,000 USDC. Free submission. Only Critical and High findings are paid. A coded proof of concept that runs against a local network is required. Scope: selected files in the IOTA monorepo, Starfish consensus and networking, Move bytecode verification, VM execution, native functions, object ownership, gas metering. IOTA EVM out of scope. Live since 16 Nov 2026.",
    "url": "https://audits.sherlock.xyz/bug-bounties/425"
  },
  {
    "id": "royco",
    "name": "Royco",
    "note": "1 Medium finding ready but unsubmitted: 100-credit fee blocks it.",
    "platform": "Immunefi",
    "text": "Royco on Immunefi. Max reward $250,000 USDC on Ethereum. Submit costs 100 credits = 100 USDC. Account must be verified. KYC required at payout. Scope: EVM smart contracts. Live program.",
    "url": "https://immunefi.com/bug-bounty/royco/"
  },
  {
    "id": "dexe",
    "name": "DeXe",
    "note": "1 Medium finding ready but unsubmitted: reputation gate + fee + KYC.",
    "platform": "HackenProof",
    "text": "DeXe on HackenProof. Max reward $50,000. Submit requires reputation above 120 points and a $5 fee. KYC required. Scope: EVM smart contracts. Live program.",
    "url": "https://hackenproof.com/dexe"
  },
  {
    "id": "nado",
    "name": "Nado",
    "note": "5 findings ready but parked: reputation gate above 100 points.",
    "platform": "HackenProof",
    "text": "Nado on HackenProof. Max reward $500,000. Free to submit, but requires reputation over 100 points. Scope: EVM smart contracts. Live program.",
    "url": "https://hackenproof.com/nado"
  }
];

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

let lastReport = null;

function money(v) {
  return v === null || v === undefined ? 'not found' : '$' + v.toLocaleString('en-US');
}

const RING_C = 2 * Math.PI * 34; // score-ring circumference (r=34)

function animateScoreRing(color, score) {
  const fg = document.querySelector('.ring-fg');
  const num = document.querySelector('.ring-num b');
  const fill = document.querySelector('.score-fill');
  if (!fg || !num) return;
  fg.style.strokeDashoffset = RING_C;
  if (fill) fill.style.transform = 'scaleX(0)';
  const target = RING_C * (1 - score / 100);
  const t0 = performance.now();
  const dur = 850;
  function tick(now) {
    const p = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3); // easeOutCubic
    num.textContent = Math.round(score * e);
    if (p >= 1) {
      fg.style.strokeDashoffset = target;
      if (fill) fill.style.transform = 'scaleX(' + score / 100 + ')';
    } else {
      fg.style.strokeDashoffset = RING_C - (RING_C - target) * e;
      if (fill) fill.style.transform = 'scaleX(' + (score / 100) * e + ')';
      requestAnimationFrame(tick);
    }
  }
  requestAnimationFrame(() => requestAnimationFrame(tick));
}

let toastTimer = null;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => { t.hidden = true; }, 300);
  }, 2600);
}

function renderReport(report) {
  const s = report.signals;
  const gate = [];
  if (s.fee) gate.push('$' + s.fee.amountUsd + ' fee');
  if (s.reputationGate) gate.push(s.reputationGate.points + '+ rep');
  if (s.kyc) gate.push('KYC');
  const facts = [
    ['Max reward', money(s.rewardMaxUsd)],
    ['Submit fee', s.fee ? '$' + s.fee.amountUsd + ' — “' + esc(s.fee.raw) + '”' : 'none detected'],
    ['Reputation gate', s.reputationGate ? s.reputationGate.points + '+ points' : 'none detected'],
    ['KYC', s.kyc ? 'yes' : 'not mentioned'],
    ['Scope', s.scope.length ? esc(s.scope.join(', ')) : 'not detected'],
    ['Deadline', s.deadline ? esc(s.deadline) : 'not found'],
    ['Free submit', s.freeSubmit ? 'yes' : 'no'],
  ];
  const res = $('result');
  res.hidden = false;
  res.innerHTML =
    '<div class="result-pop"><div class="verdict-hero">' +
    '<div class="score-ring" role="img" aria-label="Score ' + report.score + ' out of 100">' +
    '<svg width="96" height="96" viewBox="0 0 96 96"><circle class="ring-bg" cx="48" cy="48" r="34"></circle>' +
    '<circle class="ring-fg ' + report.verdictColor + '" cx="48" cy="48" r="34" stroke-dasharray="' + RING_C.toFixed(1) + '" stroke-dashoffset="' + RING_C.toFixed(1) + '"></circle></svg>' +
    '<span class="ring-num"><span class="ring-num-inner"><b>0</b><small>/ 100</small></span></span></div>' +
    '<div class="verdict-meta"><span class="badge ' + report.verdictColor + '">' + report.verdict + '</span>' +
    '<span class="verdict-summary">' + esc(report.summary) + '</span></div></div>' +
    '<div class="score-bar"><div class="score-fill ' + report.verdictColor + '"></div></div>' +
    '<table class="facts">' + facts.map((f) => '<tr><td>' + f[0] + '</td><td>' + f[1] + '</td></tr>').join('') + '</table>' +
    '<h3>Why this score</h3><ul class="reasons">' +
    report.reasons.map((r, i) => '<li class="reveal-row" style="--d:' + (0.08 * i).toFixed(2) + 's">' + esc(r) + '</li>').join('') + '</ul>' +
    '<div class="row"><button class="btn ghost" type="button" id="export-btn">Download brief (.md)</button>' +
    '<button class="btn ghost" type="button" id="copy-btn">Copy brief</button></div>' +
    '<p class="hint">Verify fee, reputation and KYC live on the program page before auditing — ' +
    'the extractor only reads what the pasted text says.</p></div>';
  animateScoreRing(report.verdictColor, report.score);
  $('export-btn').addEventListener('click', () => {
    const blob = new Blob([BountyScout.briefMarkdown(report)], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bountyscout-brief-' + report.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.md';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Brief downloaded ✓');
  });
  $('copy-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(BountyScout.briefMarkdown(report)).catch(() => {});
    $('copy-btn').textContent = 'Copied ✓';
    toast('Brief copied to clipboard ✓');
    setTimeout(() => { $('copy-btn').textContent = 'Copy brief'; }, 1500);
  });
}

const STAGES = ['Extracting reward, fees, gates, KYC, scope…', 'Scoring 0–100 with the transparent model…', 'Explaining the verdict…'];

function showStages() {
  const res = $('result');
  res.hidden = false;
  res.innerHTML = '<div class="stages">' + STAGES.map((s, i) =>
    '<div class="stage" data-stage="' + i + '"><span class="stage-dot"></span><span>' + s + '</span></div>'
  ).join('') + '</div><div class="skeleton" style="width:82%"></div><div class="skeleton" style="width:64%"></div><div class="skeleton" style="width:74%"></div>';
  return new Promise((resolve) => {
    STAGES.forEach((_, i) => {
      setTimeout(() => {
        document.querySelectorAll('.stage').forEach((el, j) => {
          el.classList.toggle('active', j === i);
          el.classList.toggle('done', j < i);
        });
        if (i === STAGES.length - 1) setTimeout(resolve, 380);
      }, 340 * (i + 1));
    });
  });
}

function analyze() {
  const name = $('prog-name').value.trim() || 'Untitled program';
  const text = $('prog-text').value;
  const url = $('prog-url').value.trim() || null;
  if (!text.trim()) {
    $('result').hidden = false;
    $('result').innerHTML = '<p class="result-empty">Paste the program text first — rules, rewards and how to submit.</p>';
    return;
  }
  const btn = $('analyze-btn');
  btn.disabled = true;
  btn.textContent = 'Analyzing…';
  lastReport = BountyScout.analyzeProgram({ name, text, url });
  showStages().then(() => {
    renderReport(lastReport);
    $('llm-result').hidden = true;
    btn.disabled = false;
    btn.textContent = 'Analyze →';
  });
}

function loadProgram(p, row) {
  document.querySelectorAll('#samples-table tbody tr').forEach((tr) => tr.classList.remove('selected'));
  if (row) row.classList.add('selected');
  $('prog-name').value = p.name;
  $('prog-url').value = p.url || '';
  $('prog-text').value = p.text;
  lastReport = BountyScout.analyzeProgram(p);
  renderReport(lastReport);
  document.getElementById('analyzer').scrollIntoView({ behavior: 'smooth' });
}

function renderSamples() {
  const tbody = document.querySelector('#samples-table tbody');
  tbody.innerHTML = SAMPLE_PROGRAMS.map((p, i) => {
    const r = BountyScout.analyzeProgram(p);
    const gate = [];
    if (r.signals.fee) gate.push('$' + r.signals.fee.amountUsd + ' fee');
    if (r.signals.reputationGate) gate.push(r.signals.reputationGate.points + '+ rep');
    if (r.signals.kyc) gate.push('KYC');
    return '<tr data-id="' + esc(p.id) + '" class="reveal-row" style="--d:' + (0.05 * i).toFixed(2) + 's"><td><strong>' + esc(p.name) + '</strong><br>' +
      '<span class="hint">' + esc(p.note || '') + '</span></td>' +
      '<td>' + esc(p.platform) + '</td>' +
      '<td>' + money(r.signals.rewardMaxUsd) + '</td>' +
      '<td>' + (gate.length ? esc(gate.join(', ')) : '—') + '</td>' +
      '<td><span class="score-num">' + r.score + '</span></td>' +
      '<td><span class="pill ' + r.verdictColor + '">' + r.verdict + '</span></td></tr>';
  }).join('');
  tbody.querySelectorAll('tr').forEach((tr) => {
    tr.addEventListener('click', () => {
      const p = SAMPLE_PROGRAMS.find((x) => x.id === tr.getAttribute('data-id'));
      if (!p) return;
      loadProgram(p, tr);
    });
  });
}

async function askSecondOpinion() {
  const key = $('llm-key').value.trim();
  const model = $('llm-model').value.trim();
  const box = $('llm-result');
  box.hidden = false;
  if (!key) { box.textContent = 'Add your OpenRouter API key first (optional — the engine verdict above already works without it).'; return; }
  if (!model) { box.textContent = 'Add a model id, e.g. meta-llama/llama-3.3-70b-instruct:free'; return; }
  if (!lastReport) { box.textContent = 'Analyze a program first, then ask for a second opinion.'; return; }
  box.textContent = 'Asking ' + model + ' …';
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + key,
        'HTTP-Referer': location.href,
        'X-Title': 'BountyScout',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a second-opinion checker for bug bounty program triage. Answer in 3 short lines: AGREE or DISAGREE with the verdict, the single strongest reason, and one thing the extractor may have missed. No markdown headers.' },
          { role: 'user', content: 'Engine verdict: ' + lastReport.verdict + ' (' + lastReport.score + '/100) for ' + lastReport.name + '. Reasons: ' + lastReport.reasons.join(' ') + '\n\nProgram text:\n' + $('prog-text').value.slice(0, 4000) },
        ],
      }),
    });
    if (!res.ok) throw new Error('OpenRouter HTTP ' + res.status);
    const data = await res.json();
    box.textContent = (data.choices && data.choices[0] && data.choices[0].message.content) || 'No answer returned.';
  } catch (e) {
    box.textContent = 'Second opinion failed: ' + e.message + '. The engine verdict above still stands.';
  }
}

function initTheme() {
  const root = document.documentElement;
  let saved = null;
  try { saved = localStorage.getItem('bountyscout.theme'); } catch (e) { /* ignore */ }
  const theme = saved || 'dark'; // signature look is dark; toggle persists the choice
  root.setAttribute('data-theme', theme);
  $('theme-icon').textContent = theme === 'dark' ? '☾' : '☀';
  $('theme-btn').addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    $('theme-icon').textContent = next === 'dark' ? '☾' : '☀';
    try { localStorage.setItem('bountyscout.theme', next); } catch (e) { /* ignore */ }
  });
}

function initPalette() {
  const pal = $('palette');
  const input = $('palette-input');
  const list = $('palette-list');
  let items = [];
  let active = 0;
  function render(q) {
    const query = (q || '').toLowerCase();
    items = SAMPLE_PROGRAMS.map((p) => ({ p, r: BountyScout.analyzeProgram(p) }))
      .filter(({ p, r }) => !query || p.name.toLowerCase().includes(query) ||
        p.platform.toLowerCase().includes(query) || r.verdict.toLowerCase() === query);
    active = 0;
    list.innerHTML = items.length ? items.map(({ p, r }, i) =>
      '<li data-i="' + i + '" role="option" class="' + (i === 0 ? 'active' : '') + '">' +
      '<span><strong>' + esc(p.name) + '</strong></span>' +
      '<span class="p-meta">' + r.score + ' · <span class="pill ' + r.verdictColor + '">' + r.verdict + '</span></span></li>'
    ).join('') : '<li><span class="p-empty">No program matches “' + esc(q || '') + '”.</span></li>';
  }
  function open() {
    pal.hidden = false;
    requestAnimationFrame(() => pal.classList.add('open'));
    render('');
    input.value = '';
    setTimeout(() => input.focus(), 60);
  }
  function close() {
    pal.classList.remove('open');
    setTimeout(() => { pal.hidden = true; }, 180);
    input.blur();
  }
  function choose(i) {
    const it = items[i];
    if (!it) return;
    close();
    loadProgram(it.p, document.querySelector('#samples-table tbody tr[data-id="' + it.p.id + '"]'));
  }
  $('palette-btn').addEventListener('click', open);
  pal.querySelector('[data-close]').addEventListener('click', close);
  input.addEventListener('input', () => render(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!items.length) return;
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      list.querySelectorAll('li').forEach((li, i) => li.classList.toggle('active', i === active));
    } else if (e.key === 'Enter') {
      choose(active);
    } else if (e.key === 'Escape') {
      close();
    }
  });
  list.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-i]');
    if (li) choose(parseInt(li.getAttribute('data-i'), 10));
  });
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (pal.hidden) open(); else close();
    } else if (e.key === 'Escape' && !pal.hidden) {
      close();
    }
  });
}

function initReveals() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.08 });
  els.forEach((el) => io.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initPalette();
  initReveals();
  renderSamples();
  $('analyze-btn').addEventListener('click', analyze);
  $('clear-btn').addEventListener('click', () => {
    $('prog-name').value = ''; $('prog-url').value = ''; $('prog-text').value = '';
    $('result').hidden = true; $('llm-result').hidden = true; lastReport = null;
  });
  $('llm-btn').addEventListener('click', askSecondOpinion);
  // Restore optional key/model (kept only in this browser).
  try {
    $('llm-key').value = localStorage.getItem('bountyscout.orKey') || '';
    $('llm-model').value = localStorage.getItem('bountyscout.orModel') || '';
  } catch (e) { /* private mode — ignore */ }
  $('llm-key').addEventListener('change', () => {
    try { localStorage.setItem('bountyscout.orKey', $('llm-key').value.trim()); } catch (e) { /* ignore */ }
  });
  $('llm-model').addEventListener('change', () => {
    try { localStorage.setItem('bountyscout.orModel', $('llm-model').value.trim()); } catch (e) { /* ignore */ }
  });
});
