// Records the Groundhog Vault UI through Chrome's debugging protocol as per-shot JPEG
// frame sequences plus a screenshot of the real Base Sepolia receipt. The Remotion
// project under video/ assembles the shots into the demo.
//
// Usage: start the app, launch Chrome with --remote-debugging-port, then
//   CDP_ORIGIN=http://127.0.0.1:9227 APP_URL=http://127.0.0.1:4190 FRAME_DIR=/tmp/frames node scripts/demo-driver.mjs
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";

const cdpOrigin = process.env.CDP_ORIGIN || "http://127.0.0.1:9227";
const appUrl = process.env.APP_URL || "http://127.0.0.1:4173";
const output = process.env.FRAME_DIR || "/tmp/groundhog-demo-frames";
const receiptTx = process.env.RECEIPT_TX || "0x532481c39d68fedb7d102407ee819cc19478bcd02ee7bc614ffb8508ad66e0e9";
const recorder = process.env.RECORDER || "0xD9a1048f900E57C0C320eF11eFfAF725d1a9353f";
const targetFps = Number(process.env.CAPTURE_FPS || 12);

const target = await fetch(`${cdpOrigin}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" }).then((r) => r.json());
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

const send = (method, params = {}) => {
  const id = ++requestId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
};
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const evaluate = (expression) => send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
const click = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
async function waitFor(expression, timeout = 15_000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const result = await evaluate(expression);
    if (result.result.value) return;
    await pause(100);
  }
  throw new Error(`Timed out waiting for ${expression}`);
}

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: appUrl });
await waitFor("document.readyState === 'complete'");
await evaluate("window.localStorage.clear()");
await send("Page.navigate", { url: appUrl });
await waitFor("document.readyState === 'complete'");
await pause(800);

// ---- frame capture: one directory per shot, timestamps recorded for accurate pacing
const shots = {};
let shot = null;
let recording = true;
const capture = (async () => {
  while (recording) {
    const started = Date.now();
    if (shot) {
      const screenshot = await send("Page.captureScreenshot", { format: "jpeg", quality: 92, fromSurface: true });
      const entry = shots[shot];
      entry.frames += 1;
      const file = `${output}/${shot}/${String(entry.frames).padStart(6, "0")}.jpg`;
      await writeFile(file, Buffer.from(screenshot.data, "base64"));
      entry.timestamps.push(Date.now() - entry.startedAt);
    }
    const spent = Date.now() - started;
    await pause(Math.max(0, 1000 / targetFps - spent));
  }
})();
async function beginShot(name) {
  await mkdir(`${output}/${name}`, { recursive: true });
  shots[name] = { frames: 0, timestamps: [], startedAt: Date.now() };
  shot = name;
}
const endShot = () => { shot = null; };

// ---- A: landing
await beginShot("landing");
await pause(2500);
await click("#enter-arena");
await pause(2500);
endShot();

// ---- B: life one
await beginShot("life1");
await pause(600);
await click("#advance-life");
await waitFor("document.body.dataset.step === 'life-one'");
await pause(4500);
endShot();

// ---- C: destroy runtimes
await beginShot("destroy");
await pause(400);
await click("#advance-life");
await waitFor("document.body.dataset.step === 'ready-two'");
await pause(3500);
endShot();

// ---- D: life two
await beginShot("life2");
await pause(400);
await click("#advance-life");
await waitFor("document.body.dataset.step === 'life-two'");
await pause(3500);
await evaluate("document.querySelector('#memory-lift').scrollIntoView({block:'center', behavior:'smooth'})");
await pause(4000);
endShot();

// ---- E: evidence
await beginShot("evidence");
await click("[data-screen-target='evidence']");
await pause(5500);
endShot();

// ---- F: treasury workflow
await beginShot("treasury");
await click("[data-screen-target='treasury']");
await pause(2000);
await evaluate("document.querySelector('#incident-form').requestSubmit()");
await waitFor("document.querySelector('#incident-status').classList.contains('is-success')");
await pause(3000);
await evaluate("document.querySelector('#proposal-form').requestSubmit()");
await waitFor("document.querySelector('#proposal-status').classList.contains('is-success')");
await pause(1500);
await evaluate("document.querySelector('.decision-receipt').scrollIntoView({block:'center', behavior:'smooth'})");
await pause(4000);
endShot();

// ---- G: Base receipt. Headless Chrome has no wallet extension, so an EIP-1193 provider
// is injected that replays the real, already-confirmed receipt transaction. The UI states
// and the linked transaction are the genuine ones.
await evaluate(`(() => {
  const accounts = [${JSON.stringify(recorder)}];
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  window.ethereum = {
    isMetaMask: true,
    async request({ method }) {
      if (method === "eth_requestAccounts" || method === "eth_accounts") { await delay(700); return accounts; }
      if (method === "eth_chainId") return "0x14a34";
      if (method === "wallet_switchEthereumChain") return null;
      if (method === "eth_sendTransaction") { await delay(2600); return ${JSON.stringify(receiptTx)}; }
      if (method === "eth_getTransactionReceipt") { await delay(1200); return { status: "0x1", transactionHash: ${JSON.stringify(receiptTx)} }; }
      throw new Error("unsupported " + method);
    },
  };
  return true;
})()`);
await beginShot("base");
await evaluate("document.querySelector('.base-receipt').scrollIntoView({block:'center', behavior:'smooth'})");
await pause(1800);
await click("#record-base");
await waitFor("document.querySelector('#base-status').textContent.includes('confirmed on Base Sepolia')", 30_000);
await pause(3500);
endShot();

// ---- H: production boundary
await beginShot("production");
await click("[data-screen-target='production']");
await pause(4500);
endShot();

recording = false;
await capture;

// ---- real receipt on the explorer
await send("Page.navigate", { url: `https://base-sepolia.blockscout.com/tx/${receiptTx}` });
await waitFor("document.readyState === 'complete'", 40_000);
await pause(6000);
const explorer = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
await writeFile(`${output}/explorer.png`, Buffer.from(explorer.data, "base64"));

await writeFile(`${output}/shots.json`, JSON.stringify(shots, null, 2));
socket.close();
process.stdout.write(JSON.stringify(Object.fromEntries(Object.entries(shots).map(([k, v]) => [k, { frames: v.frames, ms: v.timestamps.at(-1) }]))));
