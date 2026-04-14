/* ═══════════════════════════════════════════════════════════════
sumanth.D© — SCENE ENGINE (v3, asset-driven, perf-tuned)
═══════════════════════════════════════════════════════════════ */

(() => {

const $ = id => document.getElementById(id);

/* ═══════════ STATE ═══════════ */
const S = {
  scrollY:0, smooth:0, progress:0,
  vw:innerWidth, vh:innerHeight,
  dpr:Math.min(devicePixelRatio||1, 1.5),
  mx:innerWidth/2, my:innerHeight/2, nx:0, ny:0,
  t:0, lt:0, dt:0,
  fps:60, fpsT:0, fpsC:0,
  modelReady:false, assetsReady:false,
  dialogueIdx:-1, mugenVisible:false,
  shatterFired:false,
  inkMode:false,
  lightning:[], lightningT:0,
  inkClouds:[],
};

/* ═══════════ DIALOGUE (richer, more lines) ═══════════ */
const DIALOGUE = [
  { at:0.07, who:'SENSEI MUGEN',
    text:'<em>Hmm.</em> So you finally crossed the line. Sit, traveler — the road is long, and the blade is older than your grandfather.' },

  { at:0.14, who:'SENSEI MUGEN',
    text:'I am <strong>Mugen</strong>, ✦ keeper of unfinished worlds. This katana has cut the dreams of seventeen apprentices. Each returned home a craftsman.' },

  { at:0.21, who:'SENSEI MUGEN',
    text:'But none — <em>none</em> — became a builder of worlds. Few inherit the will. Fewer still answer it.' },

  { at:0.28, who:'SENSEI MUGEN',
    text:'Tell me, then. <strong>What world do you intend to build?</strong>' },

  { at:0.34, who:'sumanth.D',
    text:'<em>The one I cannot find on any map.</em>' },

  { at:0.42, who:'SENSEI MUGEN',
    text:'Good. Then the blade goes with you. Through cloud. Through thunder. Through the breaking of this old world.' },

  { at:0.54, who:'SENSEI MUGEN',
    text:'They will tell you the sky has an edge. They are wrong. <em>You were made to find out.</em>' },

  { at:0.66, who:'SENSEI MUGEN',
    text:"Every shard you see was once the shape of somebody else's dream. Step over them. The self is a hill with a sea behind it." },

  { at:0.78, who:'SENSEI MUGEN',
    text:'These are your works. Not trophies — <em>evidence</em>. Proof the hand moves when the will points.' },

  { at:0.88, who:'SENSEI MUGEN',
    text:'Now look up. The dawn does not arrive. It is <em>answered</em>.' },

  { at:0.95, who:'SENSEI MUGEN',
    text:'Go on, builder. 世界を創る者. The world is waiting for yours.' },
];

/* ═══════════ WORKS (Cappen-style ledger) ═══════════ */
const WORKS = [
  { no:'01', year:'2025', title:'Fudō Myōō',       role:'Environment · Hard-Surface', desc:'A sanctum of still fire. Shingon iconography rendered as space.' },
  { no:'02', year:'2025', title:'Midea · Canada',  role:'Graphic Design',             desc:'Five sub-brands. Toronto, March through July.' },
  { no:'03', year:'2024', title:'Kōhaku',          role:'3D · Concept',               desc:'Silent koi. A study in subsurface and lanternlight.' },
  { no:'04', year:'2024', title:'KD Displays',     role:'Retail Environments',        desc:'Environmental graphics for Home Depot Canada lines.' },
  { no:'05', year:'2024', title:'Onibi',           role:'Hard-Surface',               desc:'Wandering-flame lanterns. Soft emissives, hand-tuned.' },
  { no:'06', year:'2023', title:'Investohome',     role:'Brand · Identity',           desc:'Full identity system for a Toronto real-estate venture.' },
  { no:'07', year:'2023', title:'The Iron Garden', role:'Environment · Coursework',   desc:'Rust and cherry branches. A study in rain memory.' },
];

/* ═══════════ PRELOAD ═══════════ */
function preloadImages(urls){
  return Promise.all(urls.map(u => new Promise(resolve => {
    const img = new Image();
    img.onload = img.onerror = () => resolve(u);
    img.src = u;
  })));
}

/* ═══════════ SCROLL ═══════════ */
let scrollMax = 1;
function updateScrollMax(){
  scrollMax = Math.max(1, document.documentElement.scrollHeight - innerHeight);
}
addEventListener('scroll', () => { S.scrollY = scrollY; }, {passive:true});
addEventListener('resize', () => {
  S.vw = innerWidth; S.vh = innerHeight;
  updateScrollMax();
  if(R){ R.setSize(S.vw, S.vh); CAM.aspect = S.vw/S.vh; CAM.updateProjectionMatrix(); }
  if(atmos && ax) resizeAtmos();
  if(inkC && ix) resizeInk();
});

/* ═══════════ ATMOS CANVAS ═══════════ */
const atmos = $('atmos');
const ax = atmos ? atmos.getContext('2d') : null;
function resizeAtmos(){
  if(!atmos || !ax) return;
  atmos.width  = innerWidth  * S.dpr;
  atmos.height = innerHeight * S.dpr;
  ax.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
}
resizeAtmos();

/* ═══════════ INK CANVAS ═══════════ */
const inkC = $('ink-layer');
const ix = inkC ? inkC.getContext('2d') : null;
function resizeInk(){
  if(!inkC || !ix) return;
  inkC.width  = innerWidth  * S.dpr;
  inkC.height = innerHeight * S.dpr;
  ix.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
}
resizeInk();

/* ═══════════ THREE.JS ═══════════ */
let R, SC, CAM, KAT, keyL, fillL, rimL, edgeAccent, moonL, sunL;

function initThree(){
  const canvasEl = $('three');
  if(!canvasEl) return;
  R = new THREE.WebGLRenderer({
    canvas: canvasEl, antialias:true, alpha:true, powerPreference:'high-performance'
  });
  R.setPixelRatio(S.dpr);
  R.setSize(S.vw, S.vh);
  R.toneMapping = THREE.ACESFilmicToneMapping;
  R.toneMappingExposure = 0.95;
  // Updated for modern Three.js
  R.outputColorSpace = THREE.SRGBColorSpace; 
  R.setClearColor(0x000000, 0);

  SC = new THREE.Scene();
  CAM = new THREE.PerspectiveCamera(36, S.vw/S.vh, 0.01, 200);
  CAM.position.set(0, 0, 5);

  // Three-point lighting, color-tuned per beat later
  SC.add(new THREE.AmbientLight(0x1a1512, 0.55));

  keyL = new THREE.DirectionalLight(0xffe0b8, 1.4);
  keyL.position.set(-3, 5, 4); SC.add(keyL);

  fillL = new THREE.DirectionalLight(0x402020, 0.55);
  fillL.position.set(4, -1, 2); SC.add(fillL);

  rimL = new THREE.DirectionalLight(0xff6030, 0.7);
  rimL.position.set(0, -3, -4); SC.add(rimL);

  edgeAccent = new THREE.PointLight(0xc83c28, 0, 6);
  edgeAccent.position.set(0, 0, 0.4); SC.add(edgeAccent);

  moonL = new THREE.DirectionalLight(0xb8cde8, 0);
  moonL.position.set(3, 4, 2); SC.add(moonL);

  sunL = new THREE.DirectionalLight(0xffa040, 0);
  sunL.position.set(-2, 2, 3); SC.add(sunL);

  KAT = new THREE.Group();
  SC.add(KAT);
}
initThree();

/* ═══════════ KATANA LOAD ═══════════ */
const loader = typeof THREE.GLTFLoader === 'function' ? new THREE.GLTFLoader() : (window.GLTFLoader ? new window.GLTFLoader() : null);

function createStandinKatana(){
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, .085, .020),
    new THREE.MeshStandardMaterial({color:0x080910, metalness:.96, roughness:.06})
  );
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(.055, .055, .82, 18),
    new THREE.MeshStandardMaterial({color:0x1a0510, metalness:.4, roughness:.55})
  );
  handle.rotation.z = Math.PI/2; handle.position.x = -1.7;
  const tsuba = new THREE.Mesh(
    new THREE.CylinderGeometry(.16, .16, .035, 28),
    new THREE.MeshStandardMaterial({color:0x4a2e1a, metalness:.7, roughness:.3})
  );
  tsuba.rotation.z = Math.PI/2; tsuba.position.x = -1.25;
  const g = new THREE.Group();
  g.add(blade, handle, tsuba);
  return {group:g, meshes:[blade, handle, tsuba]};
}

function finalizeKatana(model, meshes){
  if(!KAT) return;
  KAT.add(model);
  KAT.userData.model = model;
  KAT.userData.meshes = meshes;
  S.modelReady = true;
  checkBoot();
}

let gltfTimeout = setTimeout(() => {
  console.warn('GLTF load timeout — using stand-in');
  const { group, meshes } = createStandinKatana();
  finalizeKatana(group, meshes);
}, 15000);

if(loader) {
  loader.load('models/katana.glb',
    gltf => {
      clearTimeout(gltfTimeout);
      const m = gltf.scene;
      const box = new THREE.Box3().setFromObject(m);
      const sz = box.getSize(new THREE.Vector3());
      const scale = 5.4 / Math.max(sz.x, sz.y, sz.z, 0.001);
      m.scale.setScalar(scale);
      const ctr = box.getCenter(new THREE.Vector3());
      m.position.set(-ctr.x*scale, -ctr.y*scale, -ctr.z*scale);

      const meshes = [];
      m.traverse(o => {
        if(!o.isMesh) return;
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        o.material = Array.isArray(o.material) ? ms.map(enhanceMat) : enhanceMat(ms[0]);
        meshes.push(o);
      });

      finalizeKatana(m, meshes);
    },
    xhr => {
      if(xhr.total > 0){
        const pct = 40 + (xhr.loaded/xhr.total)*50;
        const loaderBar = $('loader-bar');
        const loaderPct = $('loader-pct');
        if(loaderBar) loaderBar.style.width = pct + '%';
        if(loaderPct) loaderPct.textContent = String(Math.round(pct)).padStart(3,'0') + ' %';
      }
    },
    err => {
      clearTimeout(gltfTimeout);
      console.warn('GLB missing — using stand-in:', err);
      const { group, meshes } = createStandinKatana();
      finalizeKatana(group, meshes);
    }
  );
} else {
  clearTimeout(gltfTimeout);
  console.warn('GLTFLoader not found — using stand-in');
  const { group, meshes } = createStandinKatana();
  finalizeKatana(group, meshes);
}

function enhanceMat(m){
  const mat = m.clone();
  if(!mat.emissive) mat.emissive = new THREE.Color(0,0,0);
  const col = mat.color || new THREE.Color(1,1,1);
  const b = (col.r+col.g+col.b)/3;
  if(b < 0.18){ mat.metalness = 0.96; mat.roughness = 0.06; }
  else if(b < 0.5){ mat.metalness = 0.72; mat.roughness = 0.22; }
  mat.envMapIntensity = 1.8;
  return mat;
}

/* ═══════════ UTIL ═══════════ */
const smoothstep = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x-a)/(b-a)));
  return t*t*(3 - 2*t);
};
const lerp = (a, b, t) => a + (b-a)*t;
const toggle = (el, cls, on) => {
  if(!el) return;
  if(on) el.classList.add(cls); else el.classList.remove(cls);
};

/* ═══════════ BEAT PROGRESS HELPERS ═══════════ */
function currentBeat(p){
  if(p < 0.08) return 1;
  if(p < 0.22) return 2;
  if(p < 0.38) return 3;
  if(p < 0.50) return 4;
  if(p < 0.62) return 5;
  if(p < 0.72) return 6;
  if(p < 0.85) return 7;
  if(p < 0.96) return 8;
  return 9;
}

/* ═══════════ BG CROSS-FADE + PARALLAX ═══════════ */
function updateBg(){
  const p = S.progress;

  const wHero    = smoothstep(0.02, 0.10, p)  * (1 - smoothstep(0.36, 0.44, p));
  const wClouds  = smoothstep(0.36, 0.44, p)  * (1 - smoothstep(0.60, 0.66, p));
  const wImpact  = smoothstep(0.60, 0.64, p)  * (1 - smoothstep(0.70, 0.76, p));
  const wPaper   = smoothstep(0.68, 0.76, p)  * (1 - smoothstep(0.83, 0.88, p));
  const wHilltop = smoothstep(0.82, 0.88, p)  * (1 - smoothstep(0.94, 0.97, p));
  const wDawn    = smoothstep(0.93, 0.97, p);

  setLayerOpacity($('bg-hero'),    wHero);
  setLayerOpacity($('bg-clouds'),  wClouds);
  setLayerOpacity($('bg-impact'),  wImpact);
  setLayerOpacity($('bg-paper'),   wPaper);
  setLayerOpacity($('bg-hilltop'), wHilltop);
  setLayerOpacity($('bg-dawn'),    wDawn);

  setParallax($('bg-hero'),    p, 0.00, 0.38, 1.05, 1.12, S.nx*0.8, S.ny*0.6);
  setParallax($('bg-clouds'),  p, 0.36, 0.62, 1.02, 1.10, S.nx*1.2, S.ny*0.8);
  setParallax($('bg-paper'),   p, 0.68, 0.88, 1.00, 1.04, S.nx*0.3, S.ny*0.2);
  setParallax($('bg-hilltop'), p, 0.82, 0.97, 1.04, 1.12, S.nx*0.6, S.ny*0.4);
  setParallax($('bg-dawn'),    p, 0.93, 1.00, 1.02, 1.08, S.nx*0.4, S.ny*0.3);
}
function setLayerOpacity(el, w){
  if(!el) return;
  if(w > 0.01){
    el.style.opacity = Math.min(1, w);
    if(!el.classList.contains('-on')) el.classList.add('-on');
  } else {
    el.style.opacity = 0;
    el.classList.remove('-on');
  }
}
function setParallax(el, p, start, end, minScale, maxScale, mouseX, mouseY){
  if(!el) return;
  const local = smoothstep(start, end, p);
  const scale = lerp(minScale, maxScale, local);
  const tx = mouseX * 10;
  const ty = mouseY * 10 + local*-20;
  el.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale.toFixed(4)})`;
}

/* ═══════════ KATANA CHOREOGRAPHY ═══════════ */
function updateKatana(){
  if(!KAT || !KAT.userData.model) return;
  const p = S.progress;
  let kx, ky, kz, rX, rY, rZ;

  if(p < 0.08){
    const t = smoothstep(0, 0.08, p);
    kx = lerp(0.3, 0.2, t);  ky = -0.04;  kz = lerp(0.6, 0.9, t);
    rX = S.ny*.04;  rY = 0.3;  rZ = -Math.PI*0.42;
  } else if(p < 0.22){
    const t = smoothstep(0.08, 0.22, p);
    kx = lerp(0.2, 0, t);  ky = lerp(-0.04, 0.05, t);  kz = lerp(0.9, 5.2, t);
    rX = S.ny*.04;  rY = lerp(0.3, 0, t);  rZ = lerp(-Math.PI*0.42, 0, t);
  } else if(p < 0.38){
    kx = Math.sin(S.t*.28)*.05;  ky = 0.05 + Math.sin(S.t*.45)*.02;
    kz = lerp(5.2, 5.8, smoothstep(0.22, 0.38, p));
    rX = S.ny*.04 + Math.sin(S.t*.3)*.006;  rY = 0;  rZ = 0;
  } else if(p < 0.50){
    const t = smoothstep(0.38, 0.50, p);
    kx = lerp(0, -1.4, t);  ky = lerp(0.05, 1.6, t);  kz = lerp(5.8, 4.4, t);
    rX = lerp(0, -0.32, t);  rY = lerp(0, -0.4, t);  rZ = lerp(0, -Math.PI*0.25, t);
  } else if(p < 0.62){
    const t = smoothstep(0.50, 0.62, p);
    kx = lerp(-1.4, 1.4, t);  ky = lerp(1.6, 0.4, t);  kz = lerp(4.4, 3.6, t);
    rX = lerp(-0.32, -0.12, t);  rY = lerp(-0.4, 0.3, t);  rZ = lerp(-Math.PI*0.25, -Math.PI*0.06, t);
  } else if(p < 0.72){
    const t = smoothstep(0.62, 0.72, p);
    kx = lerp(1.4, 0, t);  ky = lerp(0.4, -3.4, t);  kz = lerp(3.6, 2.4, t);
    rX = lerp(-0.12, -Math.PI*0.25, t);  rY = lerp(0.3, 0, t);  rZ = lerp(-Math.PI*0.06, -Math.PI*0.5, t);
    if(p > 0.66 && !S.shatterFired) fireShatter();
  } else if(p < 0.85){
    const t = smoothstep(0.72, 0.85, p);
    kx = lerp(0, 3.4, t);  ky = lerp(-3.4, 2.0, t);  kz = lerp(2.4, 7.6, t);
    rX = lerp(-Math.PI*0.25, 0.1, t);  rY = lerp(0, -0.3, t);  rZ = lerp(-Math.PI*0.5, -Math.PI*0.2, t);
  } else if(p < 0.96){
    const t = smoothstep(0.85, 0.96, p);
    kx = lerp(3.4, -2.4, t);  ky = lerp(2.0, -0.8, t);  kz = lerp(7.6, 3.4, t);
    rX = lerp(0.1, -0.08, t);  rY = lerp(-0.3, 0.2, t);  rZ = lerp(-Math.PI*0.2, -Math.PI*0.48, t);
  } else {
    kx = -2.4 + S.nx*0.03;  ky = -0.8 + Math.sin(S.t*0.5)*0.02;  kz = 3.4;
    rX = -0.08;  rY = 0.2 + Math.sin(S.t*0.3)*0.02;  rZ = -Math.PI*0.48;
  }

  KAT.position.set(kx + S.nx*0.03, ky + S.ny*0.03, kz);
  KAT.rotation.set(rX, rY, rZ);

  if(p < 0.38){
    keyL.color.setHex(0xffe0b8);  keyL.intensity = 1.4;
    rimL.color.setHex(0xff6030);  rimL.intensity = 0.7;
    moonL.intensity = 0;  sunL.intensity = 0;
  } else if(p < 0.62){
    keyL.color.setHex(0xffc890);  keyL.intensity = 1.7;
    rimL.color.setHex(0xc83c28);  rimL.intensity = 0.9;
    moonL.intensity = 0;  sunL.intensity = 0;
  } else if(p < 0.85){
    keyL.color.setHex(0xffe8d0);  keyL.intensity = 1.5;
    rimL.color.setHex(0x8b6340);  rimL.intensity = 0.4;
    moonL.intensity = 0;  sunL.intensity = 0;
  } else if(p < 0.96){
    keyL.color.setHex(0xb8cde8);  keyL.intensity = 0.9;
    rimL.color.setHex(0x3a4a6a);  rimL.intensity = 0.6;
    moonL.intensity = smoothstep(0.85, 0.96, p)*1.2;  sunL.intensity = 0;
  } else {
    keyL.color.setHex(0xffd890);  keyL.intensity = 1.1;
    rimL.color.setHex(0xffa040);  rimL.intensity = 1.0;
    moonL.intensity = 0;  sunL.intensity = 1.5;
  }

  edgeAccent.intensity = smoothstep(0.22, 0.60, p)*1.2 + smoothstep(0.88, 1.0, p)*0.9;
  edgeAccent.position.set(KAT.position.x, KAT.position.y, KAT.position.z + 0.4);

  if(KAT.userData.meshes){
    const eW = smoothstep(0.34, 0.66, p)*0.42 + smoothstep(0.88, 1.0, p)*0.25;
    KAT.userData.meshes.forEach(m => {
      if(m.material && m.material.emissive){
        const col = m.material.color;
        const b = (col.r+col.g+col.b)/3;
        if(b < 0.18){
          m.material.emissive.setRGB(eW*0.28, eW*0.05, eW*0.02);
        }
      }
    });
  }

  KAT.position.y += Math.sin(S.t*0.7)*0.004;
}

/* ═══════════ ATMOS — petals, embers, god rays, lightning, dandelions ═══════════ */
const petals = [];
const embers = [];
const dandelions = [];

function initAtmos(){
  for(let i=0; i<64; i++) petals.push(spawnPetal(true));
  for(let i=0; i<24; i++) embers.push({
    x:Math.random()*innerWidth, y:Math.random()*innerHeight,
    r:.8 + Math.random()*1.6, vx:(Math.random()-.5)*.22, vy:-(.12+Math.random()*.35),
    fl:Math.random()*Math.PI*2, fs:.03+Math.random()*.06, op:.25+Math.random()*.4,
  });
  for(let i=0; i<28; i++) dandelions.push({
    x:Math.random()*innerWidth*1.4 - innerWidth*0.2,
    y:Math.random()*innerHeight, r:1.2+Math.random()*1.6,
    vx:0.18+Math.random()*0.35, vy:-0.04-Math.random()*0.08,
    rot:Math.random()*Math.PI*2, rotV:(Math.random()-.5)*0.02,
    op:.5+Math.random()*.4, seeds:4+Math.floor(Math.random()*3),
  });
}

function spawnPetal(distribute){
  const close = Math.random() < 0.07;
  return {
    x:Math.random()*innerWidth+120,
    y:distribute?Math.random()*innerHeight:-30-Math.random()*80,
    sz:close?18+Math.random()*16:3+Math.random()*5,
    rot:Math.random()*Math.PI*2, rv:(Math.random()-.5)*.018,
    vx:-.3-Math.random()*.7-(close?.3:0),
    vy:.15+Math.random()*.4+(close?.3:0),
    sw:Math.random()*Math.PI*2, ss:.005+Math.random()*.012,
    sa:.3+Math.random()*1.0,
    op:close?.3+Math.random()*.25:.35+Math.random()*.5,
    glass:close, hue:Math.random()>.45?'pink':'red',
  };
}

function drawPetalShape(sz, stroke){
  for(let i=0; i<5; i++){
    ax.save();
    ax.rotate(i * Math.PI*2/5);
    ax.beginPath();
    ax.ellipse(0, -sz*.5, sz*.26, sz*.52, 0, 0, Math.PI*2);
    if(stroke) ax.stroke(); else ax.fill();
    ax.restore();
  }
}

function drawAtmos(){
  if(!ax) return;
  const W = innerWidth, H = innerHeight;
  ax.clearRect(0, 0, W, H);
  const p = S.progress;

  const rayW = smoothstep(0.38, 0.48, p)*(1-smoothstep(0.60, 0.68, p)) + smoothstep(0.94, 0.98, p);
  if(rayW > 0.01){
    ax.save();
    ax.globalCompositeOperation = 'screen';
    const originX = p < 0.62 ? W*0.18 : W*0.5;
    const originY = -H*0.1;
    for(let i=0; i<7; i++){
      const a = -Math.PI*0.15 + i*(Math.PI*0.055);
      const rlen = H*1.5;
      const rx = originX + Math.cos(a)*40;
      const ry = originY;
      const ex = rx + Math.cos(a+Math.PI/2)*rlen;
      const ey = ry + Math.sin(a+Math.PI/2)*rlen;
      const g = ax.createLinearGradient(rx, ry, ex, ey);
      const pulse = 0.3 + 0.25*Math.sin(S.t*0.5 + i*0.7);
      const op = (0.08 + pulse*0.08) * rayW;
      g.addColorStop(0, `rgba(255, 220, 180, ${op})`);
      g.addColorStop(0.4, `rgba(255, 200, 140, ${op*0.7})`);
      g.addColorStop(1, 'rgba(255, 180, 100, 0)');
      ax.fillStyle = g;
      ax.beginPath();
      const spread = 50 + i*8;
      ax.moveTo(rx - spread, ry);
      ax.lineTo(rx + spread, ry);
      ax.lineTo(ex + spread*2.5, ey);
      ax.lineTo(ex - spread*2.5, ey);
      ax.closePath();
      ax.fill();
    }
    ax.restore();
  }

  const petalW = smoothstep(0.02, 0.08, p) * (1 - smoothstep(0.34, 0.44, p));
  if(petalW > 0.01){
    const wind = Math.sin(S.t*0.4)*1.1;
    petals.forEach(pe => {
      pe.sw += pe.ss;
      pe.x += pe.vx + Math.sin(pe.sw)*pe.sa + wind;
      pe.y += pe.vy;
      pe.rot += pe.rv;
      if(pe.y > H+40 || pe.x < -60){ Object.assign(pe, spawnPetal(false)); }

      ax.save();
      ax.translate(pe.x, pe.y);
      ax.rotate(pe.rot);
      ax.globalAlpha = pe.op * petalW;

      if(pe.glass){
        ax.filter = 'blur(.5px)';
        const g = ax.createRadialGradient(0, 0, 0, 0, 0, pe.sz);
        g.addColorStop(0, 'rgba(255,210,220,.45)');
        g.addColorStop(.6, 'rgba(240,160,180,.22)');
        g.addColorStop(1, 'rgba(200,100,120,0)');
        ax.fillStyle = g;
        drawPetalShape(pe.sz);
        ax.filter = 'none';
        ax.strokeStyle = 'rgba(255,220,230,.55)';
        ax.lineWidth = 0.6;
        drawPetalShape(pe.sz, true);
      } else {
        ax.fillStyle = pe.hue === 'pink' ? 'rgba(240,150,170,1)' : 'rgba(200,60,40,1)';
        drawPetalShape(pe.sz);
      }
      ax.restore();
    });
  }

  const emberW = smoothstep(0.36, 0.46, p)*(1-smoothstep(0.60, 0.66, p));
  if(emberW > 0.01){
    embers.forEach(e => {
      e.x += e.vx; e.y += e.vy; e.fl += e.fs;
      if(e.y < -10) e.y = H+10;
      if(e.x < -8) e.x = W+8;
      if(e.x > W+8) e.x = -8;
      const op = e.op * (0.5+0.5*Math.sin(e.fl)) * emberW;
      const g = ax.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r*4);
      g.addColorStop(0, `rgba(255,160,80,${op})`);
      g.addColorStop(0.4, `rgba(230,100,50,${op*0.5})`);
      g.addColorStop(1, 'rgba(140,30,10,0)');
      ax.fillStyle = g;
      ax.beginPath(); ax.arc(e.x, e.y, e.r*4, 0, Math.PI*2); ax.fill();
    });
  }

  if(p > 0.46 && p < 0.62){
    S.lightningT -= S.dt;
    if(S.lightningT <= 0){
      spawnLightning();
      S.lightningT = 0.5 + Math.random()*0.7;
    }
  }
  drawLightning();

  const dandW = smoothstep(0.82, 0.90, p);
  if(dandW > 0.01){
    dandelions.forEach(d => {
      d.x += d.vx + Math.sin(S.t*0.3 + d.rot)*0.4;
      d.y += d.vy;
      d.rot += d.rotV;
      if(d.x > W+40) d.x = -40;
      if(d.y < -20) d.y = H+20;

      ax.save();
      ax.translate(d.x, d.y);
      ax.rotate(d.rot);
      ax.globalAlpha = d.op * dandW;
      
      ax.fillStyle = 'rgba(245,238,220,.8)';
      ax.beginPath(); ax.arc(0, 0, d.r*0.5, 0, Math.PI*2); ax.fill();
      
      ax.strokeStyle = 'rgba(245,238,220,.55)';
      ax.lineWidth = 0.5;
      const bristles = 10;
      for(let i=0; i<bristles; i++){
        const a = i/bristles * Math.PI*2;
        ax.beginPath();
        ax.moveTo(0, 0);
        ax.lineTo(Math.cos(a)*d.r*2.6, Math.sin(a)*d.r*2.6);
        ax.stroke();
      }
      
      ax.fillStyle = 'rgba(250,245,230,.7)';
      for(let i=0; i<bristles; i++){
        const a = i/bristles * Math.PI*2;
        ax.beginPath();
        ax.arc(Math.cos(a)*d.r*2.6, Math.sin(a)*d.r*2.6, 0.7, 0, Math.PI*2);
        ax.fill();
      }
      ax.restore();
    });
  }
}

/* ═══════════ LIGHTNING ═══════════ */
function spawnLightning(){
  const x1 = innerWidth * (0.15 + Math.random()*0.7);
  const y1 = -20;
  const x2 = x1 + (Math.random()-0.5)*innerWidth*0.4;
  const y2 = innerHeight * (0.45 + Math.random()*0.35);
  S.lightning.push({
    x1, y1, x2, y2,
    life:1, decay:0.04+Math.random()*0.03,
    seed:Math.random()*1000,
    branches:Math.floor(Math.random()*3)+1,
  });
}
function lightningSegments(x1, y1, x2, y2, detail, seed){
  const segs = [[x1, y1]];
  const N = 12;
  const rng = s => { const x = Math.sin(s+seed)*43758.5; return x - Math.floor(x); };
  for(let i=1; i<N; i++){
    const t = i/N;
    const tx = x1 + (x2-x1)*t, ty = y1 + (y2-y1)*t;
    const offset = detail * (rng(i*3.7) - 0.5)*46;
    const perpX = -(y2-y1), perpY = (x2-x1);
    const pl = Math.hypot(perpX, perpY);
    segs.push([tx + perpX/pl*offset, ty + perpY/pl*offset]);
  }
  segs.push([x2, y2]);
  return segs;
}
function drawLightning(){
  if(!ax) return;
  S.lightning = S.lightning.filter(b => b.life > 0);
  S.lightning.forEach(b => {
    b.life -= b.decay;
    const op = Math.max(0, b.life);
    const segs = lightningSegments(b.x1, b.y1, b.x2, b.y2, b.life, b.seed);

    ax.lineCap = 'round'; ax.lineJoin = 'round';
    ax.strokeStyle = `rgba(220,200,255,${op*0.32})`; ax.lineWidth = 9;
    drawPath(segs);
    ax.strokeStyle = `rgba(235,220,255,${op*0.6})`; ax.lineWidth = 3.2;
    drawPath(segs);
    ax.strokeStyle = `rgba(255,250,255,${op})`; ax.lineWidth = 1.2;
    drawPath(segs);

    for(let k=0; k<b.branches; k++){
      const si = Math.floor(segs.length*(0.3+k*0.18));
      if(si >= segs.length-1) continue;
      const sp = segs[si];
      const bAng = Math.atan2(b.y2-b.y1, b.x2-b.x1) + (Math.random()-0.5)*1.5;
      const bLen = 50+Math.random()*80;
      const bx2 = sp[0] + Math.cos(bAng)*bLen;
      const by2 = sp[1] + Math.sin(bAng)*bLen;
      const bSegs = lightningSegments(sp[0], sp[1], bx2, by2, b.life*0.8, b.seed+k*7);
      ax.strokeStyle = `rgba(220,200,255,${op*0.26})`; ax.lineWidth = 4;
      drawPath(bSegs);
      ax.strokeStyle = `rgba(255,240,255,${op*0.75})`; ax.lineWidth = 1;
      drawPath(bSegs);
    }
  });
}
function drawPath(segs){
  if(!ax) return;
  ax.beginPath();
  segs.forEach((p, i) => i ? ax.lineTo(p[0], p[1]) : ax.moveTo(p[0], p[1]));
  ax.stroke();
}

/* ═══════════ SHATTER ═══════════ */
function fireShatter(){
  if(S.shatterFired) return;
  const layer = $('shatter');
  if(!layer) return;
  S.shatterFired = true;
  layer.classList.add('-on');

  const N = 46;
  const cx = innerWidth*0.5, cy = innerHeight*0.5;

  for(let i=0; i<N; i++){
    const shard = document.createElement('div');
    shard.className = 'shard';
    const pts = [];
    const sides = 3 + Math.floor(Math.random()*3);
    for(let j=0; j<sides; j++) pts.push(`${Math.random()*100}% ${Math.random()*100}%`);
    shard.style.clipPath = `polygon(${pts.join(',')})`;

    const size = 60+Math.random()*180;
    shard.style.width = size+'px';
    shard.style.height = (size*(0.5+Math.random()*0.8))+'px';
    shard.style.left = (cx - size/2)+'px';
    shard.style.top = (cy - size/2)+'px';
    layer.appendChild(shard);

    const angle = (i/N)*Math.PI*2 + (Math.random()-0.5)*0.6;
    const speed = 260+Math.random()*520;
    const tx = Math.cos(angle)*speed;
    const ty = Math.sin(angle)*speed + Math.random()*180;
    const rot = (Math.random()-0.5)*720;

    shard.animate([
      { transform:'translate(0,0) rotate(0) scale(.4)', opacity:1 },
      { transform:`translate(${tx*0.3}px,${ty*0.3}px) rotate(${rot*0.3}deg) scale(1)`, opacity:1, offset:.2 },
      { transform:`translate(${tx}px,${ty+360}px) rotate(${rot}deg) scale(.6)`, opacity:0 }
    ], { duration:1800+Math.random()*900, easing:'cubic-bezier(.2,.7,.3,1)', fill:'forwards' });
  }

  const flash = document.createElement('div');
  flash.style.cssText = `position:absolute;inset:0;z-index:33;pointer-events:none;mix-blend-mode:screen; background:radial-gradient(circle at 50% 50%, rgba(255,250,240,1) 0%, rgba(255,240,220,.6) 30%, rgba(255,200,180,0) 60%);`;
  layer.appendChild(flash);
  flash.animate([{opacity:1},{opacity:0}], {duration:900, easing:'ease-out', fill:'forwards'});

  setTimeout(() => { layer.innerHTML = ''; layer.classList.remove('-on'); }, 3400);
}

/* ═══════════ GLITCH SCRAMBLER ═══════════ */
const KANA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
const KANJI = '刀剣魂創造夢幻覚醒風炎月海';
const SYMBOLS = '▓▒░│┤┐└┴┬├─┼╪';
function scrambleChar(){
  const src = Math.random() < 0.5 ? KANA : (Math.random() < 0.6 ? KANJI : SYMBOLS);
  return src[Math.floor(Math.random()*src.length)];
}
function runScramble(el){
  if(el._scrambling) return;
  const target = el.dataset.target;
  if(!target) return;
  el._scrambling = true;

  const lines = target.split('|');
  const plainLines = lines.map(l => l.replace(/<[^>]+>/g, ''));
  const maxLen = Math.max(...plainLines.map(l => l.length));
  const steps = 14;
  let step = 0;

  const tick = () => {
    step++;
    const prog = step/steps;
    if(step >= steps){
      el.innerHTML = lines.join('<br>');
      el._scrambling = false;
      return;
    }
    const mixed = lines.map((line, li) => {
      const plain = plainLines[li];
      const reveal = Math.floor(plain.length * prog);
      const scrLen = Math.min(plain.length - reveal, 5);
      let s = plain.slice(0, reveal);
      for(let i=0; i<scrLen; i++) s += scrambleChar();
      return s;
    });
    el.innerHTML = mixed.join('<br>');
    setTimeout(tick, 50);
  };
  tick();
}

/* ═══════════ DIALOGUE TYPEWRITER ═══════════ */
let typingJob = null;
function showDialogue(idx){
  if(idx === S.dialogueIdx) return;
  S.dialogueIdx = idx;
  const d = DIALOGUE[idx];
  if(!d) return;
  const mugenEl = $('mugen');
  if(!S.mugenVisible && mugenEl){
    mugenEl.classList.add('-on');
    S.mugenVisible = true;
  }
  const whoEl = $('mb-who');
  const textEl = $('mb-text');
  if(whoEl) whoEl.textContent = d.who;
  if(typingJob) clearInterval(typingJob);
  const target = d.text;
  let i = 0;
  if(textEl) textEl.innerHTML = '';
  typingJob = setInterval(() => {
    i++;
    let preview = target.slice(0, i);
    const open = [...preview.matchAll(/<(\w+)[^>]*>/g)].map(m => m[1]);
    const close = [...preview.matchAll(/<\/\w+>/g)].map(m => m[1]);
    const unclosed = open.filter(t => {
      const oi = open.indexOf(t);
      const ci = close.indexOf(t);
      return oi !== -1 && (ci === -1 || ci < oi);
    });
    let display = preview;
    unclosed.forEach(t => display += `</${t}>`);
    if(textEl) textEl.innerHTML = display;
    if(i >= target.length){ clearInterval(typingJob); typingJob = null; }
  }, 22);
}

/* ═══════════ M-GLYPH MORPH (m → 3 → D, 12s cycle) ═══════════ */
function updateMGlyph(){
  const cycle = (S.t % 12) / 12; // 12-second cycle
  let glyph = 'm', rot = 0;
  if(cycle < 0.28){ glyph = 'm'; rot = cycle*10; }
  else if(cycle < 0.35){
    glyph = (cycle < 0.32) ? 'm' : '3';
    rot = (cycle-0.28) * 4 * 180;
  }
  else if(cycle < 0.63){ glyph = '3'; rot = 180 + (cycle-0.35)*10; }
  else if(cycle < 0.70){
    glyph = (cycle < 0.665) ? '3' : 'D';
    rot = 180 + (cycle-0.63) * 4 * 180;
  }
  else if(cycle < 0.94){ glyph = 'D'; rot = 360 + (cycle-0.70)*10; }
  else {
    glyph = (cycle < 0.97) ? 'D' : 'm';
    rot = 360 + (cycle-0.94) * 4 * 360;
  }

  [$('brand-m'), $('load-m'), $('hm-m')].forEach(el => {
    if(!el) return;
    if(el.textContent !== glyph) el.textContent = glyph;
    el.style.transform = `rotate(${rot}deg)`;
  });
}

/* ═══════════ CAPTIONS + BEAT TITLES ═══════════ */
function updateBeats(){
  const p = S.progress;
  const b = currentBeat(p);

  toggle($('hero-monogram'), '-on', b === 1);
  toggle($('cap-chapter'), '-on', b <= 2);
  toggle($('cap-bottom'),  '-on', b === 2 || b === 3);
  toggle($('cap-folio'),   '-on', b === 4 || b === 5);

  applyBeatTitle('bt-sacred',   p > 0.10 && p < 0.24);
  applyBeatTitle('bt-dialogue', p > 0.28 && p < 0.40);
  applyBeatTitle('bt-ascent',   p > 0.44 && p < 0.58);
  applyBeatTitle('bt-self',     p > 0.68 && p < 0.78);

  toggle($('scroll-hint'), '-on', p < 0.04);

  const hubEl = $('skillhub');
  toggle(hubEl, '-on', b === 7);
  if(hubEl) hubEl.setAttribute('aria-hidden', b === 7 ? 'false' : 'true');

  toggle($('dawn-title'), '-on', p > 0.93);
  toggle($('jumper'), '-on', p > 0.94);

  for(let i = 0; i < DIALOGUE.length; i++){
    if(p >= DIALOGUE[i].at && i > S.dialogueIdx){
      showDialogue(i);
      break;
    }
  }
  if(p < DIALOGUE[0].at && S.mugenVisible){
    const mugenEl = $('mugen');
    if(mugenEl) mugenEl.classList.remove('-on');
    S.mugenVisible = false;
    S.dialogueIdx = -1;
  }

  const scrollPctEl = $('scroll-pct');
  const progressEl = $('progress');
  if(scrollPctEl) scrollPctEl.textContent = Math.round(p*100) + '%';
  if(progressEl) progressEl.style.width = (p*100) + '%';
  
  const statTopEl = $('stat-top');
  const statRunEl = $('stat-run');
  if(statTopEl) statTopEl.textContent = Math.round(S.smooth);
  if(statRunEl) statRunEl.textContent = Math.round(p*100);

  const sectionNames = [
    '', 'Codex', 'Sacred Tree', 'Dialogue',
    'Ascent', 'Thunder', 'Impact', 'Skill Hub', 'Moonlit', 'Dawn'
  ];
  
  const chLabelEl = $('ch-label');
  const chNumEl = $('ch-num');
  if(chLabelEl) chLabelEl.textContent = sectionNames[b] || 'Codex';
  if(chNumEl) chNumEl.textContent = String(b).padStart(2, '0');

  toggle($('meta-widget'), '-on', p > 0.08 && p < 0.96);
  
  const mwHourEl = $('mw-hour');
  const mwWindEl = $('mw-wind');
  if(mwHourEl){
    mwHourEl.textContent = [
      '', 'Nightfall', 'Dusk', 'Witching', 'Witching',
      'The Break', 'Silence', 'Paper Hour', 'Blue Hour', 'Daybreak'
    ][b] || '';
  }
  if(mwWindEl){
    mwWindEl.textContent = (b >= 4 && b <= 5) ? 'SW · GALE' : (b === 8) ? 'NE · SEA' : 'NE · LOW';
  }
}

function applyBeatTitle(id, on){
  const el = $(id);
  if(!el) return;
  if(on){
    if(!el.classList.contains('-on')){
      el.classList.add('-on');
      runScramble(el);
    }
  } else {
    el.classList.remove('-on');
  }
}

/* ═══════════ SKILL HUB POPULATE ═══════════ */
function buildSkillHub(){
  const host = $('skillhub-right');
  if(host) host.innerHTML = WORKS.map(w => `<div class="sh-row" data-cursor="hover"> <div class="sh-num">N° ${w.no}</div> <div class="sh-title-row">${w.title}</div> <div class="sh-role">${w.role}</div> <div class="sh-year">${w.year}</div> <div class="sh-desc">${w.desc}</div> </div>`).join('');
}
buildSkillHub();

/* ═══════════ CHAPTER JUMP ═══════════ */
const expandBtn = $('ch-expand');
if(expandBtn){
  expandBtn.addEventListener('click', e => {
    const item = e.target.closest('[data-jump]');
    if(!item) return;
    const pct = parseFloat(item.dataset.jump);
    if(!isNaN(pct)){
      updateScrollMax();
      scrollTo({ top: scrollMax * pct, behavior:'smooth' });
    }
  });
}

/* ═══════════ INK MODE (Luffy awakening) ═══════════ */
const jumperBtn = $('jumper');
if(jumperBtn) jumperBtn.addEventListener('click', toggleInkMode);

function toggleInkMode(){
  S.inkMode = !S.inkMode;
  const stageEl = $('stage');
  if(stageEl) stageEl.classList.toggle('-ink', S.inkMode);
  if(S.inkMode){
    S.inkClouds = [];
    for(let i=0; i<30; i++){
      S.inkClouds.push({
        x: -100 + Math.random()*innerWidth*0.3,
        y: innerHeight * (0.2 + Math.random()*0.8),
        r: 60 + Math.random()*180,
        vx: 2 + Math.random()*4,
        vy: (Math.random()-0.5)*0.5,
        life: 1,
        delay: Math.random()*0.8,
      });
    }
  }
}

function drawInk(){
  if(!ix) return;
  if(!S.inkMode){
    if(S.inkClouds.length) ix.clearRect(0, 0, innerWidth, innerHeight);
    S.inkClouds.length = 0;
    return;
  }
  ix.clearRect(0, 0, innerWidth, innerHeight);
  ix.save();

  S.inkClouds.forEach(c => {
    if(c.delay > 0){ c.delay -= S.dt; return; }
    c.x += c.vx;
    c.y += c.vy;
    c.r += 0.6;
    if(c.x > innerWidth + c.r) c.life -= 0.01;

    const g = ix.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
    g.addColorStop(0, `rgba(10,10,10,${0.55*c.life})`);
    g.addColorStop(0.5, `rgba(15,15,15,${0.42*c.life})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ix.fillStyle = g;
    ix.beginPath(); ix.arc(c.x, c.y, c.r, 0, Math.PI*2); ix.fill();
  });

  ix.globalCompositeOperation = 'source-over';
  for(let i=0; i<8; i++){
    const y = innerHeight*(0.15 + i*0.1);
    const phase = S.t*0.5 + i;
    ix.strokeStyle = `rgba(0,0,0,${0.3 + 0.1*Math.sin(phase)})`;
    ix.lineWidth = 2 + Math.sin(phase)*1;
    ix.lineCap = 'round';
    ix.beginPath();
    ix.moveTo(-20, y);
    for(let x=0; x<innerWidth+20; x+=30){
      ix.lineTo(x, y + Math.sin((x+phase*40)*0.01)*6);
    }
    ix.stroke();
  }

  for(let i=0; i<60; i++){
    const sx = ((i*127.3) % innerWidth);
    const sy = ((i*73.7) % (innerHeight*0.5));
    const tw = 0.4 + 0.3*Math.sin(S.t*2 + i);
    ix.fillStyle = `rgba(255,255,255,${0.5*tw})`;
    ix.beginPath(); ix.arc(sx, sy, 0.6+(i%3)*0.3, 0, Math.PI*2); ix.fill();
  }

  ix.restore();
}

/* ═══════════ CURSOR ═══════════ */
const cursor = $('cursor');
addEventListener('mousemove', e => {
  S.mx = e.clientX; S.my = e.clientY;
  S.nx = (e.clientX/innerWidth)*2 - 1;
  S.ny = -((e.clientY/innerHeight)*2 - 1);
  if(cursor){
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  }
});
document.addEventListener('mouseover', e => {
  if(cursor && e.target.closest('[data-cursor="hover"], button, .sh-row, .ch-item, .chapter-pill')){
    cursor.classList.add('-hover');
  }
});
document.addEventListener('mouseout', e => {
  if(cursor && e.target.closest('[data-cursor="hover"], button, .sh-row, .ch-item, .chapter-pill')){
    cursor.classList.remove('-hover');
  }
});

/* ═══════════ MAIN LOOP ═══════════ */
function loop(ts){
  requestAnimationFrame(loop);
  S.dt = Math.min((ts - S.lt)*0.001, 0.05);
  S.lt = ts;
  S.t += S.dt;

  S.fpsC++; S.fpsT += S.dt;
  if(S.fpsT >= 1){
    S.fps = Math.round(S.fpsC/S.fpsT);
    const statFpsEl = $('stat-fps');
    if(statFpsEl) statFpsEl.textContent = S.fps;
    S.fpsT = 0; S.fpsC = 0;
  }

  S.smooth += (S.scrollY - S.smooth) * 0.09;
  S.progress = Math.min(1, Math.max(0, S.smooth/scrollMax));

  if(!S.inkMode){
    updateBg();
    updateKatana();
    updateBeats();
    drawAtmos();
    if(R && SC && CAM) R.render(SC, CAM);
  } else {
    drawInk();
  }

  updateMGlyph();
}

/* ═══════════ BOOT ═══════════ */
const ldText = $('loader-text');
const ldBar  = $('loader-bar');
const ldPct  = $('loader-pct');
const STAGES = ['Forging · 鍛造', 'Tempering · 焼入', 'Polishing · 研磨', 'Awakening · 覚醒'];

let ldP = 0, ldStage = 0;
const ldInt = setInterval(() => {
  if(S.assetsReady) return;
  ldP += 0.8 + Math.random()*2;
  if(ldP > 35) ldP = 35;
  if(ldBar) ldBar.style.width = ldP + '%';
  if(ldPct) ldPct.textContent = String(Math.round(ldP)).padStart(3, '0') + ' %';
  if(ldP > 12 && ldStage === 0){ ldStage = 1; if(ldText) ldText.textContent = STAGES[1]; }
  if(ldP > 24 && ldStage === 1){ ldStage = 2; if(ldText) ldText.textContent = STAGES[2]; }
  if(ldP >= 35) clearInterval(ldInt);
}, 100);

function checkBoot(){
  if(S.modelReady && S.assetsReady){ boot(); }
}

function boot(){
  if(ldBar) ldBar.style.width = '100%';
  if(ldPct) ldPct.textContent = '100 %';
  if(ldText) ldText.textContent = STAGES[3];
  initAtmos();
  setTimeout(() => {
    const loaderEl = $('loader');
    if(loaderEl) loaderEl.classList.add('-out');
    S.lt = performance.now();
    updateScrollMax();
    scrollTo(0, 0);
    requestAnimationFrame(loop);
    setTimeout(() => { if(loaderEl) loaderEl.remove(); }, 2000);
  }, 700);
}

preloadImages([
  'assets/bg-hero.png',
  'assets/bg-clouds.png',
  'assets/bg-hilltop.png',
  'assets/bg-dawn.png',
  'assets/sensei-mugen.png',
  'assets/jumper-silhouette.png',
  'assets/texture-paper.jpg',
]).then(() => {
  S.assetsReady = true;
  if(ldBar) ldBar.style.width = '40%';
  checkBoot();
});

setTimeout(() => {
  if(!S.modelReady) S.modelReady = true;
  if(!S.assetsReady) S.assetsReady = true;
  checkBoot();
}, 20000);

updateScrollMax();

})();
