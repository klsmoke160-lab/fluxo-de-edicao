// Turno da Noite · teste visual (~12 s)
// Tudo é função do tempo t (segundos): renderFrame(t) desenha um quadro exato.
import * as THREE from 'three';

const W = 720, H = 1280;
export const DURACAO = 12;

await Promise.all([document.fonts.load('900 40px Montserrat'), document.fonts.load('800 40px Montserrat')]);

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1026);
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
const ss = (a, b, t) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const lerp = (a, b, k) => a + (b - a) * k;
const L = c => new THREE.MeshLambertMaterial({ color: c });
const B = c => new THREE.MeshBasicMaterial({ color: c });
function box(w, h, d, mat, x, y, z, parent = scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); parent.add(m); return m;
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
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
box(12, 3, 0.1, parede, 0, 1.5, -7.05);           // fundo
box(0.1, 3, 14, parede, -6.05, 1.5, 0);           // esquerda
box(0.1, 3, 14, parede, 6.05, 1.5, 0);            // direita
box(12, 3, 0.1, parede, 0, 1.5, 7.05);            // frente
box(12, 0.1, 14, teto, 0, 3.05, 0);               // teto
box(12, 0.5, 0.04, faixa, 0, 2.55, -6.98);
box(0.04, 0.5, 14, faixa, -5.98, 2.55, 0);
box(0.04, 0.5, 14, faixa, 5.98, 2.55, 0);
box(12, 0.5, 0.04, faixa, 0, 2.55, 6.98);

// Vitrine: a rua à noite, desenhada.
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
// Porta de vidro
const porta = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.25), B(0x0c1230));
porta.position.set(2.75, 1.125, 6.98); porta.rotation.y = Math.PI; scene.add(porta);
for (const x of [2.08, 3.42]) box(0.08, 2.3, 0.08, moldura, x, 1.15, 6.96);
box(1.42, 0.08, 0.08, moldura, 2.75, 2.3, 6.96);
box(0.05, 0.4, 0.05, L(0x9aa0aa), 3.2, 1.1, 6.93);

// Lâmpadas fluorescentes
const lampOn = new THREE.Color(0xf4fbff), lampOff = new THREE.Color(0x3a3f4a);
const lampadas = {};
function lampada(nome, x, z, ao_longo_de_z, comp) {
  const m = box(ao_longo_de_z ? 0.24 : comp, 0.05, ao_longo_de_z ? comp : 0.24, B(0xf4fbff), x, 2.97, z);
  box(ao_longo_de_z ? 0.34 : comp + 0.1, 0.03, ao_longo_de_z ? comp + 0.1 : 0.34, L(0x5d626c), x, 2.995, z);
  lampadas[nome] = m; return m;
}
lampada('c1', -3, -3, true, 4.6); lampada('c2', 0, -3, true, 4.6); lampada('c3', 2.9, -3, true, 4.6);
lampada('f1', -2.2, 4.2, false, 3.2); lampada('f2', 3.6, 4.4, false, 2.6);

const ambiente = new THREE.AmbientLight(0xc9d6f0, 0.8); scene.add(ambiente);
scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x6f6a60, 0.4));
const luz = {};
function ponto(nome, x, y, z, i, cor = 0xf0f6ff) { const p = new THREE.PointLight(cor, i, 0, 1.6); p.position.set(x, y, z); scene.add(p); luz[nome] = p; return p; }
ponto('c1', -3, 2.7, -3, 9); ponto('c2', 0, 2.7, -3, 9); ponto('c3', 2.9, 2.7, -3, 9);
ponto('f1', -2.2, 2.7, 4.2, 8); ponto('f2', 3.9, 2.6, 4.4, 9);

// Gôndolas e produtos
const prodPaleta = [0xd8402f, 0xf2b632, 0x2f6fb5, 0x3f9a58, 0xe8772e, 0xf1ece0, 0x7a4fa3, 0x29a6a6, 0xd9628f];
const prods = [];
const r1 = rng(42);
const gondMat = L(0x4b5565), prat = L(0xd6dbe2);
function gondola(x, lados) {
  box(0.5, 1.85, 6, gondMat, x, 0.925, -3);
  box(0.9, 0.12, 6.05, L(0x3a4352), x, 0.06, -3);
  box(0.9, 1.85, 0.08, L(0x596375), x, 0.925, 0.02);
  for (const s of lados) for (const y of [0.3, 0.72, 1.14, 1.56]) {
    box(0.26, 0.03, 6, prat, x + s * 0.36, y, -3);
    for (let z = -5.85; z < -0.1; z += 0.27) {
      if (r1() < 0.07) continue;
      const w = 0.15 + r1() * 0.07, h = 0.16 + r1() * 0.16, d = 0.16 + r1() * 0.07;
      prods.push({ x: x + s * 0.37, y: y + 0.015 + h / 2, z: z + r1() * 0.04, w, h, d, c: prodPaleta[Math.floor(r1() * prodPaleta.length)] });
    }
  }
}
gondola(-5.6, [1]); gondola(-1.5, [-1, 1]); gondola(1.5, [-1, 1]); gondola(4.3, [-1]);
// Expositor atrás do caixa (parede direita)
box(0.12, 1.5, 2.6, L(0x3b4250), 5.93, 1.65, 4.5);
for (const y of [1.0, 1.35, 1.7, 2.05]) {
  box(0.22, 0.03, 2.6, prat, 5.8, y, 4.5);
  for (let z = 3.3; z < 5.75; z += 0.16) {
    const h = 0.14 + r1() * 0.1;
    prods.push({ x: 5.8, y: y + 0.015 + h / 2, z, w: 0.12, h, d: 0.11, c: prodPaleta[Math.floor(r1() * prodPaleta.length)] });
  }
}
const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), prods.length);
{
  const m = new THREE.Matrix4(), c = new THREE.Color();
  prods.forEach((p, i) => {
    m.makeScale(p.w, p.h, p.d).setPosition(p.x, p.y, p.z); inst.setMatrixAt(i, m);
    inst.setColorAt(i, c.setHex(p.c));
  });
  scene.add(inst);
}
// Placas dos corredores
function placa(x, txt) {
  const t = canvasTex(512, 200, (g, w, h) => {
    g.fillStyle = '#1f5fa8'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#fff'; g.lineWidth = 10; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#fff'; g.font = '900 78px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(txt, w / 2, h / 2 + 4);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.45), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }));
  m.position.set(x, 2.5, 0.35); scene.add(m);
  box(0.02, 0.3, 0.02, L(0x8a8f99), x - 0.45, 2.86, 0.35); box(0.02, 0.3, 0.02, L(0x8a8f99), x + 0.45, 2.86, 0.35);
}
placa(-3.5, 'CORREDOR 1'); placa(0, 'CORREDOR 2'); placa(2.9, 'CORREDOR 3');

// Balcão do caixa (ao longo de z), registradora e monitor
box(0.8, 0.95, 2.4, L(0x8a5a3a), 3.8, 0.475, 4.5);
box(0.92, 0.06, 2.5, L(0xcaa57a), 3.8, 0.98, 4.5);
const registradora = [box(0.36, 0.26, 0.42, L(0x2a2d36), 3.82, 1.14, 3.95), box(0.02, 0.16, 0.26, B(0x6fcfa4), 4.01, 1.3, 3.95)];

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
const monitor = new THREE.Group();
monitor.position.set(3.8, 1.25, 5.25);
box(0.54, 0.47, 0.42, L(0xcfc8b6), 0, 0, 0, monitor);
box(0.3, 0.05, 0.3, L(0xb5ae9c), 0, -0.25, 0, monitor);
const bisel = new THREE.Mesh(new THREE.PlaneGeometry(0.49, 0.41), B(0x15171c)); bisel.position.z = 0.2105; monitor.add(bisel);
const tela = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.36), telaMat); tela.position.z = 0.212; monitor.add(tela);
const osdTex = canvasTex(512, 420, (g, w) => {
  g.font = '800 26px Montserrat'; g.fillStyle = 'rgba(235,255,240,.92)';
  g.textBaseline = 'top'; g.fillText('CAM 03 · CORREDOR 3', 26, 22);
  g.textAlign = 'right'; g.fillText('02:47:13', w - 26, 372);
  g.textAlign = 'left'; g.fillText('REC', 60, 372);
  g.fillStyle = '#ff4040'; g.beginPath(); g.arc(40, 386, 9, 0, 7); g.fill();
});
const osd = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.36), new THREE.MeshBasicMaterial({ map: osdTex, transparent: true }));
osd.position.z = 0.2135; monitor.add(osd);
scene.add(monitor);
monitor.lookAt(4.75, 1.62, 4.5);

// ---------- personagens ----------
function personagem(o) {
  const g = new THREE.Group();
  const pele = L(o.pele), camisa = L(o.camisa), calca = L(o.calca), traco = B(0x16110f);
  const cap = (r, l, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 8, 20), m);
  for (const s of [-1, 1]) {
    const perna = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.74, 16), calca); perna.position.set(s * 0.1, 0.41, 0); g.add(perna);
    const pe = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), L(o.sapato ?? 0x17171c)); pe.scale.set(0.95, 0.6, 1.5); pe.position.set(s * 0.1, 0.06, 0.04); g.add(pe);
    const braco = cap(0.062, 0.4, camisa); braco.position.set(s * 0.275, 1.1, 0); braco.rotation.z = s * 0.1; g.add(braco);
    const mao = new THREE.Mesh(new THREE.SphereGeometry(0.068, 16, 12), pele); mao.position.set(s * 0.305, 0.8, 0); g.add(mao);
  }
  const tronco = cap(0.2, 0.4, camisa); tronco.scale.set(1.08, 1, 0.85); tronco.position.y = 1.1; g.add(tronco);
  if (o.cracha) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.045, 0.01), B(0xf4f1e8)); c.position.set(0.09, 1.3, 0.166); g.add(c); }
  const sombra = new THREE.Mesh(new THREE.CircleGeometry(0.34, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 }));
  sombra.rotation.x = -Math.PI / 2; sombra.position.y = 0.012; g.add(sombra);

  const cabeca = new THREE.Group(); cabeca.position.y = 1.5; g.add(cabeca);
  const cranio = new THREE.Mesh(new THREE.SphereGeometry(0.215, 32, 24), pele); cranio.position.y = 0.19; cabeca.add(cranio);
  const contorno = new THREE.Mesh(new THREE.SphereGeometry(0.215, 32, 24), new THREE.MeshBasicMaterial({ color: 0x16110f, side: THREE.BackSide }));
  contorno.position.y = 0.19; contorno.scale.setScalar(1.075); cabeca.add(contorno);
  const olhos = [], pupilas = []; let boca = null;
  if (!o.semRosto) {
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
    boca = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), traco); boca.scale.set(1, 0.22, 0.3); boca.position.set(0, 0.075, 0.196); cabeca.add(boca);
  }
  scene.add(g);
  return { g, cabeca, olhos, pupilas, boca, tronco };
}
const davi = personagem({ pele: 0x8f5d3d, nariz: 0x7f5035, camisa: 0xd8402f, calca: 0x2c3350, cabelo: 0x1b1512, cracha: true });
davi.g.position.set(4.78, 0, 4.5);
const vulto = personagem({ pele: 0x17181f, camisa: 0x17181f, calca: 0x121319, sapato: 0x0c0c10, semRosto: true });
vulto.g.position.set(2.9, 0, -4.4); vulto.g.scale.set(1, 1.1, 1);

// ---------- roteiro do teste ----------
const FALAS = [
  [0.5, 3.7, 'Duas e quarenta e sete.<br>Nenhum cliente desde a meia-noite.'],
  [4.5, 6.8, 'Ué... tem cliente no corredor 3?'],
  [7.3, 8.8, 'Eu não ouvi a porta abrir.'],
  [9.9, 11.8, '...Não tem ninguém aqui.'],
];
const APAGADA = [[10.2, 10.28], [10.42, 10.6], [10.74, 10.8], [11.05, 11.5]];
const PISCADAS = [1.3, 2.4, 7.25];
const cap = document.getElementById('cap'), dim = document.getElementById('dim');
const alvo = new THREE.Vector3();

window.renderFrame = function (t) {
  const cena = t < 4 ? 'A' : t < 7 ? 'B' : t < 9 ? 'C' : 'D';

  // Davi
  let giroCabeca = lerp(-0.5, 0.82, ss(2.6, 3.15, t));
  let giroCorpo = -Math.PI / 2;
  let olhoAberto = 1, bocaAberta = 1, olharX = 0;
  if (cena === 'C') {
    const k = ss(7.85, 8.4, t);
    giroCabeca = lerp(0.82, -0.9, k); giroCorpo -= 0.32 * ss(7.9, 8.6, t);
    olhoAberto = lerp(1.08, 1.2, ss(8.2, 8.6, t)); bocaAberta = lerp(1.6, 4.2, ss(8.25, 8.6, t));
    olharX = -0.014 * Math.sin(Math.PI * k);
  }
  davi.g.rotation.y = giroCorpo; davi.cabeca.rotation.y = giroCabeca;
  davi.cabeca.rotation.x = cena === 'A' ? lerp(0.12, 0, ss(2.6, 3.1, t)) : 0;
  davi.tronco.scale.y = 1 + 0.012 * Math.sin(t * 2.2);
  let pisca = 0; for (const p of PISCADAS) pisca = Math.max(pisca, 1 - Math.min(1, Math.abs(t - p) / 0.09));
  for (const o of davi.olhos) o.scale.set(olhoAberto, olhoAberto * (1 - 0.92 * pisca), 1);
  for (const p of davi.pupilas) p.position.x = olharX;
  davi.boca.scale.y = 0.22 * bocaAberta;
  davi.g.visible = cena !== 'B';
  for (const m of registradora) m.visible = cena !== 'C';

  // Luz do corredor 3 piscando
  let apagada = false; for (const [a, b] of APAGADA) if (t >= a && t < b) apagada = true;
  lampadas.c3.material.color.copy(apagada ? lampOff : lampOn);
  luz.c3.intensity = apagada ? 0 : 9;
  ambiente.intensity = apagada ? 0.34 : 0.8;
  dim.style.opacity = apagada ? 0.34 : 0;

  // Câmera
  const mx = Math.sin(t * 1.3) * 0.008, my = Math.sin(t * 1.7 + 1) * 0.006;
  if (cena === 'A') {
    const k = ss(0, 4, t) * 0.5 + (t / 4) * 0.5;
    cam.fov = 62; cam.position.set(lerp(1.3, 2.0, k) + mx, lerp(1.62, 1.55, k) + my, lerp(0.9, 1.9, k));
    alvo.set(4.5, 1.22, 4.7);
  } else if (cena === 'B') {
    const k = (t - 4) / 3;
    cam.fov = lerp(60, 45, ss(0, 1, k)); cam.position.set(4.66 + mx, 1.66 + my, 4.58);
    alvo.set(3.82, 1.13, 5.24);
  } else if (cena === 'C') {
    const k = (t - 7) / 2;
    cam.fov = lerp(50, 45, k); cam.position.set(3.46 + mx, 1.5 + my, lerp(3.5, 3.6, k));
    alvo.set(4.78, 1.5, 4.5);
  } else {
    const k = (t - 9) / 3;
    cam.fov = 74; cam.position.set(2.9 + mx * 2, 1.5 + my * 2, lerp(0.1, -1.0, k));
    alvo.set(2.9, 1.1, -6);
  }
  cam.lookAt(alvo); cam.updateProjectionMatrix();

  // Monitor: só a câmera de segurança vê o vulto
  telaMat.uniforms.tempo.value = t;
  telaMat.uniforms.falha.value = (t > 5.55 && t < 5.72) || (t > 6.4 && t < 6.47) ? 1 : 0;
  if (cena === 'A' || cena === 'B') {
    vulto.g.visible = true; davi.g.visible = false;
    renderer.setRenderTarget(rt); renderer.render(scene, camSeg); renderer.setRenderTarget(null);
    davi.g.visible = cena !== 'B';
  }
  vulto.g.visible = false;
  renderer.render(scene, cam);

  // Legenda
  let txt = ''; for (const [a, b, s] of FALAS) if (t >= a && t < b) txt = s;
  if (cap.dataset.txt !== txt) { cap.dataset.txt = txt; cap.innerHTML = txt; }
};

window.DURACAO = DURACAO;
window.renderFrame(0);
window.pronto = true;
