import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";

const cdpOrigin = process.env.CDP_ORIGIN || "http://127.0.0.1:9227";
const appUrl = process.env.APP_URL || "http://127.0.0.1:4173";
const output = process.env.FRAME_DIR || "/tmp/groundhog-demo-frames";

const target = await fetch(`${cdpOrigin}/json/new?${encodeURIComponent(appUrl)}`, { method: "PUT" }).then((response) => response.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
let requestId = 0;

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

function send(method, params = {}) {
  const id = ++requestId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

function pause(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function evaluate(expression) {
  return send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
}

async function click(selector) {
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
}

async function waitFor(expression, timeout = 10_000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const result = await evaluate(expression);
    if (result.result.value) return;
    await pause(100);
  }
  throw new Error(`Timed out waiting for ${expression}`);
}

await mkdir(output, { recursive: true });
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Page.navigate", { url: appUrl });
await waitFor("document.readyState === 'complete'");
await pause(1200);

let frame = 0;
let recording = true;
const capture = (async () => {
  while (recording) {
    const screenshot = await send("Page.captureScreenshot", { format: "jpeg", quality: 88, fromSurface: true });
    frame += 1;
    await writeFile(`${output}/${String(frame).padStart(6, "0")}.jpg`, Buffer.from(screenshot.data, "base64"));
    await pause(100);
  }
})();

await pause(3500);
await click("#enter-arena");
await pause(3000);
await click("#advance-life");
await waitFor("document.body.dataset.step === 'life-one'");
await pause(5000);
await click("#advance-life");
await waitFor("document.body.dataset.step === 'ready-two'");
await pause(2500);
await click("#advance-life");
await waitFor("document.body.dataset.step === 'life-two'");
await pause(5500);
await click("[data-screen-target='evidence']");
await pause(5000);
await click("[data-screen-target='treasury']");
await pause(3500);
await evaluate("document.querySelector('#incident-form').requestSubmit()");
await waitFor("document.querySelector('#incident-status').classList.contains('is-success')");
await pause(4500);
await evaluate("document.querySelector('#proposal-form').requestSubmit()");
await waitFor("document.querySelector('#proposal-status').classList.contains('is-success')");
await pause(5500);
await evaluate("document.querySelector('.decision-receipt').scrollIntoView({block:'center'})");
await pause(4500);
await click("[data-screen-target='production']");
await pause(5500);

recording = false;
await capture;
socket.close();
process.stdout.write(JSON.stringify({ frames: frame, output }));
