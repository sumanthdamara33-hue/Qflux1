/**
 * Qflux Quantum Simulation Engine
 * High-performance, client-side complex statevector simulator.
 * Supports standard gates, parameterized rotation gates (Rx, Ry, Rz),
 * and step-by-step circuit execution for quantum debugging.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.QfluxEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  // --- Complex Number Class ---
  class Complex {
    constructor(re = 0, im = 0) {
      this.re = Number(re);
      this.im = Number(im);
    }

    static fromPolar(r, theta) {
      return new Complex(r * Math.cos(theta), r * Math.sin(theta));
    }

    add(c) {
      return new Complex(this.re + c.re, this.im + c.im);
    }

    sub(c) {
      return new Complex(this.re - c.re, this.im - c.im);
    }

    mul(c) {
      if (typeof c === 'number') {
        return new Complex(this.re * c, this.im * c);
      }
      return new Complex(
        this.re * c.re - this.im * c.im,
        this.re * c.im + this.im * c.re
      );
    }

    div(c) {
      if (typeof c === 'number') {
        return new Complex(this.re / c, this.im / c);
      }
      const denom = c.re * c.re + c.im * c.im;
      return new Complex(
        (this.re * c.re + this.im * c.im) / denom,
        (this.im * c.re - this.re * c.im) / denom
      );
    }

    conj() {
      return new Complex(this.re, -this.im);
    }

    magSq() {
      return this.re * this.re + this.im * this.im;
    }

    mag() {
      return Math.sqrt(this.magSq());
    }

    phase() {
      return Math.atan2(this.im, this.re);
    }

    format(digits = 3) {
      const r = this.re.toFixed(digits);
      const i = Math.abs(this.im).toFixed(digits);
      if (Math.abs(this.im) < 1e-6) return r;
      if (Math.abs(this.re) < 1e-6) return (this.im >= 0 ? '' : '-') + i + 'i';
      return `${r} ${this.im >= 0 ? '+' : '-'} ${i}i`;
    }
  }

  // --- Common Unitary Matrices (2x2) ---
  const SQRT1_2 = Math.SQRT1_2;
  const GATES_1Q = {
    I: [
      [new Complex(1, 0), new Complex(0, 0)],
      [new Complex(0, 0), new Complex(1, 0)]
    ],
    X: [
      [new Complex(0, 0), new Complex(1, 0)],
      [new Complex(1, 0), new Complex(0, 0)]
    ],
    Y: [
      [new Complex(0, 0), new Complex(0, -1)],
      [new Complex(0, 1), new Complex(0, 0)]
    ],
    Z: [
      [new Complex(1, 0), new Complex(0, 0)],
      [new Complex(0, 0), new Complex(-1, 0)]
    ],
    H: [
      [new Complex(SQRT1_2, 0), new Complex(SQRT1_2, 0)],
      [new Complex(SQRT1_2, 0), new Complex(-SQRT1_2, 0)]
    ],
    S: [
      [new Complex(1, 0), new Complex(0, 0)],
      [new Complex(0, 0), new Complex(0, 1)]
    ],
    T: [
      [new Complex(1, 0), new Complex(0, 0)],
      [new Complex(0, 0), new Complex(SQRT1_2, SQRT1_2)]
    ]
  };

  // Parameterized Rotation Gate Generators
  function createRx(theta = Math.PI / 2) {
    const half = theta / 2;
    const c = Math.cos(half);
    const s = Math.sin(half);
    return [
      [new Complex(c, 0), new Complex(0, -s)],
      [new Complex(0, -s), new Complex(c, 0)]
    ];
  }

  function createRy(theta = Math.PI / 2) {
    const half = theta / 2;
    const c = Math.cos(half);
    const s = Math.sin(half);
    return [
      [new Complex(c, 0), new Complex(-s, 0)],
      [new Complex(s, 0), new Complex(c, 0)]
    ];
  }

  function createRz(theta = Math.PI / 2) {
    const half = theta / 2;
    return [
      [new Complex(Math.cos(-half), Math.sin(-half)), new Complex(0, 0)],
      [new Complex(0, 0), new Complex(Math.cos(half), Math.sin(half))]
    ];
  }

  // --- Quantum Circuit State Simulator ---
  class CircuitSimulator {
    constructor(numQubits = 3) {
      this.numQubits = Math.max(1, Math.min(5, numQubits));
      this.dim = 1 << this.numQubits;
      this.statevector = [];
      this.reset();
    }

    reset() {
      this.statevector = new Array(this.dim);
      for (let i = 0; i < this.dim; i++) {
        this.statevector[i] = new Complex(i === 0 ? 1 : 0, 0);
      }
    }

    /**
     * Apply a single-qubit 2x2 unitary matrix to qubit q.
     */
    apply1QGate(matrix, targetQubit) {
      const bitMask = 1 << targetQubit;
      const m00 = matrix[0][0];
      const m01 = matrix[0][1];
      const m10 = matrix[1][0];
      const m11 = matrix[1][1];

      for (let i = 0; i < this.dim; i++) {
        if ((i & bitMask) === 0) {
          const j = i | bitMask;
          const v0 = this.statevector[i];
          const v1 = this.statevector[j];

          this.statevector[i] = m00.mul(v0).add(m01.mul(v1));
          this.statevector[j] = m10.mul(v0).add(m11.mul(v1));
        }
      }
    }

    /**
     * Apply Controlled-NOT (CX)
     */
    applyCX(controlQubit, targetQubit) {
      if (controlQubit === targetQubit) return;
      const cMask = 1 << controlQubit;
      const tMask = 1 << targetQubit;

      for (let i = 0; i < this.dim; i++) {
        if ((i & cMask) !== 0 && (i & tMask) === 0) {
          const j = i | tMask;
          const temp = this.statevector[i];
          this.statevector[i] = this.statevector[j];
          this.statevector[j] = temp;
        }
      }
    }

    /**
     * Apply Controlled-Z (CZ)
     */
    applyCZ(controlQubit, targetQubit) {
      if (controlQubit === targetQubit) return;
      const cMask = 1 << controlQubit;
      const tMask = 1 << targetQubit;

      for (let i = 0; i < this.dim; i++) {
        if ((i & cMask) !== 0 && (i & tMask) !== 0) {
          this.statevector[i] = this.statevector[i].mul(-1);
        }
      }
    }

    /**
     * Apply SWAP gate between q1 and q2
     */
    applySWAP(q1, q2) {
      if (q1 === q2) return;
      const m1 = 1 << q1;
      const m2 = 1 << q2;

      for (let i = 0; i < this.dim; i++) {
        const b1 = (i & m1) !== 0;
        const b2 = (i & m2) !== 0;
        if (b1 && !b2) {
          const j = (i ^ m1) | m2;
          const temp = this.statevector[i];
          this.statevector[i] = this.statevector[j];
          this.statevector[j] = temp;
        }
      }
    }

    /**
     * Executes the full circuit up to a given step limit (for the step debugger).
     */
    runUpToStep(steps, maxStep = Infinity) {
      this.reset();
      if (!steps || !Array.isArray(steps)) return this.getAnalysis();

      const limit = Math.min(steps.length, maxStep + 1);
      for (let stepIndex = 0; stepIndex < limit; stepIndex++) {
        const step = steps[stepIndex];
        if (!step) continue;

        const ops = [];
        for (let q = 0; q < this.numQubits; q++) {
          const slot = step[q];
          if (slot) {
            ops.push({ qubit: q, ...slot });
          }
        }

        const processedQubits = new Set();
        // Multi-qubit gates
        ops.forEach(op => {
          if (op.type === 'CX' && op.control !== undefined) {
            this.applyCX(op.control, op.qubit);
            processedQubits.add(op.qubit);
            processedQubits.add(op.control);
          } else if (op.type === 'CZ' && op.control !== undefined) {
            this.applyCZ(op.control, op.qubit);
            processedQubits.add(op.qubit);
            processedQubits.add(op.control);
          } else if (op.type === 'SWAP' && op.target !== undefined) {
            this.applySWAP(op.qubit, op.target);
            processedQubits.add(op.qubit);
            processedQubits.add(op.target);
          }
        });

        // Single-qubit & parameterized rotation gates
        ops.forEach(op => {
          if (!processedQubits.has(op.qubit)) {
            if (GATES_1Q[op.type]) {
              this.apply1QGate(GATES_1Q[op.type], op.qubit);
            } else if (op.type === 'Rx') {
              this.apply1QGate(createRx(op.theta || Math.PI / 2), op.qubit);
            } else if (op.type === 'Ry') {
              this.apply1QGate(createRy(op.theta || Math.PI / 2), op.qubit);
            } else if (op.type === 'Rz') {
              this.apply1QGate(createRz(op.theta || Math.PI / 2), op.qubit);
            }
          }
        });
      }

      return this.getAnalysis();
    }

    run(steps) {
      return this.runUpToStep(steps, steps.length);
    }

    /**
     * Calculates probabilities, basis amplitudes, Bloch coordinates, and ket formula.
     */
    getAnalysis() {
      const probabilities = [];
      const amplitudes = [];
      const nonZeroTerms = [];

      for (let i = 0; i < this.dim; i++) {
        const amp = this.statevector[i];
        const prob = amp.magSq();
        const binStr = i.toString(2).padStart(this.numQubits, '0');

        probabilities.push({
          index: i,
          basis: binStr,
          probability: prob,
          percentage: (prob * 100).toFixed(1)
        });

        amplitudes.push({
          index: i,
          basis: binStr,
          re: amp.re,
          im: amp.im,
          mag: amp.mag(),
          phase: amp.phase(),
          formatted: amp.format(3)
        });

        if (prob > 0.001) {
          const magStr = amp.mag().toFixed(3);
          const ph = amp.phase();
          let phaseStr = '';
          if (Math.abs(ph) > 0.01) {
            phaseStr = `e^{i${(ph / Math.PI).toFixed(2)}π}`;
          }
          nonZeroTerms.push(`${magStr}${phaseStr}|${binStr}⟩`);
        }
      }

      // Compute Bloch vector (X, Y, Z) for each qubit
      const blochVectors = [];
      for (let q = 0; q < this.numQubits; q++) {
        blochVectors.push(this.computeBlochVector(q));
      }

      const ketString = nonZeroTerms.length > 0
        ? '|ψ⟩ = ' + nonZeroTerms.join(' + ')
        : '|ψ⟩ = |' + '0'.repeat(this.numQubits) + '⟩';

      return {
        numQubits: this.numQubits,
        statevector: this.statevector,
        probabilities,
        amplitudes,
        blochVectors,
        ketString
      };
    }

    /**
     * Compute Bloch sphere coordinates (x, y, z) for target qubit q.
     */
    computeBlochVector(q) {
      const mask = 1 << q;
      let expZ = 0;
      let sumReX = 0;
      let sumImY = 0;

      for (let i = 0; i < this.dim; i++) {
        const prob = this.statevector[i].magSq();
        expZ += ((i & mask) === 0 ? 1 : -1) * prob;

        if ((i & mask) === 0) {
          const j = i | mask;
          const vi = this.statevector[i];
          const vj = this.statevector[j];

          sumReX += 2 * (vi.re * vj.re + vi.im * vj.im);
          sumImY += 2 * (vi.re * vj.im - vi.im * vj.re);
        }
      }

      const x = Math.max(-1, Math.min(1, sumReX));
      const y = Math.max(-1, Math.min(1, sumImY));
      const z = Math.max(-1, Math.min(1, expZ));
      const r = Math.sqrt(x * x + y * y + z * z);
      const theta = r > 1e-6 ? Math.acos(Math.max(-1, Math.min(1, z / (r || 1)))) : 0;
      const phi = Math.atan2(y, x);

      return {
        qubit: q,
        x,
        y,
        z,
        r: Math.min(1, r),
        theta,
        phi,
        thetaDeg: (theta * 180 / Math.PI).toFixed(1),
        phiDeg: (phi * 180 / Math.PI).toFixed(1)
      };
    }

    /**
     * Sample measurement outcomes for N shots using Born rule probabilities.
     */
    sampleShots(shots = 1024) {
      const counts = {};
      for (let i = 0; i < this.dim; i++) {
        counts[i.toString(2).padStart(this.numQubits, '0')] = 0;
      }

      const cdf = [];
      let cumulative = 0;
      for (let i = 0; i < this.dim; i++) {
        cumulative += this.statevector[i].magSq();
        cdf.push(cumulative);
      }

      for (let s = 0; s < shots; s++) {
        const r = Math.random();
        let selectedIndex = this.dim - 1;
        for (let i = 0; i < this.dim; i++) {
          if (r <= cdf[i]) {
            selectedIndex = i;
            break;
          }
        }
        const key = selectedIndex.toString(2).padStart(this.numQubits, '0');
        counts[key] = (counts[key] || 0) + 1;
      }

      return {
        shots,
        counts
      };
    }
  }

  // --- Exporters: OpenQASM 2.0 and Python Qiskit ---
  const Exporter = {
    toOpenQASM(circuitGrid, numQubits) {
      let qasm = `// Generated by Qflux Quantum Studio\n`;
      qasm += `OPENQASM 2.0;\ninclude "qelib1.inc";\n\n`;
      qasm += `qreg q[${numQubits}];\ncreg c[${numQubits}];\n\n`;

      for (let stepIndex = 0; stepIndex < circuitGrid.length; stepIndex++) {
        const step = circuitGrid[stepIndex];
        if (!step) continue;

        for (let q = 0; q < numQubits; q++) {
          const op = step[q];
          if (op && op.type === 'CX' && op.control !== undefined) {
            qasm += `cx q[${op.control}], q[${q}];\n`;
          } else if (op && op.type === 'CZ' && op.control !== undefined) {
            qasm += `cz q[${op.control}], q[${q}];\n`;
          } else if (op && op.type === 'SWAP' && op.target !== undefined) {
            qasm += `swap q[${q}], q[${op.target}];\n`;
          }
        }

        for (let q = 0; q < numQubits; q++) {
          const op = step[q];
          if (op && GATES_1Q[op.type]) {
            qasm += `${op.type.toLowerCase()} q[${q}];\n`;
          } else if (op && (op.type === 'Rx' || op.type === 'Ry' || op.type === 'Rz')) {
            const angleStr = (op.theta || Math.PI / 2).toFixed(4);
            qasm += `${op.type.toLowerCase()}(${angleStr}) q[${q}];\n`;
          } else if (op && op.type === 'M') {
            qasm += `measure q[${q}] -> c[${q}];\n`;
          }
        }
      }

      return qasm;
    },

    toQiskit(circuitGrid, numQubits) {
      let py = `# Generated by Qflux Quantum Studio\n`;
      py += `from qiskit import QuantumCircuit, Aer, execute\nimport numpy as np\n\n`;
      py += `qc = QuantumCircuit(${numQubits}, ${numQubits})\n\n`;

      for (let stepIndex = 0; stepIndex < circuitGrid.length; stepIndex++) {
        const step = circuitGrid[stepIndex];
        if (!step) continue;

        for (let q = 0; q < numQubits; q++) {
          const op = step[q];
          if (op && op.type === 'CX' && op.control !== undefined) {
            py += `qc.cx(${op.control}, ${q})\n`;
          } else if (op && op.type === 'CZ' && op.control !== undefined) {
            py += `qc.cz(${op.control}, ${q})\n`;
          } else if (op && op.type === 'SWAP' && op.target !== undefined) {
            py += `qc.swap(${q}, ${op.target})\n`;
          }
        }

        for (let q = 0; q < numQubits; q++) {
          const op = step[q];
          if (op && GATES_1Q[op.type]) {
            py += `qc.${op.type.toLowerCase()}(${q})\n`;
          } else if (op && (op.type === 'Rx' || op.type === 'Ry' || op.type === 'Rz')) {
            const angle = op.theta || Math.PI / 2;
            py += `qc.${op.type.toLowerCase()}(${angle.toFixed(4)}, ${q})\n`;
          } else if (op && op.type === 'M') {
            py += `qc.measure(${q}, ${q})\n`;
          }
        }
      }

      py += `\n# Simulate using Statevector Simulator\n`;
      py += `backend = Aer.get_backend('statevector_simulator')\n`;
      py += `result = execute(qc, backend).result()\n`;
      py += `statevector = result.get_statevector(qc)\n`;
      py += `print("Statevector:", statevector)\n`;

      return py;
    }
  };

  return {
    Complex,
    GATES_1Q,
    createRx,
    createRy,
    createRz,
    CircuitSimulator,
    Exporter
  };
});
