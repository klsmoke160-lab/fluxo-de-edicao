// Renderiza uma cena (pasta com index.html que expõe window.renderFrame(t) e window.DURACAO).
// Uso:
//   node render.cjs <pasta> quadros 1,5,8        -> PNGs em saida/<pasta>/
//   node render.cjs <pasta> video [fps]          -> saida/<pasta>.mp4 (sem áudio)
const http = require('http'), fs = require('fs'), path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const raiz = __dirname;
const [pasta, modo = 'video', arg] = process.argv.slice(2);
if (!pasta) { console.error('Falta a pasta da cena.'); process.exit(1); }
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' };

const servidor = http.createServer((req, res) => {
  const p = path.normalize(path.join(raiz, decodeURIComponent(req.url.split('?')[0])));
  if (!p.startsWith(raiz)) { res.writeHead(403).end(); return; }
  fs.readFile(p, (e, dados) => {
    if (e) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(p)] || 'application/octet-stream' }).end(dados);
  });
});

(async () => {
  await new Promise(r => servidor.listen(0, '127.0.0.1', r));
  const porta = servidor.address().port;
  const navegador = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pagina = await navegador.newPage({ viewport: { width: 720, height: 1280 }, deviceScaleFactor: 1 });
  pagina.on('console', m => { if (m.type() === 'error') console.error('[página]', m.text()); });
  pagina.on('pageerror', e => console.error('[erro na página]', e.message));
  await pagina.goto(`http://127.0.0.1:${porta}/${pasta}/index.html`);
  await pagina.waitForFunction('window.pronto === true', null, { timeout: 60000 });
  const duracao = await pagina.evaluate('window.DURACAO');
  const quadro = t => pagina.evaluate(t => new Promise(r => { window.renderFrame(t); requestAnimationFrame(() => requestAnimationFrame(r)); }), t);
  const recorte = { x: 0, y: 0, width: 720, height: 1280 };
  const saida = path.join(raiz, 'saida'); fs.mkdirSync(saida, { recursive: true });

  if (modo === 'quadros') {
    const dir = path.join(saida, pasta); fs.mkdirSync(dir, { recursive: true });
    for (const t of arg.split(',').map(Number)) {
      await quadro(t);
      const f = path.join(dir, `q_${t.toFixed(2).padStart(6, '0')}.png`);
      await pagina.screenshot({ path: f, clip: recorte });
      console.log(f);
    }
  } else {
    const fps = Number(arg) || 30, total = Math.round(duracao * fps);
    const arquivo = path.join(saida, `${pasta}.mp4`);
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', arquivo], { stdio: ['pipe', 'inherit', 'inherit'] });
    const inicio = Date.now();
    for (let i = 0; i < total; i++) {
      await quadro(i / fps);
      const img = await pagina.screenshot({ type: 'jpeg', quality: 95, clip: recorte });
      if (!ff.stdin.write(img)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 60 === 0) console.log(`quadro ${i}/${total}`);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
    console.log(`${arquivo} (${total} quadros, ${((Date.now() - inicio) / 1000).toFixed(0)} s)`);
  }
  await navegador.close(); servidor.close();
})().catch(e => { console.error(e); process.exit(1); });
