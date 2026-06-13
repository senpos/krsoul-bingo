const MAX_PARTICLES = 5000;
const FLOATS = 7;

export class ParticleRenderer {
  constructor() {
    this.canvas = null;
    this.gl = null;
    this.program = null;
    this.vao = null;
    this.buffer = null;
    this.particles = [];
    this._buf32 = new Float32Array(MAX_PARTICLES * FLOATS);
    this._alive = false;
    this._rafId = null;
    this._onDone = null;
    this._renderCount = 0;
  }

  init() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:fixed;inset:0;z-index:9998;pointer-events:none;';
    document.body.appendChild(this.canvas);

    const gl = this.canvas.getContext('webgl2', {
      alpha: true, premultipliedAlpha: false, antialias: false
    });
    if (!gl) { this.destroy(); return false; }
    this.gl = gl;

    const vsSrc = `#version 300 es
      in vec2 a_pos;
      in vec4 a_color;
      in float a_size;
      out vec4 v_color;
      uniform vec2 u_res;
      void main(){
        vec2 ndc=(a_pos/u_res)*2.0-1.0;
        ndc.y=-ndc.y;
        gl_Position=vec4(ndc,0.0,1.0);
        gl_PointSize=a_size;
        v_color=a_color;
      }`;
    const fsSrc = `#version 300 es
      precision highp float;
      in vec4 v_color;
      out vec4 fragColor;
      void main(){
        vec2 uv=gl_PointCoord-vec2(0.5);
        float d=length(uv);
        if(d>0.5)discard;
        float a=smoothstep(0.5,0.2,d)*v_color.a;
        fragColor=vec4(v_color.rgb*a,a);
      }`;

    const vs = this._compile(gl.VERTEX_SHADER, vsSrc);
    const fs = this._compile(gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) { this.destroy(); return false; }

    this.program = gl.createProgram();
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('PGL link:', gl.getProgramInfoLog(this.program));
      this.destroy(); return false;
    }
    gl.deleteShader(vs); gl.deleteShader(fs);

    this._uRes = gl.getUniformLocation(this.program, 'u_res');

    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, MAX_PARTICLES * FLOATS * 4, gl.DYNAMIC_DRAW);

    const stride = FLOATS * 4;
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, stride, 8);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 24);
    gl.bindVertexArray(null);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    this.resize();
    return true;
  }

  resize() {
    const gl = this.gl;
    if (!gl) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.program);
    gl.uniform2f(this._uRes, w, h);
  }

  emit(list) {
    for (const p of list) this.particles.push(p);
    if (!this._alive && this.particles.length > 0) {
      this._alive = true;
      this._lastTime = performance.now();
      this._tick();
    }
  }

  done(cb) { this._onDone = cb; }

  destroy() {
    this._alive = false;
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    const gl = this.gl;
    if (gl) {
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindVertexArray(null);
      if (this.program) gl.deleteProgram(this.program);
      if (this.vao) gl.deleteVertexArray(this.vao);
      if (this.buffer) gl.deleteBuffer(this.buffer);
      gl.useProgram(null);
    }
    if (this.canvas && this.canvas.parentNode) this.canvas.remove();
    this.gl = null;
    this.canvas = null;
    this.particles = [];
    if (this._onDone) { this._onDone(); this._onDone = null; }
  }

  _tick() {
    if (!this._alive) return;
    const now = performance.now();
    const dt = Math.min(now - this._lastTime, 50);
    this._lastTime = now;
    this._update(dt / 1000);
    this._render();
    if (this._alive) this._rafId = requestAnimationFrame(() => this._tick());
  }

  _update(dt) {
    const GRAVITY = 300;
    const FRICTION = 0.96;
    let w = 0;
    let bufIdx = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.age += dt;
      if (p.age < (p.delay || 0)) {
        this.particles[w++] = p;
        continue;
      }
      p.vx *= FRICTION;
      p.vy *= FRICTION;
      p.vy += GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;
      p.size *= Math.pow(0.995, dt * 60);
      if (p.alpha <= 0) continue;
      const base = bufIdx * FLOATS;
      this._buf32[base] = p.x;
      this._buf32[base + 1] = p.y;
      this._buf32[base + 2] = p.r;
      this._buf32[base + 3] = p.g;
      this._buf32[base + 4] = p.b;
      this._buf32[base + 5] = Math.max(0, p.alpha);
      this._buf32[base + 6] = Math.max(1, p.size);
      this.particles[w++] = p;
      bufIdx++;
    }
    this.particles.length = w;
    this._renderCount = bufIdx;
    if (w === 0) {
      this._alive = false;
      if (this._onDone) { this._onDone(); this._onDone = null; }
    }
  }

  _render() {
    const gl = this.gl;
    const count = this._renderCount || 0;
    if (!gl || count === 0) return;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this._buf32.subarray(0, count * FLOATS));
    gl.drawArrays(gl.POINTS, 0, count);
    gl.bindVertexArray(null);
  }

  _compile(type, src) {
    const gl = this.gl;
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('PGL shader:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }
}
