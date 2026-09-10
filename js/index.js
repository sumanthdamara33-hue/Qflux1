/**
 * Qflux Landing Page — index.js
 * Handles: animated stat counters, mini circuit diagram, teaser widget, ticker.
 */

// ── Ticker items ─────────────────────────────────────────────
(function buildTicker() {
  const items = [
    { icon: '\u26db\ufe0f', label: 'Statevector Simulation' },
    { icon: '\ud83c\udf10', label: '3D Bloch Sphere' },
    { icon: '\ud83c\udfb2', label: 'Monte Carlo Sampling' },
    { icon: '\ud83d\udcbb', label: 'OpenQASM 2.0 Export' },
    { icon: '\ud83d\udc0d', label: 'Python Qiskit Export' },
    { icon: '\u21a9', label: 'Undo / Redo History' },
    { icon: '\ud83e\uddcb', label: 'Quantum Entanglement' },
    { icon: '\u26a1', label: 'Zero Dependencies' },
    { icon: '\ud83d\udd2c', label: '9 Gate Types' },
    { icon: '\ud83d\udcd0', label: 'Up to 6 Qubits' },
  ];
  const el = document.getElementById('tickerInner');
  if (!el) return;
  // Duplicate for seamless infinite scroll
  const html = [...items, ...items].map(i =>
    `<span class="tech-ticker-item">${i.icon} <span class="ticker-hl">${i.label}</span></span>`
  ).join('');
  el.innerHTML = html;
})();

// ── Stat counters (triggered once visible) ───────────────────
function animateCounter(el) {
  const target = parseInt(el.dataset.count);
  let current = 0;
  const step = Math.ceil(target / 36);
  const id = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(id);
  }, 22);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('[data-count]').forEach(animateCounter);
      statsObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.hero-stats').forEach(el => statsObserver.observe(el));

// ── Mini circuit SVG diagram ──────────────────────────────────
const GATE_COLORS = { H:'#6366f1', X:'#ec4899', Y:'#f43f5e', Z:'#a855f7', S:'#8b5cf6', T:'#3b82f6', CX:'#38bdf8', CZ:'#06b6d4', M:'#f59e0b' };

const MINI_CIRCUITS = {
  bell: { numQ: 2, numS: 4, gates: [
    { q:0, s:0, type:'H' },
    { q:1, s:1, type:'CX', control:0 }
  ]},
  ghz: { numQ: 3, numS: 5, gates: [
    { q:0, s:0, type:'H' },
    { q:1, s:1, type:'CX', control:0 },
    { q:2, s:2, type:'CX', control:1 }
  ]},
  superposition: { numQ: 3, numS: 3, gates: [
    { q:0, s:0, type:'H' },
    { q:1, s:0, type:'H' },
    { q:2, s:0, type:'H' }
  ]},
  grover: { numQ: 2, numS: 8, gates: [
    { q:0, s:0, type:'H' }, { q:1, s:0, type:'H' },
    { q:1, s:1, type:'CZ', control:0 },
    { q:0, s:2, type:'H' }, { q:1, s:2, type:'H' },
    { q:0, s:3, type:'X' }, { q:1, s:3, type:'X' },
    { q:1, s:4, type:'CZ', control:0 },
    { q:0, s:5, type:'X' }, { q:1, s:5, type:'X' },
    { q:0, s:6, type:'H' }, { q:1, s:6, type:'H' }
  ]}
};

function renderMiniCircuit(presetName) {
  const svg = document.getElementById('miniCircuitSvg');
  if (!svg) return;
  const def = MINI_CIRCUITS[presetName] || MINI_CIRCUITS.bell;
  const numQ = def.numQ, numS = def.numS;
  const W = 300, rowH = 26, topPad = 12, leftPad = 24;
  const colW = (W - leftPad - 8) / numS;
  const H = numQ * rowH + topPad * 2;
  svg.setAttribute('height', H);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  let out = '';
  // Wires and qubit labels
  for (let q = 0; q < numQ; q++) {
    const y = topPad + q * rowH + rowH / 2;
    out += `<line x1="${leftPad}" y1="${y}" x2="${W - 6}" y2="${y}" stroke="#243046" stroke-width="1.5"/>`;
    out += `<text x="2" y="${y + 4}" font-family="monospace" font-size="9" fill="#38bdf8" font-weight="700">q${q}</text>`;
  }
  // Gates
  def.gates.forEach(gate => {
    const x = leftPad + gate.s * colW + colW / 2;
    const y = topPad + gate.q * rowH + rowH / 2;
    const col = GATE_COLORS[gate.type] || '#6366f1';
    if ((gate.type === 'CX' || gate.type === 'CZ') && gate.control !== undefined) {
      const cy = topPad + gate.control * rowH + rowH / 2;
      out += `<line x1="${x}" y1="${cy}" x2="${x}" y2="${y}" stroke="${col}" stroke-width="1.5" opacity="0.7"/>`;
      out += `<circle cx="${x}" cy="${cy}" r="3.5" fill="${col}"/>`;
      out += `<rect x="${x-8}" y="${y-8}" width="16" height="16" rx="3" fill="rgba(6,182,212,0.18)" stroke="${col}" stroke-width="1.2"/>`;
      out += `<text x="${x}" y="${y+3}" font-family="monospace" font-size="8" fill="${col}" text-anchor="middle" font-weight="700">${gate.type==='CX'?'\u2295':'Z'}</text>`;
    } else {
      out += `<rect x="${x-8}" y="${y-8}" width="16" height="16" rx="3" fill="rgba(99,102,241,0.18)" stroke="${col}" stroke-width="1.2"/>`;
      out += `<text x="${x}" y="${y+3}" font-family="monospace" font-size="8" fill="${col}" text-anchor="middle" font-weight="700">${gate.type}</text>`;
    }
  });
  svg.innerHTML = out;
}

// ── Teaser widget ─────────────────────────────────────────────
window.setTeaser = function(presetName) {
  const Engine = window.QfluxEngine;
  if (!Engine) return;

  const titles = { bell:'Bell State |Φ⁺⟩', ghz:'GHZ 3-Qubit', superposition:'Superposition |+++⟩', grover:"Grover's Search" };
  document.getElementById('teaserPresetName').textContent = titles[presetName] || presetName;
  document.getElementById('teaserStudioLink').href = `simulator.html?preset=${presetName}`;

  let sim;
  if (presetName === 'bell') {
    sim = new Engine.CircuitSimulator(2);
    sim.apply1QGate(Engine.GATES_1Q.H, 0);
    sim.applyCX(0, 1);
  } else if (presetName === 'ghz') {
    sim = new Engine.CircuitSimulator(3);
    sim.apply1QGate(Engine.GATES_1Q.H, 0);
    sim.applyCX(0, 1); sim.applyCX(1, 2);
  } else if (presetName === 'superposition') {
    sim = new Engine.CircuitSimulator(3);
    [0,1,2].forEach(q => sim.apply1QGate(Engine.GATES_1Q.H, q));
  } else if (presetName === 'grover') {
    sim = new Engine.CircuitSimulator(2);
    sim.apply1QGate(Engine.GATES_1Q.H, 0); sim.apply1QGate(Engine.GATES_1Q.H, 1);
    sim.applyCZ(0, 1);
    sim.apply1QGate(Engine.GATES_1Q.H, 0); sim.apply1QGate(Engine.GATES_1Q.H, 1);
    sim.apply1QGate(Engine.GATES_1Q.X, 0); sim.apply1QGate(Engine.GATES_1Q.X, 1);
    sim.applyCZ(0, 1);
    sim.apply1QGate(Engine.GATES_1Q.X, 0); sim.apply1QGate(Engine.GATES_1Q.X, 1);
    sim.apply1QGate(Engine.GATES_1Q.H, 0); sim.apply1QGate(Engine.GATES_1Q.H, 1);
  }

  const analysis = sim.getAnalysis();
  document.getElementById('teaserKet').textContent = analysis.ketString;

  const barsEl = document.getElementById('teaserBars');
  barsEl.innerHTML = '';
  analysis.probabilities.filter(p => p.probability > 0.001).forEach(item => {
    const pct = parseFloat(item.percentage);
    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:0.82rem;';
    const barColor = pct > 40 ? 'linear-gradient(90deg,#6366f1,#38bdf8)' : 'linear-gradient(90deg,#8b5cf6,#6366f1)';
    bar.innerHTML = `<div style="width:42px;color:var(--accent-cyan);font-weight:700;">|${item.basis}\u27e9</div><div style="flex:1;height:14px;background:rgba(30,41,59,0.6);border-radius:3px;overflow:hidden;"><div style="height:100%;width:0%;background:${barColor};border-radius:3px;transition:width 0.5s cubic-bezier(0.25,1,0.5,1);" data-w="${pct}"></div></div><div style="width:46px;text-align:right;color:var(--text-secondary);">${item.percentage}%</div>`;
    barsEl.appendChild(bar);
  });
  requestAnimationFrame(() => {
    barsEl.querySelectorAll('[data-w]').forEach(b => { b.style.width = b.dataset.w + '%'; });
  });

  renderMiniCircuit(presetName);
};

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setTeaser('bell');
  // Trigger counters immediately (hero visible on load)
  document.querySelectorAll('[data-count]').forEach(animateCounter);
});
