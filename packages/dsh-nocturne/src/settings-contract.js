export const SETTING_KEYS = Object.freeze([
  'paper', 'theme', 'lamp', 'enabled', 'intensity', 'spread', 'beam', 'aim',
  'reach', 'softness', 'bloom', 'grain', 'cursorGlow', 'paperIllumination',
  'particles', 'texture', 'cursorMode', 'coexist', 'diagnostics', 'ambientMotion'
]);

const NUMBER_KEYS = new Set([
  'intensity', 'spread', 'aim', 'reach', 'softness', 'bloom', 'grain',
  'cursorGlow', 'paperIllumination', 'particles', 'texture'
]);
const STRING_KEYS = new Set(['paper', 'theme', 'beam', 'cursorMode', 'coexist']);
const BOOLEAN_KEYS = new Set(['lamp', 'enabled', 'diagnostics', 'ambientMotion']);
const TOP_LEVEL = new Set([
  ...SETTING_KEYS, 'window', 'scrollbar', 'v', '__diag', '__hangs', '__error'
]);

export function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

/** 宿主写入前的边界校验；客户端仍会在读取后做一次规范化与限幅。 */
export function validateSettingsDocument(document) {
  if (!isRecord(document)) return 'expected an object';
  for (const key of Object.keys(document)) {
    if (!TOP_LEVEL.has(key)) return 'unknown setting: ' + key;
  }
  for (const [key, value] of Object.entries(document)) {
    if (NUMBER_KEYS.has(key) && !finite(value)) return 'expected finite number: ' + key;
    if (STRING_KEYS.has(key) && typeof value !== 'string') return 'expected string: ' + key;
    if (BOOLEAN_KEYS.has(key) && typeof value !== 'boolean') return 'expected boolean: ' + key;
  }
  if (document.v !== undefined && !finite(document.v)) return 'expected finite number: v';
  if (document.window !== undefined) {
    if (!isRecord(document.window)) return 'expected object: window';
    for (const [key, value] of Object.entries(document.window)) {
      if (!['x', 'y', 'columns', 'rows', 'softness', 'slant'].includes(key)) return 'unknown setting: window.' + key;
      if (!finite(value)) return 'expected finite number: window.' + key;
    }
  }
  if (document.scrollbar !== undefined) {
    if (!isRecord(document.scrollbar)) return 'expected object: scrollbar';
    for (const [key, value] of Object.entries(document.scrollbar)) {
      if (!['style', 'finish', 'barWidth', 'barOpacity'].includes(key)) return 'unknown setting: scrollbar.' + key;
      if (['style', 'finish'].includes(key) && typeof value !== 'string') return 'expected string: scrollbar.' + key;
      if (['barWidth', 'barOpacity'].includes(key) && !finite(value)) return 'expected finite number: scrollbar.' + key;
    }
  }
  if (document.__diag !== undefined && !isRecord(document.__diag)) return 'expected object: __diag';
  if (document.__hangs !== undefined && !Array.isArray(document.__hangs)) return 'expected array: __hangs';
  if (document.__error !== undefined && typeof document.__error !== 'string') return 'expected string: __error';
  return '';
}
