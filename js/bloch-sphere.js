/**
 * Qflux 3D Bloch Sphere Visualizer
 * HTML5 Canvas 3D rendering with interactive mouse orbit.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BlochSphere = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  class BlochSphereRenderer {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.width = canvas.width || 300;
      this.height = canvas.height || 300;
      this.radius = options.radius || 95;

      // Rotation angles (Euler angles in radians)
      this.rotX = -0.35; // tilt forward
      this.rotY = 0.55;  // orbit around Z

      // Current Bloch vector (x, y, z)
      this.vector = { x: 0, y: 0, z: 1, r: 1 };
      this.targetVector = { x: 0, y: 0, z: 1, r: 1 };

      // Drag interaction
      this.isDragging = false;
      this.lastMouseX = 0;
      this.lastMouseY = 0;

      this.initEvents();
      this.render();
    }

    initEvents() {
      const getPos = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: clientX - rect.left,
          y: clientY - rect.top
        };
      };

      const onStart = (e) => {
        this.isDragging = true;
        const pos = getPos(e);
        this.lastMouseX = pos.x;
        this.lastMouseY = pos.y;
      };

      const onMove = (e) => {
        if (!this.isDragging) return;
        const pos = getPos(e);
        const dx = pos.x - this.lastMouseX;
        const dy = pos.y - this.lastMouseY;

        this.rotY += dx * 0.015;
        this.rotX += dy * 0.015;

        // Clamp tilt to avoid gimbal inversion
        this.rotX = Math.max(-1.45, Math.min(1.45, this.rotX));

        this.lastMouseX = pos.x;
        this.lastMouseY = pos.y;
        this.render();
      };

      const onEnd = () => {
        this.isDragging = false;
      };

      this.canvas.addEventListener('mousedown', onStart);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onEnd);

      this.canvas.addEventListener('touchstart', onStart, { passive: true });
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('touchend', onEnd);
    }

    setVector(v) {
      this.vector = {
        x: v.x || 0,
        y: v.y || 0,
        z: v.z !== undefined ? v.z : 1,
        r: v.r !== undefined ? v.r : 1
      };
      this.render();
    }

    // 3D coordinate transformation: (x, y, z) -> projected 2D (px, py, depth)
    // Standard physics convention: Z is up (North pole |0>, South pole |1>), X forward/right, Y right/back.
    project(x, y, z) {
      // Rotate around Y axis (rotY)
      const cosY = Math.cos(this.rotY);
      const sinY = Math.sin(this.rotY);
      const x1 = x * cosY + y * sinY;
      const y1 = -x * sinY + y * cosY;
      const z1 = z;

      // Rotate around X axis (rotX)
      const cosX = Math.cos(this.rotX);
      const sinX = Math.sin(this.rotX);
      const x2 = x1;
      const y2 = y1 * cosX - z1 * sinX;
      const z2 = y1 * sinX + z1 * cosX;

      const cx = this.width / 2;
      const cy = this.height / 2;

      return {
        x: cx + x2 * this.radius,
        y: cy - z2 * this.radius, // Canvas Y is inverted
        depth: y2
      };
    }

    render() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      this.width = w;
      this.height = h;

      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const r = this.radius;

      // Background Sphere Glow / Radial gradient
      const bgGrad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 1.05);
      bgGrad.addColorStop(0, 'rgba(30, 41, 59, 0.4)');
      bgGrad.addColorStop(0.85, 'rgba(15, 23, 42, 0.6)');
      bgGrad.addColorStop(1, 'rgba(99, 102, 241, 0.1)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Outer Sphere Border
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Render Coordinate Grid Rings (Equator, XZ, YZ meridians)
      this.drawRing('xy', 'rgba(99, 102, 241, 0.35)', 1); // Equator
      this.drawRing('xz', 'rgba(148, 163, 184, 0.25)', 1);
      this.drawRing('yz', 'rgba(148, 163, 184, 0.25)', 1);

      // Render Axes (X, Y, Z)
      this.drawAxis(1.3, 0, 0, '+X |+⟩', '#38bdf8');
      this.drawAxis(0, 1.3, 0, '+Y |i⟩', '#c084fc');
      this.drawAxis(0, 0, 1.35, '|0⟩', '#4ade80'); // North pole
      this.drawAxis(0, 0, -1.35, '|1⟩', '#f87171'); // South pole

      // Render State Vector Arrow
      this.drawStateVector();
    }

    drawRing(plane, color, lineWidth = 1) {
      const ctx = this.ctx;
      const segments = 48;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();

      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        let x = 0, y = 0, z = 0;
        if (plane === 'xy') {
          x = Math.cos(angle);
          y = Math.sin(angle);
        } else if (plane === 'xz') {
          x = Math.cos(angle);
          z = Math.sin(angle);
        } else if (plane === 'yz') {
          y = Math.cos(angle);
          z = Math.sin(angle);
        }

        const p = this.project(x, y, z);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    drawAxis(x, y, z, label, color) {
      const ctx = this.ctx;
      const origin = this.project(0, 0, 0);
      const tip = this.project(x, y, z);

      ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = color;
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, tip.x, tip.y);
    }

    drawStateVector() {
      const ctx = this.ctx;
      const v = this.vector;
      const origin = this.project(0, 0, 0);
      const tip = this.project(v.x, v.y, v.z);

      // Projection shadow on equator (XY plane)
      const shadow = this.project(v.x, v.y, 0);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(shadow.x, shadow.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Vector Shaft with Glow
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Arrowhead / Glowing Tip
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Origin dot
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return { BlochSphereRenderer };
});
