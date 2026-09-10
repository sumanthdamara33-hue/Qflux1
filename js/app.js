/**
 * Qflux Application Controller & UI Binder — Fixed & Enhanced
 * Handles circuit grid interactions, state inspection tabs, Bloch projection, and preset loading.
 *
 * BUG FIXES:
 *  1. SVG connectors rendered in requestAnimationFrame after DOM paint for correct positions
 *  2. Presets fixed: CX/CZ gates stored on target qubit row with control property
 *  3. Grover preset completed with full diffusion operator (including final H gates)
 *  4. sampleShots: re-runs simulation fresh before sampling
 *  5. Bloch sphere re-applies current vector on tab activation
 *  6. Dynamic Hilbert space dimension display
 *  7. Right-click on slot removes gate
 *  8. Undo/Redo (Ctrl+Z / Ctrl+Shift+Z or Ctrl+Y)
 *  9. Measurement gate (M) palette button added
 * 10. Shots output rendered as animated visual bar chart
 * 11. Pending-control qubit highlighted in grid
 * 12. Max qubits increased to 6, max steps to 12
 */

(function () {
  const Engine = window.QfluxEngine;
  const BlochSphere = window.BlochSphere;

  if (!Engine) {
    console.error('QfluxEngine not loaded.');
    return;
  }

  // --- App State ---
  const state = {
    numQubits: 3,
    numSteps: 6,
    selectedGate: 'H',
    grid: [],
    pendingControl: null,
    activeBlochQubit: 0,
    shots: 1024,
    blochRenderer: null,
    lastAnalysis: null,
    undoStack: [],
    redoStack: [],
    // Phase 3 additions: Stepper Debugger, Rotations & Sharing
    activeStep: null, // null = full circuit, 0..numSteps-1 = step limit
    isPlaying: false,
    playbackTimer: null,
    playbackSpeed: 700,
    pendingRotation: null,
    currentRotationAngle: Math.PI / 2
  };

  // --- Undo/Redo ---
  function snapshotGrid() {
    return state.grid.map(step => step.map(cell => cell ? { ...cell } : null));
  }

  function pushUndo() {
    state.undoStack.push({ grid: snapshotGrid(), numQubits: state.numQubits, numSteps: state.numSteps });
    if (state.undoStack.length > 40) state.undoStack.shift();
    state.redoStack = [];
  }

  function undo() {
    if (!state.undoStack.length) return;
    state.redoStack.push({ grid: snapshotGrid(), numQubits: state.numQubits, numSteps: state.numSteps });
    restoreSnapshot(state.undoStack.pop());
  }

  function redo() {
    if (!state.redoStack.length) return;
    state.undoStack.push({ grid: snapshotGrid(), numQubits: state.numQubits, numSteps: state.numSteps });
    restoreSnapshot(state.redoStack.pop());
  }

  function restoreSnapshot(snap) {
    state.numQubits = snap.numQubits;
    state.numSteps = snap.numSteps;
    state.grid = snap.grid.map(step => step.map(cell => cell ? { ...cell } : null));
    if (state.activeBlochQubit >= state.numQubits) state.activeBlochQubit = state.numQubits - 1;
    state.pendingControl = null;
    renderCircuit();
  }

  // --- Initialize empty grid ---
  function initGrid(qubits, steps) {
    state.numQubits = Math.max(1, Math.min(6, qubits || state.numQubits));
    state.numSteps = Math.max(4, Math.min(12, steps || state.numSteps));
    state.grid = [];
    for (let s = 0; s < state.numSteps; s++) {
      state.grid[s] = new Array(state.numQubits).fill(null);
    }
    state.pendingControl = null;
    state.undoStack = [];
    state.redoStack = [];
  }

  // --- Presets ---
  const PRESETS = {
    blank: () => { initGrid(3, 6); },
    bell: () => {
      initGrid(2, 5);
      state.grid[0][0] = { type: 'H' };
      state.grid[1][1] = { type: 'CX', control: 0 };
    },
    ghz: () => {
      initGrid(3, 6);
      state.grid[0][0] = { type: 'H' };
      state.grid[1][1] = { type: 'CX', control: 0 };
      state.grid[2][2] = { type: 'CX', control: 1 };
    },
    superposition: () => {
      initGrid(3, 5);
      for (let q = 0; q < 3; q++) state.grid[0][q] = { type: 'H' };
    },
    teleportation: () => {
      initGrid(3, 8);
      state.grid[0][0] = { type: 'X' };
      state.grid[1][1] = { type: 'H' };
      state.grid[2][2] = { type: 'CX', control: 1 };
      state.grid[3][1] = { type: 'CX', control: 0 };
      state.grid[4][0] = { type: 'H' };
      state.grid[5][2] = { type: 'CZ', control: 0 };
      state.grid[6][2] = { type: 'CX', control: 1 };
    },
    grover: () => {
      initGrid(2, 8);
      state.grid[0][0] = { type: 'H' };
      state.grid[0][1] = { type: 'H' };
      state.grid[1][1] = { type: 'CZ', control: 0 };
      state.grid[2][0] = { type: 'H' };
      state.grid[2][1] = { type: 'H' };
      state.grid[3][0] = { type: 'X' };
      state.grid[3][1] = { type: 'X' };
      state.grid[4][1] = { type: 'CZ', control: 0 };
      state.grid[5][0] = { type: 'X' };
      state.grid[5][1] = { type: 'X' };
      state.grid[6][0] = { type: 'H' };
      state.grid[6][1] = { type: 'H' };
    },
    deutsch: () => {
      initGrid(2, 5);
      state.grid[0][1] = { type: 'X' };
      state.grid[1][0] = { type: 'H' };
      state.grid[1][1] = { type: 'H' };
      state.grid[2][1] = { type: 'CX', control: 0 };
      state.grid[3][0] = { type: 'H' };
    }
  };

  // --- Gate title tooltip ---
  function getGateTitle(type) {
    const map = { H:'Hadamard — Superposition', X:'Pauli-X — NOT gate', Y:'Pauli-Y', Z:'Pauli-Z — Phase flip', S:'S — π/2 phase', T:'T — π/4 phase', CX:'CNOT — Controlled-NOT', CZ:'CZ — Controlled-Z', SWAP:'SWAP', M:'Measurement' };
    return map[type] || type;
  }

  // --- Render Circuit ---
  function renderCircuit() {
    const gridContainer = document.getElementById('circuitGrid');
    const svgOverlay = document.getElementById('circuitSvgOverlay');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';
    if (svgOverlay) svgOverlay.innerHTML = '';

    for (let q = 0; q < state.numQubits; q++) {
      const row = document.createElement('div');
      row.className = 'qubit-row';
      row.dataset.qubit = q;

      row.innerHTML = `
        <div class="qubit-label">
          <span class="qubit-name">q[${q}]</span>
          <span class="qubit-init">|0&rang;</span>
        </div>
        <div class="qubit-wire-line"></div>
        <div class="qubit-slots" id="slots-q${q}"></div>
      `;

      const slotsContainer = row.querySelector('.qubit-slots');

      for (let s = 0; s < state.numSteps; s++) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.dataset.qubit = q;
        slot.dataset.step = s;

        // Stepper active column highlighting
        if (state.activeStep !== null && s === state.activeStep) {
          slot.classList.add('active-step-col');
        }

        if (state.pendingControl && state.pendingControl.qubit === q && state.pendingControl.step === s) {
          slot.classList.add('pending-control');
        }

        const gate = state.grid[s][q];
        if (gate) {
          slot.classList.add('has-gate');
          let label = gate.type;
          let sub = '';
          if (gate.type === 'CX') { label = '\u2295'; sub = `c:q${gate.control}`; }
          else if (gate.type === 'CZ') { label = 'Z\u209C'; sub = `c:q${gate.control}`; }
          else if (gate.type === 'SWAP') { label = '\u21cc'; sub = `q${gate.target}`; }
          else if (gate.type === 'M') { label = 'M'; }
          else if (gate.type === 'Rx' || gate.type === 'Ry' || gate.type === 'Rz') {
            label = gate.type;
            const deg = ((gate.theta !== undefined ? gate.theta : Math.PI / 2) * 180 / Math.PI).toFixed(0);
            sub = `\u03b8:${deg}\u00b0`;
          }

          slot.innerHTML = `<div class="slot-gate-placed gate-${gate.type}" title="${getGateTitle(gate.type)}"><span>${label}</span>${sub ? `<span class="slot-gate-sub">${sub}</span>` : ''}</div>`;
        }

        slot.addEventListener('click', (e) => onSlotClick(q, s, e));
        slot.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          if (state.grid[s][q]) {
            pushUndo();
            state.grid[s][q] = null;
            state.pendingControl = null;
            renderCircuit();
            showNotification('Gate removed. (Ctrl+Z to undo)');
          }
        });

        slotsContainer.appendChild(slot);
      }
      gridContainer.appendChild(row);
    }

    requestAnimationFrame(() => renderConnectors());
    runSimulation();
    updateHilbertSpaceDisplay();
  }

  // --- SVG Connectors ---
  function renderConnectors() {
    const svg = document.getElementById('circuitSvgOverlay');
    if (!svg) return;
    svg.innerHTML = '';

    const boardEl = document.querySelector('.circuit-board');
    if (!boardEl) return;
    const boardRect = boardEl.getBoundingClientRect();
    if (boardRect.width === 0) return;

    // Glow filter
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `<filter id="svgGlow"><feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
    svg.appendChild(defs);

    for (let s = 0; s < state.numSteps; s++) {
      for (let q = 0; q < state.numQubits; q++) {
        const gate = state.grid[s][q];
        if (gate && (gate.type === 'CX' || gate.type === 'CZ') && gate.control !== undefined) {
          const ctrlSlot = document.querySelector(`.slot[data-qubit="${gate.control}"][data-step="${s}"]`);
          const tgtSlot = document.querySelector(`.slot[data-qubit="${q}"][data-step="${s}"]`);

          if (ctrlSlot && tgtSlot) {
            const cRect = ctrlSlot.getBoundingClientRect();
            const tRect = tgtSlot.getBoundingClientRect();
            const x = (cRect.left + cRect.width / 2) - boardRect.left;
            const y1 = (cRect.top + cRect.height / 2) - boardRect.top;
            const y2 = (tRect.top + tRect.height / 2) - boardRect.top;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x); line.setAttribute('y1', y1);
            line.setAttribute('x2', x); line.setAttribute('y2', y2);
            line.setAttribute('stroke', '#38bdf8'); line.setAttribute('stroke-width', '2');
            line.setAttribute('opacity', '0.75');
            svg.appendChild(line);

            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('cx', x); dot.setAttribute('cy', y1);
            dot.setAttribute('r', '5.5'); dot.setAttribute('fill', '#38bdf8');
            dot.setAttribute('filter', 'url(#svgGlow)');
            svg.appendChild(dot);
          }
        }
      }
    }
  }

  // --- Slot click handler ---
  function onSlotClick(q, s, e) {
    if (state.selectedGate === 'CX' || state.selectedGate === 'CZ') {
      if (state.pendingControl === null) {
        state.pendingControl = { qubit: q, step: s };
        showNotification(`Control q[${q}] set at step ${s + 1}. Now click target qubit.`);
        renderCircuit();
        return;
      }
      if (state.pendingControl.step !== s) {
        state.pendingControl = { qubit: q, step: s };
        showNotification(`Step changed to ${s + 1}. Control q[${q}] selected.`);
        renderCircuit();
        return;
      }
      if (state.pendingControl.qubit === q) {
        state.pendingControl = null;
        showNotification('Cancelled gate placement.');
        renderCircuit();
        return;
      }
      pushUndo();
      state.grid[s][q] = { type: state.selectedGate, control: state.pendingControl.qubit };
      state.pendingControl = null;
      renderCircuit();
      showNotification(`${state.selectedGate}: ctrl=q[${state.grid[s][q].control}] \u2192 q[${q}]`);
      return;
    }

    // Rotation gates: open angle selection modal
    if (state.selectedGate === 'Rx' || state.selectedGate === 'Ry' || state.selectedGate === 'Rz') {
      const current = state.grid[s][q];
      if (current && current.type === state.selectedGate) {
        pushUndo();
        state.grid[s][q] = null;
        renderCircuit();
        return;
      }
      state.pendingRotation = { qubit: q, step: s, type: state.selectedGate };
      openAngleModal(state.selectedGate);
      return;
    }

    pushUndo();
    const current = state.grid[s][q];
    state.grid[s][q] = (current && current.type === state.selectedGate) ? null : { type: state.selectedGate };
    state.pendingControl = null;
    renderCircuit();
  }

  // --- Run Simulation ---
  function runSimulation() {
    const sim = new Engine.CircuitSimulator(state.numQubits);
    const analysis = state.activeStep !== null
      ? sim.runUpToStep(state.grid, state.activeStep)
      : sim.run(state.grid);
    state.lastAnalysis = { sim, analysis };

    renderProbabilities(analysis.probabilities);
    renderStatevector(analysis.amplitudes, analysis.ketString);
    updateBlochSphere(analysis.blochVectors);
    renderCodeExports();
    updateStats();
    updateStepperDisplay();

    // Auto-save to localStorage
    try {
      localStorage.setItem('qflux_autosave', JSON.stringify({
        numQubits: state.numQubits,
        numSteps: state.numSteps,
        grid: state.grid
      }));
    } catch (e) {}
  }

  // --- Probability Bars ---
  function renderProbabilities(probs) {
    const list = document.getElementById('probList');
    if (!list) return;
    list.innerHTML = '';
    probs.forEach(item => {
      const pct = parseFloat(item.percentage);
      const row = document.createElement('div');
      row.className = 'prob-item';
      const barColor = pct > 40 ? 'linear-gradient(90deg,#6366f1,#38bdf8)' : pct > 5 ? 'linear-gradient(90deg,#8b5cf6,#6366f1)' : 'linear-gradient(90deg,#243046,#334155)';
      row.innerHTML = `
        <div class="prob-basis">|${item.basis}&rang;</div>
        <div class="prob-track"><div class="prob-fill" style="width:0%;background:${barColor}" data-w="${pct}"></div></div>
        <div class="prob-pct">${item.percentage}%</div>`;
      list.appendChild(row);
    });
    requestAnimationFrame(() => {
      list.querySelectorAll('.prob-fill[data-w]').forEach(b => { b.style.width = b.dataset.w + '%'; });
    });
  }

  // --- Statevector Table ---
  function renderStatevector(amps, ketString) {
    const ketEl = document.getElementById('stateKetDisplay');
    const tbody = document.getElementById('statevectorTableBody');
    if (ketEl) ketEl.textContent = ketString;
    if (!tbody) return;
    tbody.innerHTML = '';
    amps.forEach(item => {
      const tr = document.createElement('tr');
      const magPct = (item.mag * item.mag * 100).toFixed(1);
      const phaseDeg = (item.phase * 180 / Math.PI).toFixed(1);
      if (item.mag > 0.001) tr.style.background = 'rgba(99,102,241,0.05)';
      tr.innerHTML = `<td><strong style="color:var(--accent-cyan)">|${item.basis}&rang;</strong></td><td style="font-family:var(--font-mono)">${item.formatted}</td><td>${item.mag.toFixed(3)} <span style="color:var(--text-muted)">(${magPct}%)</span></td><td style="color:var(--accent-amber)">${phaseDeg}&deg;</td>`;
      tbody.appendChild(tr);
    });
  }

  // --- Bloch Sphere ---
  function updateBlochSphere(vectors) {
    if (!state.blochRenderer) {
      const canvas = document.getElementById('blochCanvas');
      if (canvas && BlochSphere) {
        state.blochRenderer = new BlochSphere.BlochSphereRenderer(canvas, { radius: 100 });
      }
    }
    const v = vectors[state.activeBlochQubit] || { x:0, y:0, z:1, r:1, thetaDeg:'0.0', phiDeg:'0.0' };
    if (state.blochRenderer) state.blochRenderer.setVector(v);

    const tEl = document.getElementById('blochTheta');
    const pEl = document.getElementById('blochPhi');
    const rEl = document.getElementById('blochPurity');
    if (tEl) tEl.textContent = v.thetaDeg + '\u00b0';
    if (pEl) pEl.textContent = v.phiDeg + '\u00b0';
    if (rEl) rEl.textContent = (v.r * 100).toFixed(0) + '%';

    const selector = document.getElementById('blochQubitSelector');
    if (selector) {
      selector.innerHTML = '';
      for (let q = 0; q < state.numQubits; q++) {
        const btn = document.createElement('button');
        btn.className = `btn btn-sm ${q === state.activeBlochQubit ? 'btn-primary' : 'btn-secondary'}`;
        btn.textContent = `q[${q}]`;
        btn.addEventListener('click', () => { state.activeBlochQubit = q; updateBlochSphere(vectors); });
        selector.appendChild(btn);
      }
    }
  }

  // --- Code Exports ---
  function renderCodeExports() {
    const qasmEl = document.getElementById('qasmCodeOutput');
    const pyEl = document.getElementById('qiskitCodeOutput');
    if (qasmEl) qasmEl.textContent = Engine.Exporter.toOpenQASM(state.grid, state.numQubits);
    if (pyEl) pyEl.textContent = Engine.Exporter.toQiskit(state.grid, state.numQubits);
  }

  // --- Stats ---
  function updateStats() {
    let gateCount = 0;
    const activeSteps = new Set();
    for (let s = 0; s < state.numSteps; s++) {
      for (let q = 0; q < state.numQubits; q++) {
        if (state.grid[s][q]) { gateCount++; activeSteps.add(s); }
      }
    }
    const cEl = document.getElementById('statGateCount');
    const dEl = document.getElementById('statCircuitDepth');
    if (cEl) cEl.textContent = gateCount;
    if (dEl) dEl.textContent = activeSteps.size;
    updateHilbertSpaceDisplay();
  }

  function toSup(n) {
    return String(n).split('').map(d => ('\u2070\u00b9\u00b2\u00b3\u2074\u2075\u2076\u2077\u2078\u2079')[parseInt(d)] || d).join('');
  }

  function updateHilbertSpaceDisplay() {
    const el = document.getElementById('statHilbertSpace');
    if (el) el.textContent = `2${toSup(state.numQubits)} = ${1 << state.numQubits}`;
  }

  // --- Toast Notification ---
  function showNotification(msg) {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    toast.style.animation = 'none';
    void toast.offsetWidth; // reflow to restart animation
    toast.style.animation = 'fadeIn 0.2s ease';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.style.display = 'none'; }, 2800);
  }

  // --- Shots Histogram (bar chart) ---
  function renderShotsHistogram(result) {
    const out = document.getElementById('shotsOutput');
    if (!out) return;

    const entries = Object.entries(result.counts).filter(([, v]) => v > 0);
    const maxCount = Math.max(...entries.map(([, v]) => v));

    let html = `<div class="shots-histogram"><div class="shots-title"><span>\ud83d\udcca Measurement Results</span><span class="shots-count-badge">${result.shots} shots</span></div><div class="shots-bars">`;
    entries.forEach(([basis, count]) => {
      const relPct = maxCount > 0 ? (count / maxCount * 100).toFixed(1) : 0;
      const absPct = (count / result.shots * 100).toFixed(1);
      html += `<div class="shots-bar-group"><div class="shots-bar-label">|${basis}&rang;</div><div class="shots-bar-track"><div class="shots-bar-fill" style="width:0%" data-w="${relPct}"></div></div><div class="shots-bar-stats"><span class="shots-count">${count}</span><span class="shots-pct">${absPct}%</span></div></div>`;
    });
    html += `</div></div>`;
    out.innerHTML = html;

    requestAnimationFrame(() => {
      out.querySelectorAll('.shots-bar-fill[data-w]').forEach(b => { b.style.width = b.dataset.w + '%'; });
    });
  }

  // --- Stepper Transport Controls ---
  function updateStepperDisplay() {
    const badge = document.getElementById('stepIndicatorBadge');
    const playBtn = document.getElementById('btnPlayPause');
    if (badge) {
      if (state.activeStep === null) {
        badge.textContent = 'Full Circuit';
      } else {
        badge.textContent = `Step ${state.activeStep + 1} of ${state.numSteps}`;
      }
    }
    if (playBtn) {
      playBtn.textContent = state.isPlaying ? '⏸' : '▶';
      if (state.isPlaying) {
        playBtn.classList.add('btn-play-active');
      } else {
        playBtn.classList.remove('btn-play-active');
      }
    }
  }

  function stepTo(stepIdx) {
    if (stepIdx === null) {
      state.activeStep = null;
    } else {
      state.activeStep = Math.max(0, Math.min(state.numSteps - 1, stepIdx));
    }
    renderCircuit();
  }

  function stepReset() {
    pause();
    stepTo(0);
    showNotification('Stepped to Step 1.');
  }

  function stepPrev() {
    pause();
    if (state.activeStep === null) {
      stepTo(state.numSteps - 1);
    } else {
      stepTo(Math.max(0, state.activeStep - 1));
    }
  }

  function stepNext() {
    pause();
    if (state.activeStep === null) {
      stepTo(0);
    } else {
      stepTo(Math.min(state.numSteps - 1, state.activeStep + 1));
    }
  }

  function stepEnd() {
    pause();
    stepTo(null);
    showNotification('Stepped to full circuit.');
  }

  function togglePlay() {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }

  function play() {
    state.isPlaying = true;
    updateStepperDisplay();
    if (state.activeStep === null || state.activeStep >= state.numSteps - 1) {
      state.activeStep = 0;
      renderCircuit();
    }
    clearInterval(state.playbackTimer);
    state.playbackTimer = setInterval(() => {
      if (state.activeStep === null) state.activeStep = 0;
      if (state.activeStep < state.numSteps - 1) {
        state.activeStep++;
        renderCircuit();
      } else {
        pause();
      }
    }, state.playbackSpeed);
  }

  function pause() {
    state.isPlaying = false;
    clearInterval(state.playbackTimer);
    updateStepperDisplay();
  }

  // --- Angle Picker Modal ---
  function openAngleModal(type) {
    const modal = document.getElementById('angleModal');
    if (!modal) return;
    modal.classList.add('open');
    const input = document.getElementById('customAngleInput');
    if (input) input.value = state.currentRotationAngle.toFixed(4);
  }

  function closeAngleModal() {
    const modal = document.getElementById('angleModal');
    if (modal) modal.classList.remove('open');
    state.pendingRotation = null;
  }

  function applyAngleModal() {
    if (!state.pendingRotation) return;
    const input = document.getElementById('customAngleInput');
    let angle = parseFloat(input ? input.value : state.currentRotationAngle);
    if (isNaN(angle)) angle = Math.PI / 2;
    state.currentRotationAngle = angle;

    const { qubit, step, type } = state.pendingRotation;
    pushUndo();
    state.grid[step][qubit] = { type, theta: angle };
    closeAngleModal();
    renderCircuit();
    showNotification(`${type} gate placed (\u03b8 = ${((angle * 180) / Math.PI).toFixed(1)}\u00b0)`);
  }

  // --- Export / Import JSON & Share ---
  function exportJson() {
    const data = {
      app: 'Qflux',
      version: '2.0',
      timestamp: new Date().toISOString(),
      numQubits: state.numQubits,
      numSteps: state.numSteps,
      grid: state.grid
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qflux_circuit_${Date.now()}.qflux.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Circuit exported as JSON file.');
  }

  function importJson(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.grid && Array.isArray(data.grid)) {
          pushUndo();
          state.numQubits = Math.max(1, Math.min(6, data.numQubits || data.grid[0].length));
          state.numSteps = Math.max(4, Math.min(12, data.numSteps || data.grid.length));
          state.grid = data.grid;
          state.activeStep = null;
          renderCircuit();
          showNotification('Circuit successfully loaded from file!');
        } else {
          showNotification('Invalid circuit file format.');
        }
      } catch (err) {
        showNotification('Error reading circuit file.');
      }
    };
    reader.readAsText(file);
  }

  function openShareModal() {
    const modal = document.getElementById('shareModal');
    const disp = document.getElementById('shareUrlDisplay');
    if (!modal || !disp) return;

    const payload = {
      q: state.numQubits,
      s: state.numSteps,
      g: state.grid
    };
    const encoded = encodeURIComponent(btoa(JSON.stringify(payload)));
    const fullUrl = `${window.location.origin}${window.location.pathname}#circuit=${encoded}`;
    disp.textContent = fullUrl;
    modal.classList.add('open');
  }

  function closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) modal.classList.remove('open');
  }

  function copyShareUrl() {
    const disp = document.getElementById('shareUrlDisplay');
    const btn = document.getElementById('copyShareUrlBtn');
    if (disp && navigator.clipboard) {
      navigator.clipboard.writeText(disp.textContent).then(() => {
        if (btn) {
          const orig = btn.textContent;
          btn.textContent = '\u2713 Copied Link!';
          btn.style.color = 'var(--accent-emerald)';
          setTimeout(() => {
            btn.textContent = orig;
            btn.style.color = '';
          }, 1800);
        }
      });
    }
  }

  function restoreFromUrlHash() {
    if (!window.location.hash.includes('circuit=')) return false;
    try {
      const raw = window.location.hash.split('circuit=')[1];
      const json = atob(decodeURIComponent(raw));
      const data = JSON.parse(json);
      if (data && data.g) {
        state.numQubits = Math.max(1, Math.min(6, data.q));
        state.numSteps = Math.max(4, Math.min(12, data.s));
        state.grid = data.g;
        showNotification('Circuit loaded from share link!');
        return true;
      }
    } catch (e) {
      console.warn('URL hash parse failed:', e);
    }
    return false;
  }

  // --- Events ---
  function setupEvents() {
    // Gate palette
    const gateButtons = document.querySelectorAll('.gate-btn');
    gateButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        gateButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedGate = btn.dataset.gate;
        state.pendingControl = null;
        renderCircuit();
      });
    });

    // Preset selector
    const presetSelect = document.getElementById('presetSelect');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (PRESETS[val]) {
          PRESETS[val]();
          state.activeStep = null;
          renderCircuit();
          showNotification(`Loaded: ${presetSelect.options[presetSelect.selectedIndex].text}`);
        }
      });
    }

    // Dimension controls
    document.getElementById('addQubitBtn')?.addEventListener('click', () => {
      if (state.numQubits < 6) {
        pushUndo(); state.numQubits++;
        for (let s = 0; s < state.numSteps; s++) state.grid[s].push(null);
        renderCircuit(); showNotification(`Added q[${state.numQubits - 1}]. Hilbert space: ${1 << state.numQubits}D.`);
      } else { showNotification('Max 6 qubits (64D Hilbert space).'); }
    });

    document.getElementById('removeQubitBtn')?.addEventListener('click', () => {
      if (state.numQubits > 1) {
        pushUndo(); state.numQubits--;
        for (let s = 0; s < state.numSteps; s++) state.grid[s].pop();
        if (state.activeBlochQubit >= state.numQubits) state.activeBlochQubit = state.numQubits - 1;
        renderCircuit(); showNotification(`Removed q[${state.numQubits}].`);
      } else { showNotification('Minimum 1 qubit.'); }
    });

    document.getElementById('addStepBtn')?.addEventListener('click', () => {
      if (state.numSteps < 12) {
        pushUndo(); state.numSteps++;
        state.grid.push(new Array(state.numQubits).fill(null));
        renderCircuit();
      } else { showNotification('Max 12 steps.'); }
    });

    document.getElementById('removeStepBtn')?.addEventListener('click', () => {
      if (state.numSteps > 4) {
        pushUndo(); state.numSteps--;
        state.grid.pop();
        if (state.activeStep >= state.numSteps) state.activeStep = state.numSteps - 1;
        renderCircuit();
      } else { showNotification('Min 4 steps.'); }
    });

    document.getElementById('clearCircuitBtn')?.addEventListener('click', () => {
      pushUndo();
      initGrid(state.numQubits, state.numSteps);
      state.activeStep = null;
      renderCircuit();
      showNotification('Circuit cleared. Ctrl+Z to undo.');
    });

    // Transport Debugger Controls
    document.getElementById('btnStepReset')?.addEventListener('click', stepReset);
    document.getElementById('btnStepPrev')?.addEventListener('click', stepPrev);
    document.getElementById('btnPlayPause')?.addEventListener('click', togglePlay);
    document.getElementById('btnStepNext')?.addEventListener('click', stepNext);
    document.getElementById('btnStepEnd')?.addEventListener('click', stepEnd);
    document.getElementById('playbackSpeedSelect')?.addEventListener('change', (e) => {
      state.playbackSpeed = parseInt(e.target.value, 10);
      if (state.isPlaying) { play(); }
    });

    // Angle Modal Controls
    document.getElementById('closeAngleModal')?.addEventListener('click', closeAngleModal);
    document.getElementById('cancelAngleModal')?.addEventListener('click', closeAngleModal);
    document.getElementById('applyAngleModal')?.addEventListener('click', applyAngleModal);
    document.querySelectorAll('.preset-angle-btn').forEach(b => {
      b.addEventListener('click', () => {
        const inp = document.getElementById('customAngleInput');
        if (inp) inp.value = b.dataset.angle;
      });
    });

    // Share & File Controls
    document.getElementById('shareBtn')?.addEventListener('click', openShareModal);
    document.getElementById('closeShareModal')?.addEventListener('click', closeShareModal);
    document.getElementById('copyShareUrlBtn')?.addEventListener('click', copyShareUrl);
    document.getElementById('exportJsonBtn')?.addEventListener('click', exportJson);
    document.getElementById('importJsonBtn')?.addEventListener('click', () => {
      document.getElementById('jsonFileInput')?.click();
    });
    document.getElementById('jsonFileInput')?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        importJson(e.target.files[0]);
        e.target.value = '';
      }
    });

    // Tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const target = document.getElementById(tabId);
        if (target) target.classList.add('active');
        if (tabId === 'tab-bloch' && state.blochRenderer && state.lastAnalysis) {
          state.blochRenderer.setVector(state.lastAnalysis.analysis.blochVectors[state.activeBlochQubit] || { x:0, y:0, z:1, r:1 });
        }
      });
    });

    // Copy buttons
    document.querySelectorAll('.btn-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const el = document.getElementById(btn.dataset.copyTarget);
        if (el && navigator.clipboard) {
          navigator.clipboard.writeText(el.textContent).then(() => {
            const orig = btn.textContent;
            btn.textContent = '\u2713 Copied!';
            btn.style.color = 'var(--accent-emerald)';
            setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 1800);
          });
        }
      });
    });

    // Shots button
    document.getElementById('sampleShotsBtn')?.addEventListener('click', () => {
      const sim = new Engine.CircuitSimulator(state.numQubits);
      sim.run(state.grid);
      const result = sim.sampleShots(state.shots);
      renderShotsHistogram(result);
      showNotification(`Sampled ${result.shots} shots.`);
    });

    // Keyboard shortcuts: Undo/Redo & Play/Step
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault(); undo(); showNotification('\u21a9 Undo');
      } else if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'y')) {
        e.preventDefault(); redo(); showNotification('\u21aa Redo');
      } else if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault(); togglePlay();
      }
    });

    // Resize
    window.addEventListener('resize', () => requestAnimationFrame(() => renderConnectors()));
  }

  // --- URL preset check ---
  function checkUrlPreset() {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('preset');
    if (p && PRESETS[p]) {
      const sel = document.getElementById('presetSelect');
      if (sel) sel.value = p;
      PRESETS[p]();
      return true;
    }
    return false;
  }

  // --- Startup ---
  document.addEventListener('DOMContentLoaded', () => {
    setupEvents();
    const hasHash = restoreFromUrlHash();
    if (!hasHash) {
      const hasPreset = checkUrlPreset();
      if (!hasPreset) {
        PRESETS.bell();
      }
    }
    renderCircuit();
  });

  window.QfluxApp = {
    state,
    PRESETS,
    undo,
    redo,
    stepTo,
    stepReset,
    stepPrev,
    stepNext,
    stepEnd,
    togglePlay,
    exportJson,
    importJson,
    openShareModal,
    loadPreset: (n) => { if (PRESETS[n]) { PRESETS[n](); renderCircuit(); } }
  };
})();
