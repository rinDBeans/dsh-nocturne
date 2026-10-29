const test = require('node:test');
const assert = require('node:assert/strict');
const {loadContract} = require('./helpers/client-contract.cjs');

function fakeGL() {
  let programs = 0;
  const gl = {
    VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4,
    ARRAY_BUFFER: 5, STATIC_DRAW: 6, FLOAT: 7,
    createProgram: () => ({id: ++programs}),
    createShader: (kind) => ({kind}),
    shaderSource() {}, compileShader() {}, attachShader() {}, bindAttribLocation() {},
    getShaderParameter: () => true, getProgramParameter: () => true, linkProgram() {},
    createBuffer: () => ({}), bindBuffer() {}, bufferData() {}, enableVertexAttribArray() {},
    vertexAttribPointer() {}, getUniformLocation: (program, name) => ({program, name}),
    deleteShader() {}, deleteProgram() {}, deleteBuffer() {},
    getProgramInfoLog: () => 'link failed', getShaderInfoLog: () => 'compile failed'
  };
  return {gl, programCount: () => programs};
}

test('GPU restore recreates programs, buffer and uniform locations', () => {
  const c = loadContract();
  const fake = fakeGL();
  const light = new c.PaperLight({getContext: () => fake.gl});
  assert.equal(fake.programCount(), 2);
  assert.equal(typeof light.restore, 'function');
  light.restore();
  assert.equal(fake.programCount(), 4);
  assert.equal(light.state, 'ready');
});
