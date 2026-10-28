// Optional dependency-free browser harness using Node's built-in WebSocket.
import { spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function openChromium() {
  if (!process.env.CHROMIUM_PATH) throw Error('Set CHROMIUM_PATH to an existing Chromium executable. No browser is installed by this test.');
  const scratch = await mkdtemp(join(tmpdir(), 'narrative-browser-'));
  console.log(`Browser scratch: ${scratch}`);
  const child = spawn(process.env.CHROMIUM_PATH, ['--headless', '--disable-dev-shm-usage', '--remote-debugging-port=0', `--user-data-dir=${scratch}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let socket;
  try {
    const address = await new Promise((resolve, reject) => {
      let output = '';
      const timeout = setTimeout(() => reject(Error(`Chromium startup timeout: ${output.slice(-1000)}`)), 10000);
      child.on('error', error => { clearTimeout(timeout); reject(error); });
      child.on('exit', code => { clearTimeout(timeout); reject(Error(`Chromium exited ${code}: ${output.slice(-1000)}`)); });
      child.stderr.on('data', chunk => {
        output += chunk;
        const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
        if (match) { clearTimeout(timeout); resolve(match[1]); }
      });
    });
    socket = new WebSocket(address);
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
    let serial = 0;
    const pending = new Map(), errors = [];
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const item = pending.get(message.id);
        if (!item) return;
        pending.delete(message.id); clearTimeout(item.timer);
        if (message.error) item.reject(Error(message.error.message)); else item.resolve(message.result);
      }
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
    });
    const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
      const id = ++serial;
      const timer = setTimeout(() => { pending.delete(id); reject(Error(`CDP timeout: ${method}`)); }, 10000);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
    const target = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
    const page = (method, params) => send(method, params, sessionId);
    await page('Runtime.enable'); await page('Page.enable');
    const evaluate = async expression => {
      const result = await page('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
      return result.result.value;
    };
    return {
      scratch, errors, page, evaluate,
      async navigate(url) { await page('Page.navigate', { url }); },
      async wait(expression) {
        for (let i = 0; i < 100; i++) {
          if (await evaluate(expression)) return;
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        throw Error(`Browser condition timed out: ${expression}`);
      },
      async close() { try { await send('Browser.close'); } catch { child.kill(); } finally { socket.close(); } },
    };
  } catch (error) { socket?.close(); child.kill(); throw error; }
}
