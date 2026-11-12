// Turno da Noite · motor dos episódios
// Lê episodios/<ep>.json (as tomadas) e saida/<ep>/timeline.json (os tempos, gerados pelo montar.py)
// e expõe window.renderFrame(t): um quadro exato para cada instante.
import * as THREE from 'three';

const W = 720, H = 1280;
const epId = new URLSearchParams(location.search).get('ep') || 'ep01';
const [EP, TL] = await Promise.all([
  fetch(`/episodios/${epId}.json`).then(r => r.json()),
  fetch(`/saida/${epId}/timeline.json`).then(r => r.json()),
]);
await Promise.all(['600', '800', '900'].map(p => document.fonts.load(`${p} 40px Montserrat`)));

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b1026);
const cam = new THREE.PerspectiveCamera(60, W / H, 0.05, 60);

// ---------- utilidades ----------
function rng(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const clamp01 = x => Math.min(1, Math.max(0, x));
const ss = (a, b, t) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const lerp = (a, b, k) => a + (b - a) * k;
const L = c => new THREE.MeshLambertMaterial({ color: c });
const B = c => new THREE.MeshBasicMaterial({ color: c });
function box(w, h, d, mat, x, y, z, parent = scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); parent.add(m); return m;
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.userData = { c, g }; return t;
}

// ---------- loja ----------
// Sala: x de -6 a 6, z de -7 (fundo) a 7 (frente, com a vitrine), altura 3.
const pisoTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#b7b1a2'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#aaa494'; g.fillRect(0, 0, w / 2, h / 2); g.fillRect(w / 2, h / 2, w / 2, h / 2);
  g.strokeStyle = '#8f8a7c'; g.lineWidth = 3; g.strokeRect(0, 0, w, h); g.strokeRect(0, 0, w / 2, h / 2); g.strokeRect(w / 2, h / 2, w / 2, h / 2);
});
pisoTex.wrapS = pisoTex.wrapT = THREE.RepeatWrapping; pisoTex.repeat.set(8, 9);
const piso = new THREE.Mesh(new THREE.PlaneGeometry(12, 14), new THREE.MeshLambertMaterial({ map: pisoTex }));
piso.rotation.x = -Math.PI / 2; scene.add(piso);

const parede = L(0xd8d0bb), faixa = L(0x2f7f7a), teto = L(0x7e828c);
box(12, 3, 0.1, parede, 0, 1.5, -7.05); box(0.1, 3, 14, parede, -6.05, 1.5, 0);
box(0.1, 3, 14, parede, 6.05, 1.5, 0); box(12, 3, 0.1, parede, 0, 1.5, 7.05);
box(12, 0.1, 14, teto, 0, 3.05, 0);
box(12, 0.5, 0.04, faixa, 0, 2.55, -6.98); box(0.04, 0.5, 14, faixa, -5.98, 2.55, 0);
box(0.04, 0.5, 14, faixa, 5.98, 2.55, 0); box(12, 0.5, 0.04, faixa, 0, 2.55, 6.98);

const ruaTex = canvasTex(1024, 320, (g, w, h) => {
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#080d24'); grad.addColorStop(1, '#141b3d');
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
  const r = rng(7);
  for (let i = 0; i < 9; i++) {
    const bw = 70 + r() * 90, bh = 90 + r() * 170, bx = i * 118 + r() * 30;
    g.fillStyle = '#0c1230'; g.fillRect(bx, h - 60 - bh, bw, bh);
    for (let k = 0; k < 7; k++) if (r() > 0.55) {
      g.fillStyle = r() > 0.5 ? '#f3c96a' : '#9fb4d8';
      g.fillRect(bx + 10 + r() * (bw - 26), h - 70 - r() * (bh - 24), 9, 12);
    }
  }
  g.fillStyle = '#0a0e22'; g.fillRect(0, h - 60, w, 60);
  for (const px of [230, 760]) {
    const glow = g.createRadialGradient(px, 96, 2, px, 96, 150);
    glow.addColorStop(0, 'rgba(255,214,140,.95)'); glow.addColorStop(0.12, 'rgba(255,196,110,.45)'); glow.addColorStop(1, 'rgba(255,190,100,0)');
    g.fillStyle = glow; g.fillRect(px - 160, 0, 320, h);
    g.fillStyle = '#05070f'; g.fillRect(px - 3, 96, 6, h);
  }
});
const vitrine = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 1.9), new THREE.MeshBasicMaterial({ map: ruaTex }));
vitrine.position.set(-1.9, 1.55, 6.98); vitrine.rotation.y = Math.PI; scene.add(vitrine);
const moldura = L(0xeeeae0);
for (const x of [-5.6, -3.75, -1.9, -0.05, 1.8]) box(0.08, 1.9, 0.08, moldura, x, 1.55, 6.96);
box(7.5, 0.08, 0.08, moldura, -1.9, 0.6, 6.96); box(7.5, 0.08, 0.08, moldura, -1.9, 2.5, 6.96);
const porta = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.25), B(0x0c1230));
porta.position.set(2.75, 1.125, 6.98); porta.rotation.y = Math.PI; scene.add(porta);
for (const x of [2.08, 3.42]) box(0.08, 2.3, 0.08, moldura, x, 1.15, 6.96);
box(1.42, 0.08, 0.08, moldura, 2.75, 2.3, 6.96);
box(0.05, 0.4, 0.05, L(0x9aa0aa), 3.2, 1.1, 6.93);

// Luz
const lampOn = new THREE.Color(0xf4fbff), lampOff = new THREE.Color(0x30343d);
const lampadas = {}, luz = {};
function lampada(nome, x, z, emZ, comp) {
  lampadas[nome] = box(emZ ? 0.24 : comp, 0.05, emZ ? comp : 0.24, B(0xf4fbff), x, 2.97, z);
  box(emZ ? 0.34 : comp + 0.1, 0.03, emZ ? comp + 0.1 : 0.34, L(0x5d626c), x, 2.995, z);
}
lampada('c1', -3.55, -3, true, 4.6); lampada('c2', 0, -3, true, 4.6); lampada('c3', 2.9, -3, true, 4.6);
lampada('f1', -2.2, 4.2, false, 3.2); lampada('f2', 3.6, 4.4, false, 2.6);
const ambiente = new THREE.AmbientLight(0xc9d6f0, 0.8); scene.add(ambiente);
const hemi = new THREE.HemisphereLight(0xdfe9ff, 0x6f6a60, 0.4); scene.add(hemi);
function ponto(nome, x, y, z, i) { const p = new THREE.PointLight(0xf0f6ff, i, 0, 1.6); p.position.set(x, y, z); p.userData.base = i; scene.add(p); luz[nome] = p; }
ponto('c1', -3.55, 2.7, -3, 9); ponto('c2', 0, 2.7, -3, 9); ponto('c3', 2.9, 2.7, -3, 9);
ponto('f1', -2.2, 2.7, 4.2, 8); ponto('f2', 3.9, 2.6, 4.4, 9);
const lanterna = new THREE.SpotLight(0xfff0cc, 0, 16, 0.42, 0.55, 1.1); scene.add(lanterna); scene.add(lanterna.target);
const dimEl = document.getElementById('dim');
const MODOS = { normal: { geral: 1 }, meia: { geral: 0.58 }, escuro: { geral: 0.2, lanterna: 46 } };
function setLuz({ geral = 1, c3 = true, lanterna: lant = 0, dim = 0 } = {}) {
  ambiente.intensity = 0.8 * geral; hemi.intensity = 0.4 * geral;
  for (const n in luz) luz[n].intensity = luz[n].userData.base * geral * (n === 'c3' && !c3 ? 0 : 1);
  for (const n in lampadas) lampadas[n].material.color.copy(n === 'c3' && !c3 ? lampOff : lampOn).multiplyScalar(n === 'c3' && !c3 ? 1 : lerp(0.3, 1, geral));
  lanterna.intensity = lant; dimEl.style.opacity = dim;
}

// Gôndolas e produtos (os do corredor 3 ficam separados, para virarem velas no EP 02)
const prodPaleta = [0xd8402f, 0xf2b632, 0x2f6fb5, 0x3f9a58, 0xe8772e, 0xf1ece0, 0x7a4fa3, 0x29a6a6, 0xd9628f];
const prodsGeral = [], prodsC3 = [], velasPos = [];
const r1 = rng(42);
const gondMat = L(0x4b5565), prat = L(0xd6dbe2);
function gondola(x, lados) {
  box(0.5, 1.85, 6, gondMat, x, 0.925, -3);
  box(0.9, 0.12, 6.05, L(0x3a4352), x, 0.06, -3);
  box(0.9, 1.85, 0.08, L(0x596375), x, 0.925, 0.02);
  for (const s of lados) for (const y of [0.3, 0.72, 1.14, 1.56]) {
    box(0.26, 0.03, 6, prat, x + s * 0.36, y, -3);
    const noC3 = Math.abs(x + s * 0.37 - 2.9) < 1.2;
    for (let z = -5.85; z < -0.1; z += 0.27) {
      if (noC3) for (const dz of [0, 0.09, 0.18]) velasPos.push({ x: x + s * 0.37, y: y + 0.015 + 0.11, z: z + dz });
      if (r1() < 0.07) continue;
      const w = 0.15 + r1() * 0.07, h = 0.16 + r1() * 0.16, d = 0.16 + r1() * 0.07;
      (noC3 ? prodsC3 : prodsGeral).push({ x: x + s * 0.37, y: y + 0.015 + h / 2, z: z + r1() * 0.04, w, h, d, c: prodPaleta[Math.floor(r1() * prodPaleta.length)] });
    }
  }
}
gondola(-5.6, [1]); gondola(-1.5, [-1, 1]); gondola(1.5, [-1, 1]); gondola(4.3, [-1]);
box(0.12, 1.5, 2.6, L(0x3b4250), 5.93, 1.65, 4.5);
for (const y of [1.0, 1.35, 1.7, 2.05]) {
  box(0.22, 0.03, 2.6, prat, 5.8, y, 4.5);
  for (let z = 3.3; z < 5.75; z += 0.16) {
    const h = 0.14 + r1() * 0.1;
    prodsGeral.push({ x: 5.8, y: y + 0.015 + h / 2, z, w: 0.12, h, d: 0.11, c: prodPaleta[Math.floor(r1() * prodPaleta.length)] });
  }
}
function instanciar(lista) {
  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), lista.length);
  const m = new THREE.Matrix4(), c = new THREE.Color();
  lista.forEach((p, i) => { m.makeScale(p.w, p.h, p.d).setPosition(p.x, p.y, p.z); inst.setMatrixAt(i, m); inst.setColorAt(i, c.setHex(p.c)); });
  scene.add(inst); return inst;
}
instanciar(prodsGeral);
const instC3 = instanciar(prodsC3);
const instVelas = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.032, 0.032, 0.2, 10), L(0xefe6cf), velasPos.length);
const instChamas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.022, 8, 8), B(0xffc24d), velasPos.length);
{ const m = new THREE.Matrix4(); velasPos.forEach((p, i) => { m.makeTranslation(p.x, p.y - 0.01, p.z); instVelas.setMatrixAt(i, m); m.makeScale(1, 1.7, 1).setPosition(p.x, p.y + 0.125, p.z); instChamas.setMatrixAt(i, m); }); scene.add(instVelas); scene.add(instChamas); }

const placas = {};
function placa(n, x) {
  const t = canvasTex(512, 200, (g, w, h) => {
    g.fillStyle = '#1f5fa8'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#fff'; g.lineWidth = 10; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#fff'; g.font = '900 64px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('CORREDOR ' + n, w / 2, h / 2 + 4);
  });
  const grp = new THREE.Group();
  for (const lado of [0, Math.PI]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.45), new THREE.MeshBasicMaterial({ map: t }));
    m.position.set(x, 2.5, 0.35); m.rotation.y = lado; grp.add(m);
  }
  box(0.02, 0.3, 0.02, L(0x8a8f99), x - 0.45, 2.86, 0.35, grp); box(0.02, 0.3, 0.02, L(0x8a8f99), x + 0.45, 2.86, 0.35, grp);
  scene.add(grp); placas[n] = grp;
}
placa(1, -3.55); placa(2, 0); placa(3, 2.9);
// A parede que existe no lugar do corredor 3 (EP 04)
const paredeNova = new THREE.Group();
box(2.9, 3, 7.1, parede, 3.4, 1.5, -3.5, paredeNova); box(2.9, 0.5, 0.04, faixa, 3.4, 2.55, 0.07, paredeNova);
scene.add(paredeNova);
function setLayout({ c3 = true, velas = false } = {}) {
  paredeNova.visible = !c3; placas[3].visible = c3;
  instC3.visible = !velas; instVelas.visible = velas; instChamas.visible = velas;
}

// Balcão, registradora, cupom, campainha, monitor
box(0.8, 0.95, 2.4, L(0x8a5a3a), 3.8, 0.475, 4.5);
box(0.92, 0.06, 2.5, L(0xcaa57a), 3.8, 0.98, 4.5);
const registradora = new THREE.Group(); scene.add(registradora);
box(0.36, 0.3, 0.44, L(0x2a2d36), 3.82, 1.16, 3.95, registradora);
const visorTex = canvasTex(600, 520, () => {});
const visor = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.26), new THREE.MeshBasicMaterial({ map: visorTex }));
visor.position.set(4.004, 1.17, 3.95); visor.rotation.y = Math.PI / 2; registradora.add(visor);
let visorChave = '';
function desenharVisor(linhas) {
  const chave = linhas.join('|'); if (chave === visorChave) return; visorChave = chave;
  const { g } = visorTex.userData;
  g.fillStyle = '#0a1711'; g.fillRect(0, 0, 600, 520);
  g.strokeStyle = '#1d3b2c'; g.lineWidth = 8; g.strokeRect(8, 8, 584, 504);
  g.fillStyle = '#7dffb0'; g.textBaseline = 'top'; g.textAlign = 'left';
  g.font = '800 30px Montserrat'; g.fillText('CAIXA 01', 34, 30);
  linhas.forEach((l, i) => { g.font = '900 46px Montserrat'; g.fillText(l, 34, 110 + i * 78); });
  visorTex.needsUpdate = true;
}
desenharVisor([]);
const cupomTex = canvasTex(400, 640, (g, w, h) => {
  g.fillStyle = '#f7f4ea'; g.fillRect(0, 0, w, h); g.fillStyle = '#1c1c1c'; g.textAlign = 'center'; g.textBaseline = 'top';
  g.font = '900 30px Montserrat'; g.fillText('MERCADINHO 24H', w / 2, 26);
  g.font = '800 22px Montserrat'; g.fillText('- - - - - - - - - - - - - -', w / 2, 70);
  g.textAlign = 'left'; g.font = '800 25px Montserrat';
  [['1x VELA', '4,50'], ['1x FÓSFORO', '2,00'], ['1x SAL GROSSO', '6,90']].forEach(([a, b], i) => { g.textAlign = 'left'; g.fillText(a, 30, 118 + i * 44); g.textAlign = 'right'; g.fillText(b, w - 30, 118 + i * 44); });
  g.textAlign = 'center'; g.font = '800 22px Montserrat'; g.fillText('- - - - - - - - - - - - - -', w / 2, 256);
  g.font = '900 34px Montserrat'; g.fillText('TOTAL: 3 ITENS', w / 2, 300);
  g.font = '900 50px Montserrat'; g.fillText('OBRIGADO,', w / 2, 410); g.fillText('DAVI.', w / 2, 476);
});
const cupom = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.32), new THREE.MeshBasicMaterial({ map: cupomTex }));
cupom.rotation.y = Math.PI / 2; scene.add(cupom);
const campainha = new THREE.Group(); campainha.position.set(3.55, 1.01, 4.62); scene.add(campainha);
{
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.02, 24), L(0x2a2d36)); base.position.y = 0.01; campainha.add(base);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.07, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xd9dde4, emissive: 0x30343a }));
  dome.position.y = 0.02; campainha.add(dome); campainha.userData.dome = dome;
  const pino = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 10), L(0x8a8f99)); pino.position.y = 0.1; campainha.add(pino); campainha.userData.pino = pino;
}

const rt = new THREE.WebGLRenderTarget(512, 420);
const camSeg = new THREE.PerspectiveCamera(92, 512 / 420, 0.1, 40);
camSeg.position.set(2.9, 2.8, -0.15); camSeg.lookAt(2.9, 0.4, -4.4);
const telaMat = new THREE.ShaderMaterial({
  uniforms: { map: { value: rt.texture }, falha: { value: 0 }, tempo: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D map; uniform float falha; uniform float tempo; varying vec2 vUv;
    float h(float n){ return fract(sin(n*91.7)*4375.5); }
    void main(){
      vec2 c = vUv - 0.5; float r2 = dot(c,c);
      vec2 uv = 0.5 + c*(0.82 + 0.5*r2);
      float linha = floor(uv.y*40.0);
      uv.x += falha * (h(linha + floor(tempo*30.0)) - 0.5) * 0.22;
      vec3 col = texture2D(map, uv).rgb;
      float g = dot(col, vec3(.299,.587,.114));
      col = mix(vec3(g), col, 0.22) * vec3(0.72, 1.0, 0.86) * 1.15;
      col *= 0.86 + 0.14*sin(vUv.y*330.0);
      col *= 1.0 - 1.9*r2;
      col += falha * 0.12 * h(linha*3.1 + tempo);
      gl_FragColor = vec4(col, 1.0);
      #include <colorspace_fragment>
    }`
});
const monitor = new THREE.Group(); monitor.position.set(3.8, 1.25, 5.25);
box(0.54, 0.47, 0.42, L(0xcfc8b6), 0, 0, 0, monitor); box(0.3, 0.05, 0.3, L(0xb5ae9c), 0, -0.25, 0, monitor);
{ const b = new THREE.Mesh(new THREE.PlaneGeometry(0.49, 0.41), B(0x15171c)); b.position.z = 0.2105; monitor.add(b); }
{ const t = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.36), telaMat); t.position.z = 0.212; monitor.add(t); }
const osdTex = canvasTex(512, 420, () => {});
{ const o = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.36), new THREE.MeshBasicMaterial({ map: osdTex, transparent: true })); o.position.z = 0.2135; monitor.add(o); }
let osdChave = '';
function desenharOSD(hora) {
  if (hora === osdChave) return; osdChave = hora;
  const { g } = osdTex.userData; g.clearRect(0, 0, 512, 420);
  g.font = '800 26px Montserrat'; g.fillStyle = 'rgba(235,255,240,.92)'; g.textBaseline = 'top';
  g.textAlign = 'left'; g.fillText('CAM 03 · CORREDOR 3', 26, 22); g.fillText('REC', 60, 372);
  g.textAlign = 'right'; g.fillText(hora, 486, 372);
  g.fillStyle = '#ff4040'; g.beginPath(); g.arc(40, 386, 9, 0, 7); g.fill();
  osdTex.needsUpdate = true;
}
scene.add(monitor); monitor.lookAt(4.75, 1.62, 4.5);

// ---------- personagens ----------
function personagem(o) {
  const g = new THREE.Group();
  const pele = L(o.pele), camisa = L(o.camisa), calca = L(o.calca), traco = B(0x16110f);
  const cap = (r, l, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 8, 20), m);
  const pernas = [], bracos = []; let fone = null;
  for (const s of [-1, 1]) {
    const perna = new THREE.Group(); perna.position.set(s * 0.1, 0.78, 0); g.add(perna); pernas.push(perna);
    const coxa = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.74, 16), calca); coxa.position.y = -0.37; perna.add(coxa);
    const pe = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), L(o.sapato ?? 0x17171c)); pe.scale.set(0.95, 0.6, 1.5); pe.position.set(0, -0.72, 0.04); perna.add(pe);
    const braco = new THREE.Group(); braco.position.set(s * 0.275, 1.31, 0); g.add(braco); bracos.push(braco);
    const manga = cap(0.062, 0.4, camisa); manga.position.y = -0.21; braco.add(manga);
    const mao = new THREE.Mesh(new THREE.SphereGeometry(0.068, 16, 12), pele); mao.position.y = -0.5; braco.add(mao);
    if (s === 1) { fone = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.15, 0.08), B(0x121316)); fone.position.set(-0.07, -0.5, 0); braco.add(fone); }
  }
  const tronco = cap(0.2, 0.4, camisa); tronco.scale.set(1.08, 1, 0.85); tronco.position.y = 1.1; g.add(tronco);
  if (o.cracha) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.045, 0.01), B(0xf4f1e8)); c.position.set(0.09, 1.3, 0.166); g.add(c); }
  const sombra = new THREE.Mesh(new THREE.CircleGeometry(0.34, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 }));
  sombra.rotation.x = -Math.PI / 2; sombra.position.y = 0.012; g.add(sombra);
  const cabeca = new THREE.Group(); cabeca.position.y = 1.5; g.add(cabeca);
  const cranio = new THREE.Mesh(new THREE.SphereGeometry(0.215, 32, 24), pele); cranio.position.y = 0.19; cabeca.add(cranio);
  const contorno = new THREE.Mesh(new THREE.SphereGeometry(0.215, 32, 24), new THREE.MeshBasicMaterial({ color: 0x16110f, side: THREE.BackSide }));
  contorno.position.y = 0.19; contorno.scale.setScalar(1.075); cabeca.add(contorno);
  const olhos = [], pupilas = []; let boca = null, brilho = null;
  if (o.semRosto) {
    brilho = new THREE.MeshBasicMaterial({ color: 0xf2fff6, transparent: true, opacity: 0 });
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 10), brilho); e.position.set(s * 0.08, 0.215, 0.195); cabeca.add(e); }
  } else {
    const cabelo = new THREE.Mesh(new THREE.SphereGeometry(0.225, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.46), L(o.cabelo));
    cabelo.position.y = 0.195; cabelo.rotation.x = -0.42; cabeca.add(cabelo);
    for (const s of [-1, 1]) {
      const orelha = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 10), pele); orelha.position.set(s * 0.212, 0.16, -0.01); cabeca.add(orelha);
      const olho = new THREE.Group(); olho.position.set(s * 0.083, 0.222, 0.178); cabeca.add(olho);
      const aro = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 16), traco); aro.scale.set(1.07, 1.14, 0.4); aro.position.z = -0.004; olho.add(aro);
      const branco = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 16), B(0xffffff)); branco.scale.set(1, 1.08, 0.45); olho.add(branco);
      const pupila = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), B(0x0b0b0b)); pupila.scale.z = 0.5; pupila.position.z = 0.03; olho.add(pupila);
      olhos.push(olho); pupilas.push(pupila);
    }
    const nariz = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), L(o.nariz ?? o.pele)); nariz.position.set(0, 0.15, 0.214); cabeca.add(nariz);
    if (o.bigode) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), L(o.cabelo)); b.scale.set(1.5, 0.36, 0.5); b.position.set(0, 0.112, 0.2); cabeca.add(b); }
    boca = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), traco); boca.scale.set(1, 0.22, 0.3); boca.position.set(0, o.bigode ? 0.06 : 0.075, 0.196); cabeca.add(boca);
  }
  scene.add(g);
  return { g, cabeca, olhos, pupilas, boca, tronco, pernas, bracos, fone, brilho };
}
const davi = personagem({ pele: 0x8f5d3d, nariz: 0x7f5035, camisa: 0xd8402f, calca: 0x2c3350, cabelo: 0x1b1512, cracha: true });
const cliente = personagem({ pele: 0xc98f66, nariz: 0xb67c56, camisa: 0x2f6fb5, calca: 0x3b3b42, cabelo: 0x9a9a9a, bigode: true });
const vulto = personagem({ pele: 0x17181f, camisa: 0x17181f, calca: 0x121319, sapato: 0x0c0c10, semRosto: true });
vulto.g.scale.set(1, 1.1, 1);
const TODOS = [davi, cliente, vulto];
const PISCADAS = [1.3, 3.9, 6.7, 9.2, 12.4];

function repouso(p) {
  p.g.visible = false; p.g.position.set(0, 0, 0); p.g.rotation.y = 0;
  p.cabeca.rotation.set(0, 0, 0);
  p.pernas.forEach(l => l.rotation.x = 0);
  p.bracos.forEach((b, i) => b.rotation.set(0, 0, (i ? 1 : -1) * 0.1));
  if (p.fone) p.fone.visible = false;
  if (p.brilho) p.brilho.opacity = 0;
}
function por(p, lugar) { p.g.visible = true; p.g.position.set(lugar.x, 0, lugar.z); p.g.rotation.y = lugar.giro; }
function rosto(p, u, { susto = 0, falando = false, olhar = 0 } = {}) {
  if (!p.boca) return;
  let pisca = 0; for (const t of PISCADAS) pisca = Math.max(pisca, 1 - Math.min(1, Math.abs(u - t) / 0.09));
  const ab = 1 + 0.2 * susto;
  for (const o of p.olhos) o.scale.set(ab, ab * (1 - 0.92 * pisca * (1 - susto)), 1);
  for (const q of p.pupilas) q.position.x = olhar;
  let boca = 1 + 3.2 * susto;
  if (falando) boca = 1.4 + 3.4 * Math.abs(Math.sin(u * 17)) * (0.62 + 0.38 * Math.sin(u * 7.3 + 1));
  p.boca.scale.y = 0.22 * boca;
  p.tronco.scale.y = 1 + 0.012 * Math.sin(u * 2.2);
}
function andar(p, fase, forca = 1) {
  const s = Math.sin(fase * Math.PI * 2);
  p.pernas[0].rotation.x = s * 0.55 * forca; p.pernas[1].rotation.x = -s * 0.55 * forca;
  p.bracos[0].rotation.x = -s * 0.4 * forca; p.bracos[1].rotation.x = s * 0.4 * forca;
  p.g.position.y = Math.abs(Math.cos(fase * Math.PI * 2)) * 0.03 * forca;
}
function foneNoOuvido(p) { p.bracos[1].rotation.x = -2.5; p.bracos[1].rotation.z = -0.3; p.fone.visible = true; }

const LUGAR = {
  caixa: { x: 4.78, z: 4.5, giro: -Math.PI / 2 },
  balcao: { x: 2.85, z: 4.5, giro: Math.PI / 2 },
  corredor: { x: 2.9, z: -1.5, giro: Math.PI },
  parede: { x: 3.3, z: 0.78, giro: Math.PI },
};

// ---------- sobreposições (legenda, HUD, celular, cartão final) ----------
const capEl = document.getElementById('cap'), foneEl = document.getElementById('fone'), foneTela = document.getElementById('foneTela'), fimEl = document.getElementById('fim'), hudEl = document.getElementById('hud');
document.querySelector('#hud .l1').textContent = EP.hud[0]; document.getElementById('hud2').textContent = EP.hud[1];
const CORES = { davi: '#ffffff', osmar: '#ffe14d', jair: '#ff9ed1' };
const peleDavi = '#8f5d3d';
for (const d of foneEl.querySelectorAll('.dedo')) d.style.background = peleDavi;
const mmss = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function telaCelular(s, u) {
  if (s.tela === 'mensagem') {
    const bolhas = s.msgs.filter(m => u >= m.em).map(m => {
      const k = ss(m.em, m.em + 0.18, u);
      return `<div class="b ${m.de === 'eu' ? 'eu' : ''}" style="transform:scale(${lerp(0.6, 1, k)});opacity:${k}">${m.txt}<i>${m.hora ?? EP.hud[1].split('· ')[1]}</i></div>`;
    }).join('');
    return `<div class="zap"><div class="topo"><div class="av"></div><div><div class="nome">${s.nome}</div><div class="sub">online</div></div></div><div class="msgs">${bolhas}</div></div>`;
  }
  const fim = s.tela === 'encerrada';
  return `<div class="lig ${fim ? 'fim' : ''}"><div class="av">${s.nome.replace('Seu ', '')[0]}</div><div class="nome">${s.nome}</div>` +
    `<div class="st">${fim ? 'Chamada encerrada' : 'Em chamada'}</div><div class="tempo">${fim ? 'Duração: 00:00' : mmss((s.desde ?? 0) + u)}</div><div class="bt"></div></div>`;
}

// ---------- tomadas ----------
const alvo = new THREE.Vector3();
let mx = 0, my = 0;
function camera(x, y, z, ax, ay, az, fov) { cam.position.set(x + mx, y + my, z); alvo.set(ax, ay, az); cam.fov = fov; }
const povCaixa = [4.66, 1.66, 4.58];

const TOMADAS = {
  // Plano aberto do caixa. olha: 'frente' | 'monitor' | 'vira' (da frente para o monitor)
  caixa_aberto(s, u, d, f) {
    por(davi, LUGAR.caixa);
    const k = s.olha === 'monitor' ? 1 : s.olha === 'vira' ? ss(d * 0.3, d * 0.3 + 0.55, u) : 0;
    davi.cabeca.rotation.y = lerp(-0.5, 0.82, k); davi.cabeca.rotation.x = lerp(0.1, 0, k);
    rosto(davi, u, { falando: f.davi });
    const p = u / d;
    camera(lerp(1.3, 2.0, p), lerp(1.62, 1.55, p), lerp(0.9, 1.9, p), 4.5, 1.22, 4.7, 62);
  },
  // O Davi sai de trás do balcão e vai para o fundo da loja.
  sai_do_caixa(s, u, d, f) {
    const pts = [[4.78, 4.5], [4.78, 3.0], [3.5, 1.6]], k = ss(0.4, d - 0.1, u) * 2;
    const i = Math.min(1, Math.floor(k)), q = Math.min(1, k - i), a = pts[i], b = pts[i + 1];
    por(davi, { x: lerp(a[0], b[0], q), z: lerp(a[1], b[1], q), giro: Math.atan2(b[0] - a[0], b[1] - a[1]) });
    if (u > 0.4) andar(davi, u * 1.9);
    rosto(davi, u, { falando: f.davi });
    camera(0.9, 1.6, 0.7, lerp(4.6, 3.9, u / d), 1.2, lerp(4.4, 3.2, u / d), 62);
  },
  // Câmera na mão, andando. para: 'corredor' | 'caixa'
  pov_anda(s, u, d) {
    const p = ss(0, d, u), bob = Math.abs(Math.sin(u * 5.2)) * 0.035;
    if (s.para === 'caixa') camera(lerp(3.0, 4.5, p), 1.58 + bob, lerp(0.9, 3.3, p), 3.95, 1.2, 5.1, 70);
    else camera(lerp(4.3, 3.05, p), 1.58 + bob, lerp(3.0, 1.5, p), 2.9, lerp(1.9, 1.5, p), -2.5, 72);
  },
  // O monitor visto pelo Davi. O que aparece na tela é decidido em passeMonitor().
  monitor(s, u, d) {
    const p = u / d;
    camera(...povCaixa, 3.82, 1.13, 5.24, lerp(60, s.fecha ?? 45, ss(0, 1, p)));
  },
  // Close de um personagem. lugar, cabeca [de, para], susto [de, para], fone, olhaCima, maoParede, com (outros em cena)
  close(s, u, d, f) {
    const p = s.quem === 'cliente' ? cliente : davi, nome = s.quem === 'cliente' ? 'jair' : 'davi';
    const lug = LUGAR[s.lugar ?? 'caixa'];
    const [c0, c1] = s.cabeca ?? [0, 0], [m0, m1] = s.susto ?? [0, 0];
    const quando = s.vira ?? d * 0.3, k = ss(quando, quando + 0.55, u);
    por(p, { ...lug, giro: lug.giro + (s.torce ?? 0) * k });
    p.cabeca.rotation.y = lerp(c0, c1, k);
    if (s.olhaCima) p.cabeca.rotation.x = -0.5 * ss(0.3, 1.1, u);
    if (s.fone) foneNoOuvido(p);
    if (s.maoParede) { p.bracos[0].rotation.x = -1.42 * ss(0.2, 0.9, u); }
    rosto(p, u, { susto: lerp(m0, m1, k), falando: f[nome], olhar: Math.sign(c1 - c0) * -0.012 * Math.sin(Math.PI * k) });
    for (const o of s.com ?? []) { const q = o === 'cliente' ? cliente : davi; por(q, LUGAR[o === 'cliente' ? 'balcao' : 'caixa']); rosto(q, u, {}); }
    registradora.visible = lug !== LUGAR.caixa;
    const face = lug.giro + (s.torce ?? 0) + c1;
    const ang = s.camAng ?? (lug === LUGAR.caixa ? -2.2 : face + (s.lado ?? 0.55)), dist = s.dist ?? 1.7;
    camera(lug.x + Math.sin(ang) * dist, s.camY ?? 1.5, lug.z + Math.cos(ang) * dist + lerp(0, 0.1, u / d), lug.x, 1.5, lug.z, lerp(50, 45, u / d));
  },
  // O corredor 3 visto de dentro, vazio. pisca: a luz falha.
  corredor3(s, u, d, f, st) {
    const p = u / d;
    camera(2.9, 1.5, lerp(0.1, -1.0, p), 2.9, 1.1, -6, 74); mx *= 2;
    if (s.pisca) {
      const t0 = s.pisca;
      for (const [a, b] of [[0, 0.08], [0.22, 0.4], [0.54, 0.6], [0.85, 1.3]]) if (u >= t0 + a && u < t0 + b) { st.luz.c3 = false; st.luz.geral = 0.42; st.luz.dim = 0.34; }
    }
  },
  // Celular em close (sobreposição). tela: 'mensagem' | 'ligacao' | 'encerrada'
  celular(s, u, d) {
    camera(4.6, 1.62, 4.5, 3.9, 0.95, 4.6, 55);
    foneEl.style.display = 'block'; foneEl.style.transform = `translateY(${Math.sin(u * 1.6) * 6 + (1 - ss(0, 0.35, u)) * 520}px) rotate(${Math.sin(u * 1.1) * 0.6}deg)`;
    foneTela.innerHTML = telaCelular(s, u);
    canvas.style.filter = 'blur(7px) brightness(.55)';
    capEl.style.top = '300px';
  },
  // A registradora em close. itens: [{txt, em}], cupom: o papel sai em `cupom` segundos
  registradora(s, u, d) {
    desenharVisor((s.itens ?? []).filter(i => u >= i.em).map(i => i.txt));
    if (s.cupom != null) {
      const k = ss(s.cupom, s.cupom + 1.6, u);
      cupom.visible = true; cupom.position.set(3.99, 1.31 + lerp(-0.16, 0.16, k), 3.95);
      camera(4.62, 1.5, 3.95, 3.99, 1.44, 3.95, lerp(46, 38, ss(s.cupom, s.cupom + 2.4, u)));
    } else camera(4.7, 1.3, 3.95, 4.0, 1.19, 3.95, lerp(52, 46, u / d));
  },
  // Davi e o cliente, um de cada lado do balcão. cliente: 'entra' | 'parado' | 'sai'
  dois(s, u, d, f) {
    por(davi, LUGAR.caixa); davi.cabeca.rotation.y = s.cliente === 'sai' ? lerp(0, 0.5, ss(1.2, d, u)) : 0; rosto(davi, u, { falando: f.davi, susto: s.susto ?? 0 });
    const porta = { x: 2.75, z: 6.55 }, bal = LUGAR.balcao;
    let k = 1, indo = true;
    if (s.cliente === 'entra') k = ss(0.5, Math.min(d - 0.4, 3.2), u);
    if (s.cliente === 'sai') { k = 1 - ss(s.parte ?? 1.4, d - 0.2, u); indo = false; }
    const andando = k > 0.001 && k < 0.999;
    por(cliente, { x: lerp(porta.x, bal.x, k), z: lerp(porta.z, bal.z, k), giro: andando ? (indo ? Math.PI : 0) : (k >= 0.999 ? bal.giro : 0) });
    if (andando) andar(cliente, u * 1.8);
    rosto(cliente, u, { falando: f.jair });
    camera(3.75, 1.55, lerp(1.35, 1.6, u / d), 3.8, 1.25, 5.2, 75);
  },
  // Do caixa, olhando a placa do corredor n
  placa(s, u, d) {
    const x = { 1: -3.55, 2: 0, 3: 2.9 }[s.n];
    camera(4.6, 1.66, 4.4, x, 2.42, 0.35, lerp(42, 33, ss(0, d, u)));
  },
  // Lanterna na mão. n: 1 | 2 (placas) | 3 (onde o corredor 3 deveria estar)
  lanterna(s, u, d, f, st) {
    const x = { 1: -3.55, 2: 0, 3: 3.3 }[s.n], p = ss(0, d, u), bob = Math.abs(Math.sin(u * 4.6)) * 0.03;
    if (s.n === 3) { camera(x, 1.56 + bob, lerp(3.9, 2.6, p), x, 1.5, 0.05, 66); st.luz.lanterna = 11; }
    else camera(x, 1.56 + bob, lerp(3.4, 2.3, p), x, 2.05, 0.35, 68);
    st.lanterna = true;
  },
  // Do balcão, a loja inteira, vazia.
  pov_loja(s, u, d) {
    const p = ss(0, d, u);
    camera(4.6, 1.66, 4.4, lerp(-3.5, 2.6, p), 1.25, lerp(1.5, -1.5, p), 74);
  },
  // A campainha do balcão toca sozinha em `toca` segundos.
  campainha(s, u, d) {
    por(davi, LUGAR.caixa); davi.cabeca.rotation.y = 0.3; rosto(davi, u, { susto: ss(s.toca, s.toca + 0.2, u) });
    const q = u - s.toca, bate = q >= 0 && q < 0.5 ? Math.exp(-q * 9) : 0;
    campainha.userData.pino.position.y = 0.1 - 0.018 * bate; campainha.userData.dome.scale.y = 1 - 0.14 * bate;
    campainha.position.x = 3.55 + Math.sin(q * 90) * 0.002 * bate;
    camera(lerp(2.75, 2.95, ss(0, d, u)), 1.2, 4.38, 3.55, 1.07, 4.62, lerp(34, 27, ss(0, d, u)));
  },
  // Tela preta com texto.
  preto(s, u) {
    canvas.style.visibility = 'hidden'; hudEl.style.display = 'none';
    fimEl.style.display = 'flex'; fimEl.style.opacity = ss(0.25, 0.8, u);
    fimEl.innerHTML = s.texto + (s.sub ? `<small>${s.sub}</small>` : '');
  },
};

// O que a câmera 3 mostra. Só ela vê o vulto; o Davi nunca aparece nela.
// vulto: 'nenhum' | 'meio' (de costas, parado) | 'vira' | 'perto' | 'anda'
function passeMonitor(s, u, d) {
  TODOS.forEach(repouso);
  setLayout({ c3: true, velas: false });
  const apagou = s.apaga != null && u >= s.apaga;
  setLuz({ geral: apagou ? 0.3 : 1, c3: !apagou });
  const modo = s.vulto ?? 'nenhum';
  if (modo === 'meio') por(vulto, { x: 2.9, z: -4.4, giro: Math.PI });
  if (modo === 'vira') {
    const t0 = s.viraEm ?? d * 0.4, k = ss(t0, t0 + 1.8, u);
    por(vulto, { x: 2.9, z: -4.4, giro: Math.PI * (1 - k) });
    vulto.cabeca.rotation.x = -0.32 * ss(t0 + 1.5, t0 + 2.3, u);
    vulto.brilho.opacity = ss(t0 + 1.7, t0 + 2.2, u);
  }
  if (modo === 'perto') { por(vulto, { x: 2.9, z: -1.9, giro: 0 }); vulto.cabeca.rotation.x = -0.45; vulto.brilho.opacity = 1; }
  if (modo === 'anda') {
    const t0 = s.andaEm ?? 1.2, k = clamp01((u - t0) / (d - t0 - 0.6));
    por(vulto, { x: 2.9, z: lerp(-4.4, 0.9, k), giro: 0 });
    if (k > 0 && k < 1) andar(vulto, (u - t0) * 1.15, 0.7);
    vulto.cabeca.rotation.x = -0.3; vulto.brilho.opacity = 1;
  }
  desenharOSD(s.hora ?? EP.hud[1].split('· ')[1] + ':13');
  renderer.setRenderTarget(rt); renderer.render(scene, camSeg); renderer.setRenderTarget(null);
  telaMat.uniforms.falha.value = (s.falhas ?? []).some(t => u >= t && u < t + 0.15) ? 1 : 0;
}

window.renderFrame = function (t) {
  t = Math.min(t, TL.dur - 1e-4);
  const i = Math.max(0, TL.tomadas.findIndex(x => t >= x.ini && t < x.fim));
  const tl = TL.tomadas[i], s = EP.tomadas[i], u = t - tl.ini, d = tl.fim - tl.ini;
  const falando = {}; let legenda = '', cor = '#fff';
  if (tl.voz && s.fala) {
    if (t >= tl.voz.ini && t < tl.voz.fim) falando[s.fala[0]] = true;
    if (t >= tl.voz.ini - 0.08 && t < tl.voz.fim + 0.35) { legenda = s.legenda ?? s.fala[1]; cor = CORES[s.fala[0]]; }
  }
  // estado padrão do quadro
  canvas.style.visibility = 'visible'; canvas.style.filter = 'none';
  foneEl.style.display = 'none'; fimEl.style.display = 'none'; hudEl.style.display = 'block'; capEl.style.top = '838px';
  cupom.visible = false; registradora.visible = true;
  campainha.userData.pino.position.y = 0.1; campainha.userData.dome.scale.y = 1; campainha.position.x = 3.55;
  telaMat.uniforms.tempo.value = t;
  mx = Math.sin(t * 1.3) * 0.008; my = Math.sin(t * 1.7 + 1) * 0.006;

  if (s.tipo === 'monitor') passeMonitor(s, u, d);
  TODOS.forEach(repouso);
  const st = { luz: { ...MODOS[s.luz ?? EP.luz ?? 'normal'] }, lanterna: false };
  setLayout({ ...(EP.layout ?? {}), ...(s.layout ?? {}) });
  TOMADAS[s.tipo](s, u, d, falando, st);
  cam.lookAt(alvo); cam.updateProjectionMatrix();
  if (!st.lanterna) st.luz.lanterna = 0;
  setLuz(st.luz);
  if (st.lanterna) { lanterna.position.copy(cam.position); lanterna.position.y -= 0.25; lanterna.target.position.copy(alvo); lanterna.target.updateMatrixWorld(); }
  renderer.render(scene, cam);

  if (capEl.dataset.txt !== legenda) { capEl.dataset.txt = legenda; capEl.textContent = legenda; }
  capEl.style.color = cor;
};

window.DURACAO = TL.dur;
window.renderFrame(0);
window.pronto = true;
