// src/settings-contract.js
var SETTING_KEYS = Object.freeze([
  "paper",
  "theme",
  "lamp",
  "enabled",
  "intensity",
  "spread",
  "beam",
  "aim",
  "reach",
  "softness",
  "bloom",
  "grain",
  "cursorGlow",
  "paperIllumination",
  "particles",
  "texture",
  "cursorMode",
  "coexist",
  "diagnostics",
  "ambientMotion"
]);
var NUMBER_KEYS = /* @__PURE__ */ new Set([
  "intensity",
  "spread",
  "aim",
  "reach",
  "softness",
  "bloom",
  "grain",
  "cursorGlow",
  "paperIllumination",
  "particles",
  "texture"
]);
var STRING_KEYS = /* @__PURE__ */ new Set(["paper", "theme", "beam", "cursorMode", "coexist"]);
var BOOLEAN_KEYS = /* @__PURE__ */ new Set(["lamp", "enabled", "diagnostics", "ambientMotion"]);
var TOP_LEVEL = /* @__PURE__ */ new Set([
  ...SETTING_KEYS,
  "window",
  "scrollbar",
  "v",
  "__diag",
  "__hangs",
  "__error"
]);
function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}
function validateSettingsDocument(document) {
  if (!isRecord(document)) return "expected an object";
  for (const key of Object.keys(document)) {
    if (!TOP_LEVEL.has(key)) return "unknown setting: " + key;
  }
  for (const [key, value] of Object.entries(document)) {
    if (NUMBER_KEYS.has(key) && !finite(value)) return "expected finite number: " + key;
    if (STRING_KEYS.has(key) && typeof value !== "string") return "expected string: " + key;
    if (BOOLEAN_KEYS.has(key) && typeof value !== "boolean") return "expected boolean: " + key;
  }
  if (document.v !== void 0 && !finite(document.v)) return "expected finite number: v";
  if (document.window !== void 0) {
    if (!isRecord(document.window)) return "expected object: window";
    for (const [key, value] of Object.entries(document.window)) {
      if (!["x", "y", "columns", "rows", "softness", "slant"].includes(key)) return "unknown setting: window." + key;
      if (!finite(value)) return "expected finite number: window." + key;
    }
  }
  if (document.scrollbar !== void 0) {
    if (!isRecord(document.scrollbar)) return "expected object: scrollbar";
    for (const [key, value] of Object.entries(document.scrollbar)) {
      if (!["style", "finish", "barWidth", "barOpacity"].includes(key)) return "unknown setting: scrollbar." + key;
      if (["style", "finish"].includes(key) && typeof value !== "string") return "expected string: scrollbar." + key;
      if (["barWidth", "barOpacity"].includes(key) && !finite(value)) return "expected finite number: scrollbar." + key;
    }
  }
  if (document.__diag !== void 0 && !isRecord(document.__diag)) return "expected object: __diag";
  if (document.__hangs !== void 0 && !Array.isArray(document.__hangs)) return "expected array: __hangs";
  if (document.__error !== void 0 && typeof document.__error !== "string") return "expected string: __error";
  return "";
}

// src/host.js
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
var PACKAGE_NAME = "dsh-nocturne";
var ROUTE_PREFIX = "/dsh-nocturne";
var SETTINGS_PATH = ROUTE_PREFIX + "/settings";
var MAX_BODY = 64 * 1024;
var name = PACKAGE_NAME;
function harnessPath(ctx, ...segments) {
  const resolve = ctx.get("dshHomePath");
  if (typeof resolve === "function") return resolve(...segments);
  return join(process.env.DSH_HOME ?? join(homedir(), ".dsh"), ...segments);
}
var settingsFile = (ctx) => harnessPath(ctx, "cache", PACKAGE_NAME, "settings.json");
function readDocument(ctx) {
  const file = settingsFile(ctx);
  if (!existsSync(file)) return null;
  try {
    const value = JSON.parse(readFileSync(file, "utf8"));
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch (error) {
    ctx.logger?.warn?.(PACKAGE_NAME + ": settings unreadable (" + error.message + ")");
    return null;
  }
}
function writeDocument(ctx, document) {
  const file = settingsFile(ctx);
  const temporary = file + "." + process.pid + ".tmp";
  try {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(temporary, JSON.stringify(document), "utf8");
    renameSync(temporary, file);
    return true;
  } catch (error) {
    ctx.logger?.warn?.(PACKAGE_NAME + ": settings not written (" + error.message + ")");
    return false;
  }
}
function foreignRequest(req) {
  const address = req.socket?.remoteAddress;
  if (address) {
    const plain = address.startsWith("::ffff:") ? address.slice(7) : address;
    if (plain !== "::1" && !/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(plain)) return true;
  }
  const localHostname = (hostname) => hostname === "localhost" || hostname === "[::1]" || /^127\.\d/.test(hostname);
  const host = req.headers.host;
  if (host) {
    try {
      if (!localHostname(new URL("http://" + host).hostname)) return true;
    } catch {
      return true;
    }
  }
  const origin = req.headers.origin;
  if (origin) {
    try {
      if (origin === "null" || !localHostname(new URL(origin).hostname)) return true;
    } catch {
      return true;
    }
  }
  if (req.headers["sec-fetch-site"] === "cross-site") return true;
  return false;
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(body)
  });
  res.end(body);
}
function apply(ctx) {
  const mount = (scope) => {
    scope.effect(() => {
      const server = scope.webServer;
      if (!server || typeof server.register !== "function") {
        ctx.logger?.warn?.(PACKAGE_NAME + ": host has no webServer service; settings will stay in the browser only");
        return;
      }
      let dispose;
      try {
        dispose = server.register({
          kind: "prefix",
          path: ROUTE_PREFIX,
          handler: (req, res) => {
            const pathname = new URL(req.url ?? "/", "http://x").pathname;
            if (pathname !== SETTINGS_PATH) {
              res.writeHead(404);
              res.end();
              return;
            }
            if (foreignRequest(req)) {
              sendJson(res, 403, { ok: false, error: "loopback only" });
              return;
            }
            const method = req.method ?? "GET";
            if (method === "GET" || method === "HEAD") {
              sendJson(res, 200, { ok: true, settings: readDocument(ctx) });
              return;
            }
            if (method === "PUT" || method === "POST") {
              const contentType = String(req.headers["content-type"] || "").split(";", 1)[0].trim().toLowerCase();
              if (contentType !== "application/json") {
                sendJson(res, 415, { ok: false, error: "application/json required" });
                return;
              }
              readBody(req).then((text) => {
                let parsed;
                try {
                  parsed = JSON.parse(text);
                } catch {
                  sendJson(res, 400, { ok: false, error: "invalid json" });
                  return;
                }
                const validationError = validateSettingsDocument(parsed);
                if (validationError) {
                  sendJson(res, 400, { ok: false, error: validationError });
                  return;
                }
                const written = writeDocument(ctx, parsed);
                sendJson(res, written ? 200 : 500, written ? { ok: true } : { ok: false, error: "settings not written" });
              }, (error) => sendJson(res, 400, { ok: false, error: String(error.message) }));
              return;
            }
            sendJson(res, 405, { ok: false, error: "GET or PUT only" });
          }
        });
      } catch (error) {
        ctx.logger?.warn?.(PACKAGE_NAME + ": settings route unavailable (" + error.message + ")");
      }
      return () => {
        if (typeof dispose === "function") {
          try {
            dispose();
          } catch {
          }
        }
      };
    });
  };
  if (typeof ctx.inject === "function") ctx.inject(["webServer"], mount);
  else mount(ctx);
}
export {
  apply,
  name
};
