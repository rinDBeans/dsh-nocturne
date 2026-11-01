import {VERTEX, SURFACE, LIGHT} from './shaders.js';
import {clamp, toUnit, reduceMotion} from './math.js';
import {SETTINGS, theme} from './state.js';
import {ambientLevel} from './light-model.js';

class PaperLight {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', {premultipliedAlpha:false, antialias:false});
    this.state = this.gl ? 'initializing' : 'failed';
    this.spec = null;
    this.textures = [];
    this.framebuffer = null;
    this.buffer = null;
    if (this.gl) this.initialize();
  }
  /** 创建全部与 WebGL context 同寿命的资源。上下文恢复后必须完整重跑。 */
  initialize() {
    try {
      this.surfaceProgram = this.program(SURFACE);
      this.lightProgram = this.program(LIGHT);
      this.buffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), this.gl.STATIC_DRAW);
      this.gl.enableVertexAttribArray(0);
      this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
      this.su = this.locate(this.surfaceProgram, ['uSize','uScale','uSeed','uFold','uFelt','uAge','uMottle','uCrinkle','uLaid','uLinen','uPaper','uTexture']);
      this.lu = this.locate(this.lightProgram, ['uAlbedo','uNormal','uSize','uScale','uSource','uLightPos','uLightDir','uCone','uExposure','uWindow','uPanes','uTint','uLamp','uAmbient','uAmbientTint','uRelief','uCrinkle','uGrain','uTime','uSoft']);
      this.state = 'ready';
      return true;
    } catch (error) {
      console.warn('paper light disabled:', error.message);
      this.state = 'failed';
      return false;
    }
  }
  invalidate() {
    this.spec = null;
    this.textures = [];
    this.framebuffer = null;
    this.buffer = null;
    this.state = 'lost';
  }
  restore() {
    if (!this.gl) { this.state = 'failed'; return false; }
    // 旧 context 的资源由浏览器回收；这里只重新建立，不删除失效句柄。
    this.invalidate();
    return this.initialize();
  }
  program(fragment) {
    const gl = this.gl;
    const program = gl.createProgram();
    const sources = [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, fragment]];
    for (const pair of sources) {
      const shader = gl.createShader(pair[0]);
      gl.shaderSource(shader, pair[1]);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      gl.attachShader(program, shader);
    }
    gl.bindAttribLocation(program, 0, 'aPos');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    return program;
  }
  locate(program, names) {
    const out = {};
    for (const name of names) out[name] = this.gl.getUniformLocation(program, name);
    return out;
  }
  build(spec) {
    const gl = this.gl;
    if (this.state !== 'ready') return;
    const paperDef = spec.p;
    const width = Math.max(1, Math.round(spec.width * spec.pixelRatio));
    const height = Math.max(1, Math.round(spec.height * spec.pixelRatio));
    this.canvas.width = width;
    this.canvas.height = height;
    this.spec = spec;
    this.release();
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    for (let i = 0; i < 2; i++) {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, width, height);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, texture, 0);
      this.textures.push(texture);
    }
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    this.framebuffer = framebuffer;

    const u = this.su;
    gl.useProgram(this.surfaceProgram);
    gl.viewport(0, 0, width, height);
    gl.uniform2f(u.uSize, spec.width, spec.height);
    gl.uniform1f(u.uScale, spec.pixelRatio);
    gl.uniform1f(u.uSeed, 3.7);
    gl.uniform1f(u.uFold, spec.height * 0.38);
    // 纸纹的低频结构按纸的物理尺寸缩放：TN 的着色器是按 ~660×620 的纸调的，
    // 同样的频率铺到 1200px 的纸上，斑块就碎成了噪点。
    gl.uniform1f(u.uPaper, clamp(Math.sqrt(spec.width * spec.height) / 700, 0.9, 1.9));
    // 每张纸的结构参数原样送进去，强弱只由 uTexture 一个数决定。
    // 以前把 texture 乘在 laid/linen 上、却不乘基础噪声，纸纹调低时纸就不再是它自己。
    gl.uniform1f(u.uTexture, SETTINGS.texture);
    gl.uniform1f(u.uFelt, paperDef.surface.felt);
    gl.uniform1f(u.uAge, paperDef.surface.age);
    gl.uniform1f(u.uMottle, paperDef.surface.mottle);
    gl.uniform1f(u.uCrinkle, paperDef.surface.crinkle);
    gl.uniform1f(u.uLaid, paperDef.surface.laid);
    gl.uniform1f(u.uLinen, paperDef.surface.linen);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  render(rig, paperDef, time) {
    const gl = this.gl;
    const u = this.lu;
    if (!this.spec || this.state !== 'ready' || gl.isContextLost()) return;
    const lightColor = toUnit(theme().light.color);
    const peak = Math.max(lightColor[0], lightColor[1], lightColor[2], 1e-6);
    const room = toUnit(theme().palette.room);
    const strength = rig.source === 'moonlight' ? .75 : .4;
    const tintChannel = (c) => 1 + ((.6 + c * 1.5) - 1) * strength;

    gl.useProgram(this.lightProgram);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[1]);
    gl.uniform1i(u.uAlbedo, 0);
    gl.uniform1i(u.uNormal, 1);
    gl.uniform2f(u.uSize, this.spec.width, this.spec.height);
    gl.uniform1f(u.uScale, this.spec.pixelRatio);
    gl.uniform1i(u.uSource, {carriage:0, 'desk-lamp':1, moonlight:2}[rig.source]);
    gl.uniform3fv(u.uLightPos, rig.position);
    gl.uniform3fv(u.uLightDir, rig.direction);
    gl.uniform2f(u.uCone, rig.cosOuter, rig.cosInner);
    gl.uniform1f(u.uExposure, rig.exposure);
    gl.uniform4f(u.uWindow, rig.window.x, rig.window.y, rig.window.width, rig.window.height);
    gl.uniform4f(u.uPanes, rig.window.columns, rig.window.rows, rig.window.softness, rig.window.skew);
    gl.uniform3f(u.uTint, lightColor[0] / peak, lightColor[1] / peak, lightColor[2] / peak);
    gl.uniform1f(u.uLamp, SETTINGS.lamp && SETTINGS.enabled ? 1 : 0);
    gl.uniform1f(u.uAmbient, ambientLevel());
    gl.uniform3f(u.uAmbientTint, tintChannel(room[0]), tintChannel(room[1]), tintChannel(room[2]));
    gl.uniform1f(u.uRelief, 2 * SETTINGS.paperIllumination);
    gl.uniform1f(u.uSoft, SETTINGS.beam === 'soft' ? 1 : 0);
    // 法线里已经带了纸纹振幅，这里再用一次材质本身的褶皱，不能重复乘 texture。
    gl.uniform1f(u.uCrinkle, paperDef.surface.crinkle);
    gl.uniform1f(u.uGrain, reduceMotion ? 0 : SETTINGS.grain);
    gl.uniform1f(u.uTime, time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  release() {
    if (!this.gl) return;
    this.textures.forEach((texture) => this.gl.deleteTexture(texture));
    this.textures = [];
    if (this.framebuffer) { this.gl.deleteFramebuffer(this.framebuffer); this.framebuffer = null; }
  }
  destroy() {
    this.release();
    if (this.buffer) this.gl.deleteBuffer(this.buffer);
    if (this.surfaceProgram) this.gl.deleteProgram(this.surfaceProgram);
    if (this.lightProgram) this.gl.deleteProgram(this.lightProgram);
    this.buffer = null;
    this.spec = null;
    this.state = 'disposed';
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · 辉光：lighting/glow-layer.ts
   ═══════════════════════════════════════════════════════════════════════ */

export {PaperLight};
