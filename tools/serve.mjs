// Dev server. `python3 -m http.server` sends only Last-Modified, so browsers
// apply heuristic freshness and can serve a stale ES module next to a fresh
// one. That surfaces as "The requested module ... does not provide an export
// named ..." while the file on disk is perfectly correct, and it costs more
// debugging time than the whole feature.
//
// This serves every file with no-store. No dependencies, same as the game.
//
//   node tools/serve.mjs [root] [port]
//
// Defaults to the repository root on 5173.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = resolve(process.argv[2] ?? '.');
const port = Number(process.argv[3] ?? 5173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ogg': 'audio/ogg',
  '.md': 'text/markdown; charset=utf-8',
};

const send = (response, status, headers, body) => {
  response.writeHead(status, { 'Cache-Control': 'no-store, must-revalidate', ...headers });
  response.end(body);
};

createServer(async (request, response) => {
  let path;
  try { path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { send(response, 400, { 'Content-Type': 'text/plain' }, 'Bad request'); return; }
  if (path.endsWith('/')) path += 'index.html';

  const file = resolve(root, `.${path}`);
  // Never serve outside the root, whatever the path says.
  if (file !== root && !file.startsWith(root + sep)) {
    send(response, 403, { 'Content-Type': 'text/plain' }, 'Forbidden');
    return;
  }

  try {
    if (!(await stat(file)).isFile()) throw Error('not a file');
    const body = await readFile(file);
    send(response, 200, {
      'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
      'Content-Length': body.length,
    }, body);
  } catch {
    send(response, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Discord Survivors — http://127.0.0.1:${port}`);
  console.log(`root ${root} · no-store on every response`);
});
