/**
 * Vyshu AI — Quantum Computing Voice Assistant for Qflux
 * Features:
 *  • 🎤 Voice Input  — Web Speech API SpeechRecognition
 *  • 🔊 Voice Output — Web Speech SpeechSynthesis (TTS)
 *  • 💬 Text chat with streaming-feel typing animation
 *  • 🧠 35+ quantum KB entries + circuit-context awareness
 *  • 🌊 Waveform visualizer while speaking/listening
 */

(function (root, factory) {
    root.VyshuAI = factory();
})(typeof self !== 'undefined' ? self : this, function () {

    // ── Knowledge Base ────────────────────────────────────────────
    const KB = [
        {
            patterns: ['what is hadamard', 'h gate', 'hadamard gate', 'hadamard'],
            answer: `Hadamard gate creates superposition from a basis state. H on zero gives equal superposition of zero and one. H on one gives zero minus one, divided by root two. The matrix is one over root two times the 2x2 matrix with ones and a minus one. Use the H button in the gate palette to place it.`
        },
        {
            patterns: ['pauli x', 'x gate', 'not gate', 'bit flip'],
            answer: `Pauli-X is the quantum NOT gate. It flips qubit zero to one, and one to zero. The matrix is zero-one, one-zero. It's useful for initializing qubits to the one state before circuits.`
        },
        {
            patterns: ['pauli y', 'y gate'],
            answer: `Pauli-Y combines both bit-flip and phase-flip. Y on zero gives i times one, and Y on one gives negative i times zero. It rotates the Bloch vector 180 degrees around the Y-axis.`
        },
        {
            patterns: ['pauli z', 'z gate', 'phase flip'],
            answer: `Pauli-Z flips the phase of the one state without changing zero. Z on zero stays zero, and Z on one becomes negative one. On the Bloch sphere, it leaves the North pole unchanged and flips the South pole.`
        },
        {
            patterns: ['cnot', 'cx gate', 'controlled not', 'controlled-not', 'cnot gate', 'cx placement', 'how to place cx', 'place cx gate', 'cnot placement'],
            answer: `CNOT or CX gate is a two-qubit gate that flips the target qubit only when the control qubit is in state one. To place it in Qflux: select CX, click the control qubit slot first, then click the target qubit slot.`
        },
        {
            patterns: ['cz gate', 'controlled z', 'controlled-z'],
            answer: `Controlled-Z gate applies a phase flip to the target only when control is one. Only the eleven state gets a phase flip. It's symmetric, meaning control and target are interchangeable. It's key in Grover's diffusion operator.`
        },
        {
            patterns: ['s gate', 's phase', 'pi/2 phase', 's-gate'],
            answer: `S gate applies a 90-degree phase to the one state. S on zero stays zero, and S on one becomes i times one. Note that S equals T squared.`
        },
        {
            patterns: ['t gate', 't phase', 'pi/4 phase', 't-gate'],
            answer: `T gate applies a 45-degree phase to the one state. T on one equals e to the power i-pi over 4 times one. It's critical for universal quantum computation. T equals the square root of S.`
        },
        {
            patterns: ['rx gate', 'rotation x', 'rx rotation', 'rx'],
            answer: `Rx of theta rotates the Bloch vector around the X-axis by angle theta. The matrix entries involve cosine and i-sine of half-theta. Click the Rx palette button, then a slot, to configure the angle.`
        },
        {
            patterns: ['ry gate', 'rotation y', 'ry rotation', 'ry'],
            answer: `Ry of theta rotates the Bloch vector around the Y-axis. Its matrix entries are all real — cosine and sine of half-theta — making it unique among rotation gates.`
        },
        {
            patterns: ['rz gate', 'rotation z', 'rz rotation', 'rz'],
            answer: `Rz of theta rotates the Bloch vector around the Z-axis. Notably, S equals Rz of pi over 2, Z equals Rz of pi, and T equals Rz of pi over 4.`
        },
        {
            patterns: ['measurement', 'm gate', 'measure qubit', 'collapse', 'measuring'],
            answer: `The Measurement gate collapses a qubit's superposition to a definite basis state — either zero or one — with probabilities given by the Born rule. Measurement is irreversible. Use the Sample Shots button to simulate many measurements.`
        },
        {
            patterns: ['bell state', 'bell pair', 'epr pair', 'bell'],
            answer: `Bell State is the maximally entangled 2-qubit state: one over root two times the quantity zero-zero plus one-one. To create it: apply H to qubit zero, then CNOT from qubit zero to qubit one. Load it from Presets menu as Bell State.`
        },
        {
            patterns: ['ghz', 'greenberger', '3 qubit entanglement', 'ghz state'],
            answer: `GHZ state is a 3-qubit maximally entangled state: one over root two times zero-zero-zero plus one-one-one. Circuit: H on qubit zero, CNOT from zero to one, CNOT from one to two. All 3 qubits become perfectly correlated.`
        },
        {
            patterns: ['grover', "grover's", 'grover search', 'amplitude amplification'],
            answer: `Grover's Search Algorithm gives quadratic speedup over classical search — order root-N quantum queries versus order N classical. Steps: create superposition with Hadamard gates, apply an oracle to mark the target state, apply a diffusion operator to amplify the target, and repeat. In the 2-qubit case, just one Grover iteration gives 100% probability of measuring the target.`
        },
        {
            patterns: ['deutsch', "deutsch's", 'deutsch algorithm', 'constant balanced'],
            answer: `Deutsch's Algorithm determines if a function is constant or balanced with just one quantum query, versus two classical queries. If qubit zero measures zero, the function is constant. If it measures one, the function is balanced. It uses the phase kickback trick with Hadamard gates.`
        },
        {
            patterns: ['teleportation', 'quantum teleportation', 'state transfer'],
            answer: `Quantum Teleportation transfers an arbitrary qubit state without sending the physical qubit. It uses a shared Bell pair plus two classical bits of communication. The unknown state is perfectly reconstructed on the receiver's side. Importantly, it does not send information faster than light because a classical channel is required.`
        },
        {
            patterns: ['superposition', 'what is superposition', 'quantum superposition'],
            answer: `Quantum superposition means a qubit can exist in a combination of zero and one simultaneously. The state is alpha times zero plus beta times one, where the sum of the squared magnitudes equals one. Unlike classical bits, a qubit holds both values until measured. The Hadamard gate creates equal superposition.`
        },
        {
            patterns: ['bloch sphere', 'bloch vector', 'what is bloch', 'bloch'],
            answer: `The Bloch Sphere is a unit sphere representing all possible pure qubit states. The North pole is the zero state, the South pole is the one state, and the equator represents superposition states. The longitude is the relative phase phi, and the latitude relates to the amplitude ratio theta. Drag the sphere in the Bloch Sphere tab to rotate it interactively.`
        },
        {
            patterns: ['statevector', 'state vector', 'quantum state', 'state vector'],
            answer: `For N qubits, the statevector has 2 to the power N complex amplitudes. Each amplitude squared gives the probability of measuring that basis state. The phase of each amplitude affects interference. View the full statevector in the Statevector tab with complex amplitudes and phases.`
        },
        {
            patterns: ['probability', 'born rule', 'measurement probability', 'born'],
            answer: `The Born Rule says the probability of measuring a basis state equals the squared magnitude of its amplitude. Total probability always sums to one. See the Probabilities tab for animated bar charts of all basis state probabilities.`
        },
        {
            patterns: ['entanglement', 'what is entanglement', 'quantum correlation', 'entangled'],
            answer: `Quantum Entanglement means two or more qubits cannot be described independently. Measuring one qubit instantly determines the other, regardless of distance. On the Bloch sphere, entangled qubits appear as mixed states with purity less than one, because they share information with each other.`
        },
        {
            patterns: ['hilbert space', 'dimension', 'quantum dimension'],
            answer: `For N qubits, the Hilbert space has dimension 2 to the power N. One qubit is 2-dimensional, two qubits are 4-dimensional, three qubits are 8-dimensional, and six qubits are 64-dimensional. This exponential scaling is the source of quantum computational power. Qflux simulates up to 6 qubits.`
        },
        {
            patterns: ['monte carlo', 'shot sampling', 'shots', 'sample shots', 'sampling'],
            answer: `Monte Carlo Shot Sampling simulates real quantum hardware. It computes Born-rule probabilities from the statevector, then randomly samples N measurement outcomes. With enough shots, the histogram converges to the true probabilities. Click the Sample 1024 Shots button in the Probabilities tab.`
        },
        {
            patterns: ['qasm', 'openqasm', 'quantum assembly', 'code export', 'export code', 'export circuit'],
            answer: `OpenQASM 2.0 is the Quantum Assembly Language standard for expressing quantum circuits. Qflux automatically generates QASM from your visual circuit. You can find it in the Code Export tab and copy it for use on real quantum hardware.`
        },
        {
            patterns: ['qiskit', 'python', 'ibm quantum', 'qiskit code'],
            answer: `Qiskit is IBM's open-source quantum SDK for Python. Qflux generates runnable Qiskit code from your visual circuit. Copy it from the Code Export tab and run it directly on IBM Quantum computers via the IBM Quantum Platform.`
        },
        {
            patterns: ['undo', 'redo', 'ctrl z', 'history', 'undo redo', 'keyboard shortcuts', 'shortcuts', 'hotkeys', 'key bindings', 'keyboard shortcut', 'keyboard', 'shortcut', 'qflux shortcuts'],
            answer: `Undo and Redo work with Ctrl-Z to undo and Ctrl-Y or Ctrl-Shift-Z to redo. Up to 40 undo steps are stored. You can also use the Undo and Redo buttons in the History palette group.`
        },
        {
            patterns: ['add qubit', 'more qubits', 'remove qubit', 'qubit wire'],
            answer: `Click the plus-Q button to add a qubit wire, up to 6 qubits maximum. Click minus-Q to remove the last qubit. Adding a qubit doubles the Hilbert space. Simulation stays fast thanks to JavaScript Float64 arrays even at 64 dimensions.`
        },
        {
            patterns: ['share', 'share circuit', 'share link', 'url encode'],
            answer: `Click the Share button to generate a URL encoding your circuit. Anyone with the link can load your exact circuit in Qflux — no account needed. The circuit data is Base64-encoded in the URL hash.`
        },
        {
            patterns: ['save', 'load', 'export json', 'import json', 'file', 'save circuit'],
            answer: `Click Save to download your circuit as a dot qflux dot json file. Click Load to open a saved file. The JSON stores the number of qubits, steps, and all gate placements with parameters.`
        },
        {
            patterns: ['step', 'stepper', 'playback', 'debug', 'step by step', 'debugger'],
            answer: `The Step Debugger lets you step through your circuit one gate column at a time. Use the rewind button to reset, the back arrow to step backward, the play button to auto-play, the forward arrow to step forward, and the fast-forward button to jump to the full circuit. The statevector and Bloch sphere update live at each step.`
        },
        {
            patterns: ['purity', 'mixed state', 'pure state'],
            answer: `Purity ranges from 0 to 1 on the Bloch sphere. A purity of 1 means a pure state on the sphere surface. A purity of 0 means a maximally mixed state at the center. Entangled qubits appear as mixed states when viewed individually, even if the full multi-qubit system is pure.`
        },
        {
            patterns: ['unitary', 'reversible', 'quantum gate property', 'unitary matrix'],
            answer: `All quantum gates except measurement are unitary, meaning U-dagger times U equals the identity matrix. This means they preserve total probability and are reversible. Measurement breaks unitarity because it is irreversible and collapses the quantum state.`
        },
        {
            patterns: ['interference', 'quantum interference', 'constructive', 'destructive'],
            answer: `Quantum interference occurs when complex amplitudes add constructively or destructively. Constructive interference increases probability for correct answers, while destructive interference cancels probability for wrong answers. This is why quantum algorithms can find solutions faster than classical computers.`
        },
        {
            patterns: ['phase', 'relative phase', 'global phase', 'quantum phase'],
            answer: `Each quantum amplitude has a phase angle. Global phase, the same across all amplitudes, is physically unobservable. Relative phase, different between amplitudes, creates interference and is physically important. The phase column in the Statevector tab shows values in degrees. On the Bloch sphere, the azimuthal angle phi represents relative phase.`
        },
        {
            patterns: ['graphs', 'quantum graphs', 'polar chart', 'radar chart', 'heatmap', 'quantum heatmap', 'visualizations'],
            answer: `The Graphs tab shows four interactive quantum visualizations: the Phase Polar Plot shows each amplitude as a vector in the complex plane with angle equal to phase and length equal to magnitude. The Probability Radar shows all basis state probabilities on a radar polygon. The Bar Chart shows animated probability bars. The Density Matrix Heatmap shows the correlation matrix for all pairs of basis states.`
        },
        {
            patterns: ['voice', 'voice assistant', 'speak', 'microphone', 'listen', 'talk'],
            answer: `I support voice interaction! Click the microphone button next to the input box to speak your question, and I will listen and respond. Click the speaker icon on any of my messages to have me read them aloud. You can also toggle voice output on or off using the speaker button in the header.`
        },
        {
            patterns: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'namaste', 'helo', 'hi there', 'howdy', 'thank you', 'thanks'],
            answer: `Hello! I'm Vyshu AI, your quantum computing voice assistant for Qflux! I can explain quantum gates, algorithms, and concepts, help you use the simulator, and answer questions about your circuit. You can type or use the microphone button to talk to me. What would you like to explore?`
        },
        {
            patterns: ['help', 'what can you do', 'capabilities', 'features', 'topics', 'topic list', 'what topics', 'what do you know'],
            answer: `I'm Vyshu AI and I can help with: all quantum gates including H, X, Y, Z, S, T, C-X, C-Z, Rx, Ry, Rz, and Measurement. Algorithms including Bell State, GHZ, Grover's, Deutsch's, and Teleportation. Concepts including superposition, entanglement, Bloch sphere, statevectors, and the Born rule. And Qflux features including the circuit editor, step debugger, quantum graphs, and code export. Just ask or use the voice button to speak!`
        },
        {
            patterns: ['who are you', 'your name', 'what are you', 'vyshu', 'about you', 'tell me about yourself', 'introduce yourself', 'about vyshu'],
            answer: `I'm Vyshu AI, your intelligent quantum computing assistant built into Qflux! I combine a deep quantum knowledge base with circuit analysis and voice interaction. I support both text and voice — click the microphone to speak, and I'll respond in both text and audio. I'm always available in the bottom-right corner.`
        },
        {
            patterns: ["getting started", "how to start", "beginners guide", "first circuit", "tutorial", "new to qflux", "im new", "beginner", "start using qflux", "learn qflux"],
            answer: `Getting Started with Qflux:

Step 1 - Your first gate: Click H in the palette, click the q[0] slot in column 1. Probabilities show 50%/50% - you created superposition!

Step 2 - Entangle qubits: Select CX, click q[0] in column 2 as control, then q[1] in column 2 as target. You have created a Bell state - the most famous quantum state!

Step 3 - Explore visualizations: Click Bloch Sphere, Graphs, and Statevector tabs to see different views of your quantum state.

Step 4 - Step Debugger: Press rewind (double left arrow) then step forward (single right arrow) repeatedly to walk through gates one at a time.

Step 5 - Load a Preset: Use the Presets dropdown to load Grover Search, GHZ, Teleportation, and more.

Ask me about any gate, concept, or feature as you go!` },

        {
            patterns: ["identity gate", "i gate", "do nothing gate", "identity quantum"],
            answer: `Identity Gate (I): Leaves the qubit completely unchanged. In Qflux, empty slots automatically act as identity - no need to place anything. Used in circuit diagrams as a timing placeholder to align gates across different qubit wires.`
        },

        {
            patterns: ["swap gate", "swap qubits", "how to swap qubits", "swap circuit"],
            answer: `SWAP Gate: Exchanges the full quantum states of two qubits.

Decomposition into 3 CNOTs:
1. CNOT from qubit a to qubit b
2. CNOT from qubit b to qubit a
3. CNOT from qubit a to qubit b

Build this in Qflux using three CX gates across two qubit wires in three consecutive columns!` },

        {
            patterns: ["toffoli gate", "ccx gate", "ccnot gate", "controlled controlled not", "toffoli"],
            answer: `Toffoli (CCX) Gate - Quantum AND Gate: Flips the target qubit only when BOTH control qubits are in state 1. Only the states 110 and 111 are affected. All other states remain unchanged.

Together with NOT, this makes quantum circuits classically universal. Any classical computation can be reversed using Toffoli gates.

Ask me "toffoli decomposition" to see how to build it from H, T, and CNOT gates!` },

        {
            patterns: ["toffoli decomposition", "how to build toffoli", "ccx from basic gates"],
            answer: `Toffoli Gate Decomposition (Nielsen and Chuang):

For qubits q0, q1, and the target:
1. H on target
2. CNOT from q1 to target
3. T-dagger on target
4. CNOT from q0 to target
5. T on target
6. CNOT from q1 to target
7. T-dagger on target
8. CNOT from q0 to target
9. T on q1, T on target
10. H on target
11. CNOT from q0 to q1
12. T on q0, T-dagger on q1
13. CNOT from q0 to q1

Total: 6 CNOT gates, 3 T gates, and 3 T-dagger gates.` },

        {
            patterns: ["quantum fourier transform", "qft", "fourier transform quantum", "qft circuit"],
            answer: `Quantum Fourier Transform (QFT): The quantum analog of the Discrete Fourier Transform. Uses O(n squared) gates versus O(n times 2 to the n) classically. Core of Shor algorithm, Phase Estimation, and HHL algorithm.

2-Qubit QFT circuit in Qflux:
1. H on q[0]
2. Controlled-S: q[1] control, q[0] target
3. H on q[1]
4. SWAP q[0] and q[1] (three CX gates)

The QFT transforms amplitudes from the computational basis to the frequency domain, enabling period-finding which powers Shor algorithm!` },

        {
            patterns: ["shor's algorithm", "shor algorithm", "factoring quantum", "integer factoring", "rsa quantum threat"],
            answer: `Shor Algorithm: Factors integers exponentially faster than classical algorithms, threatening RSA encryption.

Classical factoring: exponential time.
Shor algorithm: polynomial time O(n cubed).

Core component: The Quantum Fourier Transform finds the period of a modular exponentiation function. Full Shor requires hundreds of qubits, beyond Qflux's 6-qubit limit. You can study the QFT subroutine in Qflux as the quantum core!` },

        {
            patterns: ["vqe", "variational quantum eigensolver", "variational circuit", "hybrid quantum classical"],
            answer: `VQE - Variational Quantum Eigensolver: Hybrid quantum-classical algorithm for finding molecular ground state energies. Used in drug discovery and quantum chemistry.

How it works:
1. Choose a parametrized circuit called an ansatz with Ry and Rz gates
2. Run on quantum hardware to measure the Hamiltonian expectation value
3. Classical optimizer updates the angle parameters theta
4. Repeat until energy is minimized

Use in Qflux: Build ansatz circuits using Rx, Ry, Rz gates. Study how different angles affect the statevector and Bloch sphere readouts!` },

        {
            patterns: ["qaoa", "quantum approximate optimization", "max cut problem", "combinatorial optimization quantum"],
            answer: `QAOA - Quantum Approximate Optimization Algorithm: NISQ algorithm for combinatorial problems including MaxCut, traveling salesman, and portfolio optimization.

Structure uses alternating layers:
- Problem Hamiltonian layer: CZ gates for ZZ interactions
- Mixer Hamiltonian layer: Rx(2 beta) gates

In Qflux: Build a depth-1 QAOA circuit using CZ problem gates and Rx mixer gates. The Graphs tab shows how different angle values shift probability distributions over candidate solutions!` },

        {
            patterns: ["bernstein vazirani", "bernstein-vazirani algorithm", "hidden string quantum", "hidden binary string"],
            answer: `Bernstein-Vazirani Algorithm: Finds a hidden binary string s in ONE quantum query versus n classical queries for an n-bit string.

Circuit:
1. Initialize ancilla to minus state: X then H on ancilla qubit
2. H on all input qubits
3. Apply oracle Uf with CNOTs for each bit position where s has value 1
4. H on all input qubits
5. Measure: result is exactly the hidden string s!

A beautiful demonstration of quantum parallelism. All n bits are discovered simultaneously in a single quantum query!` },

        {
            patterns: ["bb84 protocol", "quantum cryptography bb84", "quantum key distribution", "qkd protocol", "quantum secure communication", "bb84", "qkd", "quantum cryptography", "bb 84"],
            answer: `BB84 - Quantum Key Distribution Protocol (Bennett and Brassard 1984): Creates a secret shared encryption key with information-theoretic security.

Protocol:
1. Alice sends qubits in random bases: Z-basis (states 0 and 1) or X-basis (states plus and minus)
2. Bob measures in randomly chosen bases
3. They publicly compare which bases they used, not the measurement results
4. Keep bits where bases matched - this becomes the secret key
5. Any eavesdropper disturbs qubits due to no-cloning theorem and is detectable

In Qflux: Prepare the 4 BB84 states. State 0: no gate. State 1: X gate. State plus: H gate. State minus: X then H gate.` },

        {
            patterns: ["hadamard transform", "walsh hadamard transform", "h on all qubits", "equal superposition circuit", "apply h to all"],
            answer: `Hadamard Transform (H tensor n): Apply H to ALL n qubits simultaneously to create equal superposition of all 2 to the n basis states.

In Qflux:
- Place H on every qubit in column 1
- 2 qubits: 25% each for all 4 states
- 3 qubits: 12.5% each for all 8 states
- 4 qubits: 6.25% each for all 16 states

Shortcut: Presets dropdown, Equal Superposition.

This is the starting step for Grover algorithm, Deutsch-Jozsa, and Bernstein-Vazirani algorithms!` },

        {
            patterns: ["quantum error correction", "error correction quantum", "bit flip code", "repetition code quantum"],
            answer: `Quantum Error Correction: Real quantum hardware has noise. Qubits lose their quantum state through decoherence and gates have calibration errors.

3-Qubit Bit-Flip Code:
- Encode state (alpha times 0 plus beta times 1) as (alpha times 000 plus beta times 111)
- Circuit: CNOT(q0 to q1), CNOT(q0 to q2)
- If any one qubit flips: majority vote detects and corrects it
- Correction uses CNOT syndrome measurement and Toffoli gate

Qflux simulates ideal noiseless circuits. Perfect for studying error correction encoding logic without hardware noise interference!` },

        {
            patterns: ["phase kickback", "kickback", "phase kick back", "phase kickback quantum", "phase kickback trick", "kickback mechanism quantum"],
            answer: `Phase Kickback: When a controlled gate is applied with the target qubit in an eigenstate of the gate operator, the eigenvalue phase kicks back to the control qubit.

Example with CNOT:
- Control qubit is in the plus state (equal superposition)
- Target qubit is in the minus state
- Applying CNOT: the minus-1 eigenvalue of X acting on minus state kicks back and transforms control from plus to minus state

Phase kickback powers: Deutsch algorithm, Bernstein-Vazirani, Simon algorithm, and Phase Estimation. Information is cleverly encoded in quantum phases rather than amplitudes!` },

        {
            patterns: ["no cloning theorem", "cannot copy qubit", "cloning is forbidden", "quantum no cloning", "copy quantum state impossible"],
            answer: `No-Cloning Theorem: It is fundamentally impossible to create an exact copy of an unknown quantum state.

Proof sketch: Assume a cloning unitary U exists such that U acting on psi tensor 0 gives psi tensor psi. Applying this to a superposition state leads to a contradiction with the linearity of quantum mechanics.

Implications:
- Quantum information cannot be perfectly copied
- Makes BB84 quantum cryptography secure: eavesdroppers disturb qubits and are detected
- Forces quantum teleportation to destroy the original state when recreating it elsewhere
- Prevents quantum software piracy` },

        {
            patterns: ["density matrix", "density operator", "rho matrix quantum", "density matrix explanation"],
            answer: `Density Matrix (rho): Represents quantum states including mixed states with classical uncertainty.

For pure states: rho equals ket-psi times bra-psi.
For mixed states: rho equals the sum of p_i times ket-psi_i times bra-psi_i.

Key properties:
- Trace of rho always equals 1
- Purity equals trace of rho-squared: 1 for pure states, less than 1 for mixed states
- Diagonal entries are measurement probabilities (populations)
- Off-diagonal entries are quantum coherences (superposition interference terms)

In Qflux Density Matrix Heatmap:
- Bright diagonal means high probability for that basis state
- Bright off-diagonal means quantum coherence is present
- Bell state shows 4 equal bright corners representing maximal entanglement!` },

        {
            patterns: ["expectation value quantum", "expected value bloch sphere", "pauli expectation value", "mean quantum measurement", "expectation value", "expected value", "bloch vector components", "expectation values", "pauli expectation"],
            answer: `Expectation Values: The expectation value of observable O equals bra-psi O ket-psi, giving the average measurement outcome.

Bloch sphere components for state alpha-0 plus beta-1:
- Expectation X = 2 times real part of (alpha-conjugate times beta)
- Expectation Y = 2 times imaginary part of (alpha-conjugate times beta)
- Expectation Z = probability-0 minus probability-1

Common states:
- State 0: Z=+1 (North pole)
- State 1: Z=-1 (South pole)
- Plus state (H on 0): X=+1 (equator, positive X)
- Minus state (HX on 0): X=-1 (equator, negative X)

See these live in the Bloch sphere tab angle-bracket X, Y, Z display pills!` },

        {
            patterns: ["circuit depth", "gate depth", "depth", "circuit depth meaning", "what is circuit depth", "gate depth quantum", "how to minimize depth in qflux"],
            answer: `Circuit Depth: Equals the number of time-step columns that contain at least one gate. Shown live in Qflux stats bar at the bottom.

Why depth matters on real hardware:
- Qubits lose coherence over time (decoherence)
- Deeper circuits require more execution time and accumulate more errors
- NISQ computers work best with shallow circuits (depth below 100)

How to minimize depth in Qflux:
- Place gates for different qubits in the same column
- Gates in the same column execute simultaneously and count as only depth 1
- Only gates on the same qubit wire must be in separate consecutive columns` },

        {
            patterns: ["what is decoherence", "qubit decoherence", "decoherence quantum", "qubit loses state noise", "decoherence", "quantum decoherence", "qubit noise", "qubit errors", "why quantum is hard"],
            answer: `Quantum Decoherence: Qubits lose their quantum properties by interacting with their environment.

Types of errors:
- T1 amplitude damping: excited state 1 spontaneously decays to ground state 0
- T2 dephasing: relative phase randomizes over time
- Gate errors: imprecise control pulses and crosstalk

Typical coherence times:
- Superconducting qubits (IBM, Google): roughly 100 microseconds
- Ion trap qubits (IonQ): up to several minutes
- Photonic qubits: roughly nanoseconds

Solutions: Quantum error correction, better hardware, shorter shallower circuits.

Qflux simulates ideal noiseless circuits. Export to Qiskit and add a noise model for realistic noisy simulation!` },

        {
            patterns: ["quantum computing applications", "quantum computing used for", "real world quantum", "quantum use cases", "quantum applications", "applications of quantum computing"],
            answer: `Real-World Quantum Computing Applications:

Drug Discovery and Chemistry: VQE for molecular simulation, used by pharmaceutical researchers.

Cryptography: Shor algorithm threatens RSA encryption. BB84 creates quantum-secure communication keys.

Optimization: QAOA for logistics, financial portfolio optimization, and supply chain problems.

Machine Learning: Quantum kernel methods and quantum neural networks for classification tasks.

Materials Science: Simulating quantum materials for better batteries, superconductors, and catalysts.

Finance: Portfolio optimization, derivatives pricing, and risk analysis used by major banks.

Current hardware providers: IBM Quantum, Google Quantum AI, IonQ, Rigetti, Quantinuum, PsiQuantum.

Learning Qflux builds the foundation for understanding all of these real-world applications!` },

        {
            patterns: ["how qflux simulation works", "qflux engine internals", "qflux technical details", "how qflux simulates"],
            answer: `How Qflux Simulates Quantum Circuits:

1. State representation: A complex-number array of size 2 to the N using 64-bit floating point precision
2. Single-qubit gate: Matrix multiplication using bitmask operations on the qubit index bit
3. Two-qubit gates (CX, CZ): Iterate over all 2-to-the-N amplitudes, swap or negate pairs based on control and target qubit bit values
4. Bloch vector: Computes single-qubit reduced density matrices by tracing out all other qubits mathematically
5. Rendering: All visualizations update after every gate change using requestAnimationFrame for smooth 60fps updates

This is the same statevector simulation method used by Qiskit StatevectorSimulator!` },

        {
            patterns: ["how many qubits needed", "qubit requirements", "minimum qubits algorithm", "qubit count algorithm"],
            answer: `How Many Qubits Different Algorithms Need:

Bell State: 2 qubits.
GHZ State: 3 qubits.
Deutsch Algorithm: 2 qubits.
Quantum Teleportation: 3 qubits.
Grover Search (2-qubit): 2 qubits.
Quantum Fourier Transform: 2 or more qubits.
Shor algorithm to factor 15: roughly 12 qubits.
Shor algorithm to break RSA-2048: roughly 4,000 or more qubits.
Useful quantum advantage beyond classical: roughly 50 to 1,000 or more qubits.

Qflux supports up to 6 qubits, which covers all fundamental quantum algorithm examples!` },

        {
            patterns: ["reset circuit", "clear all gates", "start over fresh", "blank circuit fresh", "clear qflux circuit"],
            answer: `Resetting or Clearing Your Circuit in Qflux:

- Reset button: Clears all gates while keeping the same qubit and step count
- Presets dropdown then Blank Circuit: Starts completely fresh with default settings
- Ctrl+Z repeatedly: Undoes individual gate placements one by one
- Load Preset: Replaces entire circuit with a famous example

Auto-save records every change, so refreshing the page restores your last state. Use the Save button to download a backup before resetting if you want to keep your current work!` },

        {
            patterns: ["all presets list", "what presets available", "preset circuits list", "qflux presets all", "presets", "preset list", "what presets"],
            answer: `All Available Qflux Circuit Presets:

Bell State Phi-plus: Simplest 2-qubit entangled state built with H gate plus CNOT.
GHZ 3-Qubit: Three-way maximally entangled state using H gate and two CNOTs.
Equal Superposition: Hadamard gates on all qubits creating equal probability for all basis states.
Quantum Teleportation: Complete 3-qubit teleportation protocol.
Grover Search 2-Qubit: Full Grover search algorithm marking the 11 state as target.
Deutsch Algorithm: Oracle-based 2-qubit algorithm demonstrating quantum speedup over classical.
Blank Circuit: Empty circuit with 2 qubits and 4 time steps.

Load any preset from the Presets dropdown in the header toolbar. After loading, use the Step Debugger to walk through each gate!` },

        {
            patterns: ["probabilities tab guide", "how to use probabilities tab", "probability bar chart tab"],
            answer: `Probabilities Tab Guide:

The Probabilities tab shows live Born-rule probabilities as an animated bar chart that updates instantly with every gate change.

Each bar represents one basis state. Bar height shows the probability of measuring that state. Hover over any bar to see: exact probability percentage, amplitude magnitude, and basis state label.

Sample 1024 Shots button: Simulates 1024 actual quantum measurements by randomly sampling from the statevector probability distribution. Shows a histogram of results, exactly matching what real IBM Quantum hardware would output.

For a Bell state you will see roughly equal bars for states 00 and 11 with all other states at zero probability!` },

        {
            patterns: ["statevector tab guide", "how to read statevector tab", "complex amplitudes table guide"],
            answer: `Statevector Tab Guide:

The Statevector tab shows the complete quantum state as a table with these columns:
- State: basis state in ket notation like ket-00 or ket-11
- Real: real part of the complex amplitude
- Imaginary: imaginary part of the complex amplitude
- Magnitude: absolute value of the amplitude (square root of probability)
- Probability: Born-rule probability as a percentage
- Phase: angle of the complex amplitude in degrees from 0 to 360

The top of the tab shows the full quantum state written in Dirac ket notation.

For a Bell state: ket-00 and ket-11 each have magnitude 0.707, probability 50%, and phase 0 degrees. All other states show zero amplitude.` },

        {
            patterns: ["bloch sphere guide", "bloch sphere tab guide", "how to read bloch sphere values", "theta phi bloch sphere meaning"],
            answer: `Bloch Sphere Tab Complete Guide:

Controls:
- Drag the sphere with your mouse to rotate it in 3D
- Click q[0], q[1], q[2] etc buttons to inspect different qubit wires
- Click any mini-sphere card to switch to that qubit

Displayed values:
- Angle-bracket X: coherence in X basis (real part of off-diagonal density matrix)
- Angle-bracket Y: coherence in Y basis (imaginary part of off-diagonal density matrix)
- Angle-bracket Z: population difference P0 minus P1. Plus 1 for state-0, minus 1 for state-1
- Purity: 100 percent means pure state on sphere surface. Less than 100 percent means mixed or entangled qubit inside the sphere
- Theta polar angle: 0 degrees is state-0 at North pole, 180 degrees is state-1 at South pole, 90 degrees is superposition on equator
- Phi azimuth: relative phase angle, rotating around the vertical Z-axis
- Radius: length of Bloch vector, 1.0 for pure states, less than 1 for mixed states` },

        {
            patterns: ["code export tab guide", "how to export qasm", "export qiskit code", "run on ibm quantum how"],
            answer: `Code Export Tab Guide:

The Code Export tab automatically generates two types of code from your visual circuit.

OpenQASM 2.0 section:
- Industry-standard quantum assembly language used by IBM, AWS Braket, and Azure Quantum
- Click Copy to copy the QASM code
- Paste into IBM Quantum Composer, Quirk, or any QASM-compatible tool

Python Qiskit section:
- Ready-to-run Python code requiring only pip install qiskit
- Copy the code and paste into a Python file or Jupyter notebook
- Run on local AerSimulator for fast simulation
- Submit to real IBM Quantum hardware via IBM Quantum Platform at quantum.ibm.com

Both sections have a Copy button for one-click export!` },

        {
            patterns: ["qubit vs bit", "qubit vs classical", "difference qubit", "what makes qubit special", "qubit versus bit", "quantum bit vs classical", "difference between qubit bit"],
            answer: `Qubit vs Classical Bit: A classical bit can only be 0 or 1. A qubit (quantum bit) can exist in a superposition of both 0 and 1 simultaneously, represented as alpha|0⟩ + beta|1⟩. Additionally, multiple qubits can be entangled, allowing N qubits to represent 2^N states simultaneously.`
        },

        {
            patterns: ["nisq", "nisq era", "noisy intermediate scale quantum", "current quantum hardware era", "near term quantum", "noisy intermediate scale", "nisq computers", "near term quantum computer"],
            answer: `NISQ (Noisy Intermediate-Scale Quantum): Refers to the current era of quantum hardware, characterized by 50 to a few hundred qubits that are noisy (not fault-tolerant) and lack full quantum error correction. NISQ algorithms like VQE and QAOA are designed to extract utility despite these hardware limitations.`
        },

        {
            patterns: ["quantum computing basics", "what is quantum computing", "how quantum computing works", "basics quantum", "explain quantum computing", "how quantum works", "quantum computer basics", "what is qc"],
            answer: `Quantum Computing Basics: Quantum computing uses principles of quantum mechanics—superposition, entanglement, and interference—to process information. While classical computers compute sequentially with 0s and 1s, quantum computers manipulate complex amplitude statevectors using unitary gates to solve certain problems exponentially faster.`
        },

        {
            patterns: ["why applying h twice returns", "h squared identity", "double hadamard", "h h result"],
            answer: `Why Applying H Twice Returns to the Original State:

The Hadamard gate is self-inverse: H times H equals the Identity matrix.

Proof: H squared equals (1 over root 2) times [[1,1],[1,-1]] times (1 over root 2) times [[1,1],[1,-1]]
This equals (1 over 2) times [[2,0],[0,2]] which equals [[1,0],[0,1]] which is the Identity!

Many quantum gates are self-inverse: H, X, Y, Z, CNOT, CZ, SWAP.

Try it in Qflux: Place H twice on the same qubit in consecutive columns. Watch the Bloch sphere jump to the equator after the first H, then return to the North pole after the second H!` },

        {
            patterns: ["why bloch sphere at equator", "what does equator mean bloch", "equator states bloch sphere"],
            answer: `Bloch Sphere Equator States Explained:

The equator represents equal superposition states where measuring 0 or 1 is exactly 50% probable.

Different equator points have different relative phases:
- Positive X direction: plus state = H acting on state-0
- Negative X direction: minus state = H acting on state-1 (or HX on state-0)
- Positive Y direction: i-plus state = S then H on state-0
- Negative Y direction: i-minus state = S-dagger then H on state-0

All equator states have identical 50/50 probabilities but different relative phases. The phase determines how they interfere in subsequent circuit operations.

In Qflux: Apply H to q[0] and the Bloch sphere vector jumps to the positive X equator position!` },

        {
            patterns: ["what happens when i measure qubit", "after measurement quantum", "post measurement state", "wavefunction collapse"],
            answer: `What Happens When You Measure a Qubit:

Before measurement: qubit is in superposition alpha times state-0 plus beta times state-1.

After measurement:
- With probability alpha-squared: qubit collapses to pure state-0, all quantum coherence is destroyed
- With probability beta-squared: qubit collapses to pure state-1, all quantum coherence is destroyed

Measurement is irreversible. You cannot reconstruct the original superposition state from the classical result alone.

In Qflux: Place an M gate in your circuit. The Statevector tab updates to show the post-measurement state. Use Sample 1024 Shots to see the statistical distribution over many repeated measurements!` },

        {
            patterns: ["help me build circuit", "how to build specific circuit", "create quantum circuit help", "design circuit for me"],
            answer: `I would love to help you build a quantum circuit! Tell me what you want to create and I will give you step-by-step instructions.

You can ask me:
- How to build a Bell state
- How to create GHZ entanglement for 3 qubits
- How to build Grover search for a specific target state
- How to set up quantum teleportation
- How to make equal superposition of all qubits
Just describe the quantum state or algorithm you want and I will walk you through every gate placement step by step!` },

        {
            patterns: ["circuit not updating", "cnot not working", "bloch sphere not showing", "error in qflux", "qflux bug", "troubleshooting", "simulator not updating", "circuit stuck"],
            answer: `Troubleshooting Qflux Circuit Issues:
1. Two-qubit gates (CX, CZ, SWAP): Select the gate, click the first qubit (control/target), then click the second qubit in the same step column.
2. Rotation gates (Rx, Ry, Rz): Click the gate button, then click a slot to open the angle picker modal, enter your theta angle, and click Apply.
3. Canvas / Bloch sphere: Ensure your browser supports HTML5 Canvas. Switching tabs re-renders active visualizations.
4. Hard Reset: Use the Clear button to clear the grid, or reload the page (autosave will restore your state).` },

        {
            patterns: ["rotation angle", "angle modal", "custom angle", "set angle", "gate theta", "configure angle"],
            answer: `Configuring Rotation Gate Angles in Qflux:
When you select Rx, Ry, or Rz from the gate palette and click a circuit slot, a rotation angle modal opens. Select a standard preset angle (π/4, π/2, π, 3π/2, 2π) or enter a custom angle θ in radians (e.g., 1.5708 for π/2). Click Apply to place the gate.` }

    ];

    const STOP_WORDS = new Set([
        'what', 'is', 'are', 'how', 'why', 'where', 'can', 'you', 'tell', 'me', 'about', 'explain', 'give',
        'my', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'do', 'does', 'did', 'would', 'could',
        'should', 'please', 'this', 'that', 'it', 'a', 'an', 'the', 'i', 'am', 'us', 'we', 'show', 'work', 'works', 'need', 'want'
    ]);

    function cleanWords(str) {
        return str.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(w => w.length > 0 && !STOP_WORDS.has(w));
    }

    function match(query, kb) {
        const qNorm = query.toLowerCase().trim();
        const qWords = cleanWords(qNorm);
        let best = null, bestScore = 0;

        for (const entry of kb) {
            for (const rawPattern of entry.patterns) {
                const pNorm = rawPattern.toLowerCase().trim();
                let score = 0;

                // 1. Exact match
                if (qNorm === pNorm) {
                    score = 2000 + pNorm.length;
                }
                // 2. Short single-word pattern (<= 3 chars: x, h, z, y, s, t, m, i, rx, ry, rz, qft, vqe, qaoa, qkd, ccx)
                else if (pNorm.length <= 3) {
                    const regex = new RegExp('(?:^|\\s|[^a-z0-9])' + pNorm.replace(/[-[\]{}()*+?TargetFile$^|#\s]/g, '\\$&') + '(?:$|\\s|[^a-z0-9])', 'i');
                    if (regex.test(qNorm)) {
                        score = 600 + pNorm.length * 10;
                    }
                }
                // 3. Multi-word / multi-char pattern
                else {
                    const pRegex = new RegExp('(?:^|\\s|[^a-z0-9])' + pNorm.replace(/[-[\]{}()*+?TargetFile$^|#\s]/g, '\\$&') + '(?:$|\\s|[^a-z0-9])', 'i');
                    if (pRegex.test(qNorm) || qNorm.includes(pNorm)) {
                        score = 800 + pNorm.length * 10;
                    } else {
                        // Non-stop word overlap matching
                        const pWords = cleanWords(pNorm);
                        if (pWords.length > 0) {
                            let matched = 0;
                            for (const pw of pWords) {
                                if (qWords.some(qw => qw === pw || (pw.length > 4 && qw.includes(pw)))) {
                                    matched++;
                                }
                            }
                            const ratio = matched / pWords.length;
                            if (ratio === 1.0) {
                                score = 400 + pWords.length * 20;
                            } else if (ratio >= 0.6) {
                                score = ratio * 150 + matched * 10;
                            }
                        }
                    }
                }

                if (score > bestScore) {
                    bestScore = score;
                    best = entry;
                }
            }
        }

        return bestScore >= 30 ? best : null;
    }

    // ── Response Generator ─────────────────────────────────────────
    function generateResponse(query, circuitContext) {
        const q = query.toLowerCase().trim();

        // --- Step-by-step Interactive Circuit Teaching ---
        if (q.includes('teach') || q.includes('step by step') || q.includes('how to build') || q.includes('guide me')) {
            if (q.includes('bell') || q.includes('entanglement 2')) {
                return `🎓 **Step-by-Step Lesson: Bell State (|Φ⁺⟩)**

**Overview:** Bell State is the fundamental 2-qubit maximally entangled state: **(|00⟩ + |11⟩) / √2**.

**Step-by-Step Instructions:**
1. **Step 1 — Create Superposition:** Select the **Hadamard (H)** gate from the palette. Click slot \`q[0]\` at Step 1.
   *Result:* \`q[0]\` is in equal superposition: **(|0⟩ + |1⟩) / √2**.

2. **Step 2 — Entangle Qubits:** Select the **CNOT (CX)** gate from the palette. Click \`q[0]\` as control at Step 2, then click \`q[1]\` as target.
   *Result:* Correlates \`q[0]\` and \`q[1]\` into **|Φ⁺⟩ = (|00⟩ + |11⟩) / √2**.

3. **Step 3 — Inspect State:** Click the **Probabilities** tab to see equal 50% bars for |00⟩ and |11⟩. Click **Bloch Sphere** tab to observe purity reduction due to entanglement!

*Tip: You can load this preset anytime from the Presets dropdown!*`;
            }
            if (q.includes('grover')) {
                return `🎓 **Step-by-Step Lesson: Grover's Search Algorithm (2-Qubit Target |11⟩)**

**Overview:** Grover's algorithm finds marked target state |11⟩ with 100% probability in 1 iteration (quadratic speedup).

**Step-by-Step Instructions:**
1. **Step 1 — Equal Superposition:** Place **H** gates on \`q[0]\` and \`q[1]\` at Step 1.
   *Result:* Equal 25% probability across |00⟩, |01⟩, |10⟩, |11⟩.

2. **Step 2 — Phase Oracle:** Select **CZ** gate. Click \`q[0]\` then \`q[1]\` at Step 2.
   *Result:* Inverts the phase of |11⟩ to negative.

3. **Step 3 — Diffusion Operator (Inversion about Mean):**
   - Place **H** on \`q[0]\` and \`q[1]\` at Step 3.
   - Place **X** on \`q[0]\` and \`q[1]\` at Step 4.
   - Place **CZ** from \`q[0]\` to \`q[1]\` at Step 5.
   - Place **X** on \`q[0]\` and \`q[1]\` at Step 6.
   - Place **H** on \`q[0]\` and \`q[1]\` at Step 7.

*Result:* Constructive interference boosts |11⟩ probability to 100%! Use the Step Debugger to watch amplitudes shift step by step!`;
            }
            if (q.includes('teleport') || q.includes('teleportation')) {
                return `🎓 **Step-by-Step Lesson: Quantum Teleportation Protocol**

**Overview:** Teleports unknown state α|0⟩ + β|1⟩ on \`q[0]\` to \`q[2]\` using a shared Bell pair and classical feedforward.

**Step-by-Step Instructions:**
1. **Step 1 — Prepare Input State:** Place **X** or **Rx** on \`q[0]\` at Step 1 to set the state to teleport.
2. **Step 2 — Create Shared Bell Pair:** Place **H** on \`q[1]\` at Step 2, then **CX** from \`q[1]\` to \`q[2]\` at Step 3.
3. **Step 3 — Alice's Entangling Operations:** Place **CX** from \`q[0]\` to \`q[1]\` at Step 4, then **H** on \`q[0]\` at Step 5.
4. **Step 4 — Bob's Feedforward Corrections:** Place **CZ** from \`q[0]\` to \`q[2]\` at Step 6, then **CX** from \`q[1]\` to \`q[2]\` at Step 7.

*Result:* \`q[2]\` now contains the exact state of \`q[0]\`!`;
            }
            if (q.includes('ghz')) {
                return `🎓 **Step-by-Step Lesson: GHZ 3-Qubit Entanglement**

**Overview:** Creates 3-qubit maximally entangled state: **(|000⟩ + |111⟩) / √2**.

**Step-by-Step Instructions:**
1. **Step 1:** Place **H** gate on \`q[0]\` at Step 1.
2. **Step 2:** Place **CX** gate from \`q[0]\` to \`q[1]\` at Step 2.
3. **Step 3:** Place **CX** gate from \`q[1]\` to \`q[2]\` at Step 3.

*Result:* Measuring any one qubit instantly collapses all 3 qubits synchronously to either 000 or 111!`;
            }
            if (q.includes('deutsch')) {
                return `🎓 **Step-by-Step Lesson: Deutsch's Algorithm**

**Overview:** Determines if a single-bit boolean function f(x) is constant or balanced in a single quantum query.

**Step-by-Step Instructions:**
1. **Step 1:** Place **X** on target qubit \`q[1]\` at Step 1.
2. **Step 2:** Place **H** on \`q[0]\` and \`q[1]\` at Step 2.
3. **Step 3 (Oracle):** Place **CX** from \`q[0]\` to \`q[1]\` at Step 3 (balanced function oracle).
4. **Step 4:** Place **H** on input qubit \`q[0]\` at Step 4.

*Result:* Measuring \`q[0]\` as 0 means Constant; measuring \`q[0]\` as 1 means Balanced!`;
            }
        }

        if (circuitContext && (q.includes('my circuit') || q.includes('current circuit') || q.includes('analyze') || q.includes('what did i build'))) {
            const { numQubits, numSteps, gateCount, depth } = circuitContext;
            return `Your current circuit has ${numQubits} qubits, which means a ${1 << numQubits}-dimensional Hilbert space. You've placed ${gateCount} gates across ${depth} active time steps out of ${numSteps} total columns. Check the Probabilities tab for live statevector results, or the Bloch Sphere tab to visualize each qubit!`;
        }
        if ((q.includes('gate count') || q.includes('how many gates')) && circuitContext) {
            return `Your circuit has ${circuitContext.gateCount} gates across ${circuitContext.depth} active columns. Gate count and depth are shown in the stats bar at the bottom of the circuit editor.`;
        }
        const entry = match(q, KB);
        if (entry) return entry.answer;
        const suggestions = [
            'Try asking: teach me Bell state step by step',
            "Try asking: teach me Grover's algorithm step by step",
            'Try asking: teach me quantum teleportation',
            'Try asking: explain the Bloch sphere',
            'Try asking: how do I place a CNOT gate?',
        ];
        return `I'm not sure about that specific topic yet. ${suggestions[Math.floor(Math.random() * suggestions.length)]} Or ask about any quantum gate, algorithm, or Qflux feature. Say "help" to see all my capabilities!`;
    }

    // ── Text → Plain (strip markdown for TTS) ─────────────────────
    function stripMarkdown(text) {
        return text
            .replace(/\*\*(.+?)\*\*/g, '$1')
            .replace(/\*(.+?)\*/g, '$1')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/\n/g, '. ')
            .replace(/•/g, '')
            .replace(/→/g, 'to')
            .replace(/⟩/g, ' ket ')
            .replace(/⟨/g, ' bra ')
            .replace(/[|]/g, '')
            .replace(/[✅🤖🔬💬🧠🌊🎤🔊]/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }

    // ── Format Markdown → HTML ─────────────────────────────────────
    function formatMarkdown(text) {
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code style="background:rgba(99,102,241,0.15);padding:2px 5px;border-radius:3px;font-family:monospace;font-size:0.85em;">$1</code>')
            .replace(/\n/g, '<br>');
    }

    // ── Speech Synthesis (TTS) ─────────────────────────────────────
    let ttsEnabled = true;
    let currentUtterance = null;

    function speak(text, onEnd) {
        if (!ttsEnabled || !window.speechSynthesis) { if (onEnd) onEnd(); return; }
        window.speechSynthesis.cancel();
        const plain = stripMarkdown(text);
        const utterance = new SpeechSynthesisUtterance(plain);
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;

        // Try to pick a good English voice
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.name.includes('Google UK English Female'))
            || voices.find(v => v.name.includes('Samantha'))
            || voices.find(v => v.lang === 'en-US' && v.localService)
            || voices.find(v => v.lang.startsWith('en'));
        if (preferred) utterance.voice = preferred;

        utterance.onend = () => { currentUtterance = null; if (onEnd) onEnd(); };
        utterance.onerror = () => { currentUtterance = null; if (onEnd) onEnd(); };
        currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
    }

    function stopSpeaking() {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        currentUtterance = null;
    }

    // ── Speech Recognition (STT) ───────────────────────────────────
    let recognition = null;
    let isListening = false;

    function createRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return null;
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = 'en-US';
        rec.maxAlternatives = 1;
        return rec;
    }

    // ── UI Builder ─────────────────────────────────────────────────
    function buildUI() {
        const style = document.createElement('style');
        style.textContent = `
      #vyshu-widget {
        position: fixed; bottom: 24px; right: 24px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
      }
      #vyshu-toggle {
        width: 58px; height: 58px; border-radius: 50%;
        background: linear-gradient(135deg, #6366f1, #8b5cf6, #38bdf8);
        border: 2px solid rgba(99,102,241,0.4); color: white; font-size: 1.5rem;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 8px 32px rgba(99,102,241,0.45);
        transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
        animation: vyshuPulse 2.5s ease-in-out infinite;
        position: relative;
      }
      #vyshu-toggle:hover { transform: scale(1.1); box-shadow: 0 12px 40px rgba(99,102,241,0.6); }
      @keyframes vyshuPulse {
        0%,100% { box-shadow: 0 8px 32px rgba(99,102,241,0.45), 0 0 0 0 rgba(99,102,241,0.3); }
        50%      { box-shadow: 0 8px 32px rgba(99,102,241,0.45), 0 0 0 12px rgba(99,102,241,0); }
      }
      #vyshu-label {
        position: absolute; bottom: 66px; right: 0;
        background: linear-gradient(135deg,#6366f1,#38bdf8);
        color: white; font-size: 0.72rem; font-weight: 700;
        padding: 4px 10px; border-radius: 12px; white-space: nowrap;
        pointer-events: none;
        animation: vyshuLabelPop 0.5s ease;
      }
      @keyframes vyshuLabelPop { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
      #vyshu-panel {
        display: none; flex-direction: column;
        width: 370px; height: 520px;
        background: #0d1117;
        border: 1px solid rgba(99,102,241,0.35);
        border-radius: 18px;
        box-shadow: 0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px rgba(99,102,241,0.15),
                    inset 0 1px 0 rgba(255,255,255,0.04);
        overflow: hidden;
        animation: vyshuOpen 0.3s cubic-bezier(0.16,1,0.3,1);
        margin-bottom: 14px;
      }
      #vyshu-panel.open { display: flex; }
      @keyframes vyshuOpen { from{opacity:0;transform:translateY(18px) scale(0.94)} to{opacity:1;transform:none} }

      /* Header */
      #vyshu-header {
        background: linear-gradient(135deg, rgba(99,102,241,0.22), rgba(56,189,248,0.1));
        border-bottom: 1px solid rgba(99,102,241,0.22);
        padding: 13px 16px;
        display: flex; align-items: center; gap: 10px;
        flex-shrink: 0;
      }
      #vyshu-avatar {
        width: 40px; height: 40px; border-radius: 50%;
        background: linear-gradient(135deg,#6366f1,#8b5cf6);
        display: flex; align-items: center; justify-content: center;
        font-size: 1.25rem; flex-shrink: 0;
        box-shadow: 0 0 16px rgba(99,102,241,0.5);
        position: relative;
      }
      /* Speaking animation rings on avatar */
      #vyshu-avatar.speaking::after {
        content: ''; position: absolute; inset: -4px;
        border-radius: 50%; border: 2px solid #38bdf8;
        animation: speakRing 1s ease-in-out infinite;
      }
      @keyframes speakRing { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:1;transform:scale(1.12)} }
      #vyshu-title { flex: 1; min-width: 0; }
      #vyshu-title strong { display: block; font-size: 0.95rem; color: #f8fafc; }
      #vyshu-title span { font-size: 0.7rem; color: #38bdf8; }
      #vyshu-status-bar { display: flex; align-items: center; gap: 6px; }
      #vyshu-online { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 6px #10b981; }
      /* TTS toggle button */
      #vyshu-tts-toggle {
        background: none; border: 1px solid rgba(99,102,241,0.3); color: #64748b;
        font-size: 0.95rem; cursor: pointer; padding: 4px 7px; border-radius: 6px;
        transition: all 0.15s; line-height: 1;
      }
      #vyshu-tts-toggle:hover { color: #f8fafc; border-color: rgba(99,102,241,0.6); }
      #vyshu-tts-toggle.active { color: #38bdf8; border-color: rgba(56,189,248,0.5); background: rgba(56,189,248,0.1); }
      #vyshu-close { background: none; border: none; color: #64748b; font-size: 1.1rem; cursor: pointer; padding: 4px 6px; border-radius: 4px; transition: color 0.15s; }
      #vyshu-close:hover { color: #f8fafc; }

      /* Messages */
      #vyshu-messages {
        flex: 1; overflow-y: auto; padding: 14px 14px 6px;
        display: flex; flex-direction: column; gap: 12px;
        scrollbar-width: thin; scrollbar-color: #1e293b transparent;
      }
      #vyshu-messages::-webkit-scrollbar { width: 4px; }
      #vyshu-messages::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
      .vyshu-msg { display: flex; gap: 8px; animation: msgIn 0.25s ease; }
      @keyframes msgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
      .vyshu-msg.user { flex-direction: row-reverse; }
      .vyshu-bubble {
        max-width: 85%; padding: 10px 13px;
        border-radius: 12px; font-size: 0.83rem; line-height: 1.58;
      }
      .vyshu-msg.bot .vyshu-bubble {
        background: #162032; border: 1px solid rgba(99,102,241,0.18);
        color: #cbd5e1; border-radius: 4px 12px 12px 12px;
      }
      .vyshu-msg.user .vyshu-bubble {
        background: linear-gradient(135deg,#6366f1,#8b5cf6);
        color: white; border-radius: 12px 4px 12px 12px;
      }
      .vyshu-msg-icon {
        width: 28px; height: 28px; border-radius: 50%;
        background: linear-gradient(135deg,#6366f1,#8b5cf6);
        display: flex; align-items: center; justify-content: center;
        font-size: 0.85rem; flex-shrink: 0; align-self: flex-end;
      }
      /* TTS speak button on bot messages */
      .vyshu-speak-btn {
        background: none; border: none; color: #475569; cursor: pointer;
        font-size: 0.75rem; padding: 2px 5px; border-radius: 4px;
        transition: color 0.15s; margin-top: 4px; display: inline-block;
      }
      .vyshu-speak-btn:hover { color: #38bdf8; }
      .vyshu-speak-btn.speaking { color: #38bdf8; animation: speakBtn 0.8s ease-in-out infinite; }
      @keyframes speakBtn { 0%,100%{opacity:0.5} 50%{opacity:1} }

      /* Typing indicator */
      .vyshu-typing { display: flex; gap: 5px; padding: 10px 13px; }
      .vyshu-typing span { width: 7px; height: 7px; border-radius: 50%; background: #6366f1; animation: typingDot 1.2s ease-in-out infinite; }
      .vyshu-typing span:nth-child(2) { animation-delay: 0.2s; }
      .vyshu-typing span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes typingDot { 0%,80%,100%{transform:scale(0.7);opacity:0.5} 40%{transform:scale(1.1);opacity:1} }

      /* Waveform visualizer */
      #vyshu-waveform {
        height: 32px; padding: 0 14px; display: none;
        align-items: center; justify-content: center; gap: 2px;
        background: rgba(99,102,241,0.05);
        border-top: 1px solid rgba(99,102,241,0.1);
        flex-shrink: 0;
      }
      #vyshu-waveform.active { display: flex; }
      .wave-bar {
        width: 3px; border-radius: 3px;
        background: linear-gradient(to top, #6366f1, #38bdf8);
        animation: waveAnim 0.8s ease-in-out infinite;
      }
      .wave-bar:nth-child(2){animation-delay:0.1s} .wave-bar:nth-child(3){animation-delay:0.2s}
      .wave-bar:nth-child(4){animation-delay:0.3s} .wave-bar:nth-child(5){animation-delay:0.4s}
      .wave-bar:nth-child(6){animation-delay:0.3s} .wave-bar:nth-child(7){animation-delay:0.2s}
      .wave-bar:nth-child(8){animation-delay:0.1s} .wave-bar:nth-child(9){animation-delay:0s}
      .wave-bar:nth-child(10){animation-delay:0.15s} .wave-bar:nth-child(11){animation-delay:0.25s}
      @keyframes waveAnim {
        0%,100%{height:4px;opacity:0.4} 50%{height:22px;opacity:1}
      }

      /* Listening status banner */
      #vyshu-listening-banner {
        display: none; align-items: center; gap: 8px; justify-content: center;
        padding: 6px 14px; font-size: 0.78rem; color: #f59e0b; font-weight: 600;
        background: rgba(245,158,11,0.08); border-top: 1px solid rgba(245,158,11,0.2);
        flex-shrink: 0;
      }
      #vyshu-listening-banner.active { display: flex; }
      .listen-dot { width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; animation: listenPulse 1s ease-in-out infinite; }
      @keyframes listenPulse { 0%,100%{transform:scale(0.8);opacity:0.5} 50%{transform:scale(1.3);opacity:1} }

      /* Suggestions chips */
      #vyshu-suggestions {
        padding: 7px 12px; display: flex; flex-wrap: wrap; gap: 5px;
        border-top: 1px solid rgba(99,102,241,0.1); flex-shrink: 0;
      }
      .vyshu-chip {
        background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.22);
        color: #a5b4fc; padding: 3px 9px; border-radius: 20px;
        font-size: 0.71rem; cursor: pointer; transition: all 0.15s; white-space: nowrap;
      }
      .vyshu-chip:hover { background: rgba(99,102,241,0.24); color: #c4b5fd; }

      /* Input bar */
      #vyshu-inputbar {
        padding: 10px 14px; border-top: 1px solid rgba(99,102,241,0.15);
        display: flex; gap: 7px; align-items: center; background: #0a0e16;
        flex-shrink: 0;
      }
      #vyshu-input {
        flex: 1; background: #162032; border: 1px solid rgba(99,102,241,0.2);
        color: #f8fafc; padding: 9px 13px; border-radius: 20px;
        font-size: 0.84rem; outline: none; transition: border-color 0.15s;
        font-family: inherit;
      }
      #vyshu-input:focus { border-color: rgba(99,102,241,0.5); }
      #vyshu-input::placeholder { color: #475569; }
      #vyshu-input.listening { border-color: rgba(245,158,11,0.6); background: rgba(245,158,11,0.05); }

      /* Mic button */
      #vyshu-mic {
        width: 36px; height: 36px; border-radius: 50%; border: none;
        background: var(--mic-bg, rgba(30,41,59,0.9)); color: var(--mic-color, #64748b);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        font-size: 1rem; transition: all 0.2s; flex-shrink: 0;
        border: 1px solid rgba(99,102,241,0.2);
      }
      #vyshu-mic:hover { background: rgba(99,102,241,0.2); color: #a5b4fc; border-color: rgba(99,102,241,0.4); }
      #vyshu-mic.listening {
        --mic-bg: rgba(245,158,11,0.2); --mic-color: #f59e0b;
        border-color: rgba(245,158,11,0.5);
        animation: micPulse 1s ease-in-out infinite;
      }
      @keyframes micPulse { 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0.4)} 50%{box-shadow:0 0 0 8px rgba(245,158,11,0)} }
      #vyshu-mic.unsupported { opacity: 0.35; cursor: not-allowed; }

      /* Send button */
      #vyshu-send {
        width: 36px; height: 36px; border-radius: 50%;
        background: linear-gradient(135deg,#6366f1,#8b5cf6);
        border: none; color: white; cursor: pointer; font-size: 1rem;
        display: flex; align-items: center; justify-content: center;
        transition: transform 0.15s, box-shadow 0.15s; flex-shrink: 0;
      }
      #vyshu-send:hover { transform: scale(1.08); box-shadow: 0 4px 14px rgba(99,102,241,0.4); }

      /* Voice transcript preview */
      #vyshu-transcript-preview {
        font-size: 0.75rem; color: #f59e0b; font-style: italic;
        padding: 0 14px 4px; display: none; flex-shrink: 0;
        text-align: center; background: #0a0e16;
      }
      #vyshu-transcript-preview.active { display: block; }
    `;
        document.head.appendChild(style);

        const widget = document.createElement('div');
        widget.id = 'vyshu-widget';
        widget.innerHTML = `
      <div id="vyshu-panel">
        <div id="vyshu-header">
          <div id="vyshu-avatar">🤖</div>
          <div id="vyshu-title">
            <strong>Vyshu AI</strong>
            <span>Quantum Voice Assistant</span>
          </div>
          <div id="vyshu-status-bar">
            <div id="vyshu-online"></div>
            <button id="vyshu-tts-toggle" class="active" title="Toggle voice output">🔊</button>
            <button id="vyshu-close" title="Close">✕</button>
          </div>
        </div>
        <div id="vyshu-messages"></div>
        <div id="vyshu-listening-banner">
          <span class="listen-dot"></span> Listening… speak your question
        </div>
        <div id="vyshu-waveform">
          ${Array.from({ length: 11 }, (_, i) => `<div class="wave-bar" style="height:${4 + Math.random() * 10}px"></div>`).join('')}
        </div>
        <div id="vyshu-transcript-preview"></div>
        <div id="vyshu-suggestions">
          <span class="vyshu-chip" data-q="Teach me Bell state step by step">🎓 Teach Bell</span>
          <span class="vyshu-chip" data-q="Teach me Grover search step by step">🎓 Teach Grover</span>
          <span class="vyshu-chip" data-q="Teach me quantum teleportation step by step">🎓 Teach Teleportation</span>
          <span class="vyshu-chip" data-q="Teach me GHZ state step by step">🎓 Teach GHZ</span>
          <span class="vyshu-chip" data-q="What is the Bloch sphere?">Bloch Sphere</span>
          <span class="vyshu-chip" data-q="Analyze my circuit">My Circuit</span>
        </div>
        <div id="vyshu-inputbar">
          <input id="vyshu-input" placeholder="Ask or click 🎤 to speak…" autocomplete="off" />
          <button id="vyshu-mic" title="Speak your question (🎤)">🎤</button>
          <button id="vyshu-send" title="Send">➤</button>
        </div>
      </div>
      <div id="vyshu-label">Vyshu AI 🎤</div>
      <button id="vyshu-toggle" title="Open Vyshu AI Voice Assistant">🤖</button>
    `;
        document.body.appendChild(widget);

        // ── DOM refs ──
        const toggle = widget.querySelector('#vyshu-toggle');
        const panel = widget.querySelector('#vyshu-panel');
        const closeBtn = widget.querySelector('#vyshu-close');
        const input = widget.querySelector('#vyshu-input');
        const sendBtn = widget.querySelector('#vyshu-send');
        const micBtn = widget.querySelector('#vyshu-mic');
        const ttsBtn = widget.querySelector('#vyshu-tts-toggle');
        const messages = widget.querySelector('#vyshu-messages');
        const label = widget.querySelector('#vyshu-label');
        const listeningBanner = widget.querySelector('#vyshu-listening-banner');
        const waveform = widget.querySelector('#vyshu-waveform');
        const transcript = widget.querySelector('#vyshu-transcript-preview');
        const avatar = widget.querySelector('#vyshu-avatar');

        // Hide label after 5s
        setTimeout(() => { if (label) label.style.display = 'none'; }, 5000);

        // ── Speech Recognition setup ──
        recognition = createRecognition();
        if (!recognition) {
            micBtn.classList.add('unsupported');
            micBtn.title = 'Voice input not supported in this browser';
        }

        function setListening(active) {
            isListening = active;
            micBtn.classList.toggle('listening', active);
            input.classList.toggle('listening', active);
            listeningBanner.classList.toggle('active', active);
            waveform.classList.toggle('active', active);
            if (active) {
                micBtn.textContent = '⏹';
                micBtn.title = 'Stop listening';
            } else {
                micBtn.textContent = '🎤';
                micBtn.title = 'Speak your question';
                transcript.textContent = '';
                transcript.classList.remove('active');
            }
        }

        function setSpeaking(active) {
            avatar.classList.toggle('speaking', active);
            waveform.classList.toggle('active', active);
        }

        if (recognition) {
            recognition.onstart = () => setListening(true);

            recognition.onresult = (e) => {
                let interimText = '';
                let finalText = '';
                for (let i = e.resultIndex; i < e.results.length; i++) {
                    const res = e.results[i];
                    if (res.isFinal) finalText += res[0].transcript;
                    else interimText += res[0].transcript;
                }
                if (interimText) {
                    transcript.textContent = '🎤 ' + interimText;
                    transcript.classList.add('active');
                }
                if (finalText.trim()) {
                    input.value = finalText.trim();
                    transcript.textContent = '';
                    transcript.classList.remove('active');
                }
            };

            recognition.onend = () => {
                setListening(false);
                if (input.value.trim()) {
                    setTimeout(() => sendMessage(input.value), 200);
                }
            };

            recognition.onerror = (e) => {
                setListening(false);
                if (e.error === 'not-allowed') addBotMessage('Microphone access was denied. Please allow microphone permission in your browser settings.');
                else if (e.error === 'no-speech') addBotMessage('No speech detected. Please try again and speak clearly into your microphone.');
            };
        }

        micBtn.addEventListener('click', () => {
            if (!recognition) { addBotMessage('Voice input is not supported in this browser. Please use Chrome or Edge for voice features.'); return; }
            if (isListening) {
                recognition.stop();
            } else {
                stopSpeaking();
                try { recognition.start(); } catch (e) { console.warn('Recognition error:', e); }
            }
        });

        // ── TTS toggle ──
        ttsBtn.addEventListener('click', () => {
            ttsEnabled = !ttsEnabled;
            ttsBtn.classList.toggle('active', ttsEnabled);
            ttsBtn.textContent = ttsEnabled ? '🔊' : '🔇';
            ttsBtn.title = ttsEnabled ? 'Voice output ON — click to mute' : 'Voice output OFF — click to unmute';
            if (!ttsEnabled) stopSpeaking();
        });

        // ── Panel open/close ──
        toggle.addEventListener('click', () => {
            const isOpen = panel.classList.contains('open');
            panel.classList.toggle('open');
            if (!isOpen) {
                if (!messages.children.length) {
                    const greeting = KB.find(e => e.patterns.includes('hello')).answer;
                    addBotMessage(greeting, true);
                }
                setTimeout(() => input.focus(), 100);
            } else {
                stopSpeaking();
                if (isListening && recognition) recognition.stop();
            }
        });

        closeBtn.addEventListener('click', () => {
            panel.classList.remove('open');
            stopSpeaking();
            if (isListening && recognition) recognition.stop();
        });

        // ── Add messages ──
        function addBotMessage(text, autoSpeak = false) {
            const el = document.createElement('div');
            el.className = 'vyshu-msg bot';
            const rawText = text;
            el.innerHTML = `
        <div class="vyshu-msg-icon">🤖</div>
        <div>
          <div class="vyshu-bubble">${formatMarkdown(text)}</div>
          <button class="vyshu-speak-btn" title="Read aloud">🔊 Read</button>
        </div>`;
            messages.appendChild(el);
            messages.scrollTop = messages.scrollHeight;

            // Per-message speak button
            const speakBtn = el.querySelector('.vyshu-speak-btn');
            speakBtn.addEventListener('click', () => {
                if (speakBtn.classList.contains('speaking')) {
                    stopSpeaking();
                    setSpeaking(false);
                    speakBtn.classList.remove('speaking');
                    speakBtn.textContent = '🔊 Read';
                } else {
                    widget.querySelectorAll('.vyshu-speak-btn.speaking').forEach(b => {
                        b.classList.remove('speaking'); b.textContent = '🔊 Read';
                    });
                    speakBtn.classList.add('speaking');
                    speakBtn.textContent = '⏹ Stop';
                    setSpeaking(true);
                    speak(rawText, () => {
                        setSpeaking(false);
                        speakBtn.classList.remove('speaking');
                        speakBtn.textContent = '🔊 Read';
                    });
                }
            });

            if (autoSpeak && ttsEnabled) {
                setSpeaking(true);
                speak(rawText, () => setSpeaking(false));
            }
        }

        function addUserMessage(text) {
            const el = document.createElement('div');
            el.className = 'vyshu-msg user';
            el.innerHTML = `<div class="vyshu-bubble">${text}</div>`;
            messages.appendChild(el);
            messages.scrollTop = messages.scrollHeight;
        }

        function showTyping() {
            const el = document.createElement('div');
            el.className = 'vyshu-msg bot';
            el.id = 'vyshu-typing-indicator';
            el.innerHTML = `<div class="vyshu-msg-icon">🤖</div><div class="vyshu-bubble vyshu-typing"><span></span><span></span><span></span></div>`;
            messages.appendChild(el);
            messages.scrollTop = messages.scrollHeight;
            return el;
        }

        function getCircuitContext() {
            try {
                const app = window.QfluxApp;
                if (!app) return null;
                const { numQubits, numSteps, grid } = app.state;
                let gateCount = 0; const activeSteps = new Set();
                for (let s = 0; s < numSteps; s++)
                    for (let q = 0; q < numQubits; q++)
                        if (grid[s][q]) { gateCount++; activeSteps.add(s); }
                return { numQubits, numSteps, gateCount, depth: activeSteps.size };
            } catch (e) { return null; }
        }

        function sendMessage(text) {
            if (!text.trim()) return;
            stopSpeaking();
            addUserMessage(text);
            input.value = '';
            const typingEl = showTyping();
            const delay = 380 + Math.random() * 350;
            setTimeout(() => {
                typingEl.remove();
                const ctx = getCircuitContext();
                const response = generateResponse(text, ctx);
                addBotMessage(response, ttsEnabled);
            }, delay);
        }

        sendBtn.addEventListener('click', () => sendMessage(input.value));
        input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input.value); } });

        widget.querySelectorAll('.vyshu-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                if (!panel.classList.contains('open')) panel.classList.add('open');
                sendMessage(chip.dataset.q);
            });
        });

        // Load voices asynchronously (Chrome needs this)
        if (window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
            window.speechSynthesis.getVoices();
        }
    }

    return { init: buildUI, generateResponse, formatMarkdown };
});
