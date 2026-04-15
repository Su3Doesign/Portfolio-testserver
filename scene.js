/* ═══════════════════════════════════════════════════════════════
sumanth.D© — SCENE ENGINE v5 (god-tier)
✦ Full preload gate
✦ RoomEnvironment + PMREM for real blade reflections
✦ Scroll-bound progressive glass crack
✦ Bokeh fireflies + parallax stars
✦ Proper lightning with screen flash
✦ Ink mode → Hidden Vault transformation
✦ FPS-adaptive optimization
═══════════════════════════════════════════════════════════════ */

(() => {

const $ = id => document.getElementById(id);

/* ═══════════ STATE ═══════════ */
const S = {
scrollY:0, smooth:0, progress:0, lastSmooth:-999,
vw:innerWidth, vh:innerHeight,
dpr:Math.min(devicePixelRatio||1, 1.5),
mx:innerWidth/2, my:innerHeight/2, nx:0, ny:0,
t:0, lt:0, dt:0,
fps:60, fpsT:0, fpsC:0, lowFpsCount:0, perfMode:‘high’,
modelReady:false, assetsReady:false, envReady:false,
dialogueIdx:-1, mugenVisible:false,
inkMode:false, inkScrollY:0,
lightning:[], lightningT:0, flashIntensity:0,
inkClouds:[], inkPetals:[], inkStars:[],
bokeh:[], stars:[], petals:[], dandelions:[],
};

/* ═══════════ DIALOGUE ═══════════ */
const DIALOGUE = [
{ at:0.07, who:‘SENSEI MUGEN’, text:’<em>Hmm.</em> So you finally crossed the line. Sit, traveler — the road is long, and the blade is older than your grandfather.’ },
{ at:0.13, who:‘SENSEI MUGEN’, text:‘I am <strong>Mugen</strong>, ✦ keeper of unfinished worlds. This katana has cut the dreams of seventeen apprentices. Each returned home a craftsman.’ },
{ at:0.20, who:‘SENSEI MUGEN’, text:‘But none — <em>none</em> — became a builder of worlds. Few inherit the will. Fewer still answer it.’ },
{ at:0.27, who:‘SENSEI MUGEN’, text:‘Tell me, then. <strong>What world do you intend to build?</strong>’ },
{ at:0.33, who:‘sumanth.D’, text:’<em>The one I cannot find on any map.</em>’ },
{ at:0.41, who:‘SENSEI MUGEN’, text:‘Good. Then the blade goes with you. Through cloud. Through thunder. Through the breaking of this old world.’ },
{ at:0.52, who:‘SENSEI MUGEN’, text:‘They will tell you the sky has an edge. They are wrong. <em>You were made to find out.</em>’ },
{ at:0.66, who:‘SENSEI MUGEN’, text:‘Every crack you see was once the shape of somebody else's dream. Step over them. The self is a hill with a sea behind it.’ },
{ at:0.78, who:‘SENSEI MUGEN’, text:‘These are your works. Not trophies — <em>evidence</em>. Proof the hand moves when the will points.’ },
{ at:0.88, who:‘SENSEI MUGEN’, text:‘Now look up. The dawn does not arrive. It is <em>answered</em>.’ },
{ at:0.96, who:‘SENSEI MUGEN’, text:‘Go on, builder. 世界を創る者. The world is waiting for yours.’ },
];

/* ═══════════ WORKS (cappen ledger) ═══════════ */
const WORKS = [
{ no:‘01’, year:‘2025’, title:‘Fudō Myōō’,       role:‘Environment · Hard-Surface’, desc:‘A sanctum of still fire. Shingon iconography rendered as space.’ },
{ no:‘02’, year:‘2025’, title:‘Midea · Canada’,  role:‘Graphic Design’,             desc:‘Five sub-brands. Toronto, March through July.’ },
{ no:‘03’, year:‘2024’, title:‘Kōhaku’,          role:‘3D · Concept’,               desc:‘Silent koi. A study in subsurface and lanternlight.’ },
{ no:‘04’, year:‘2024’, title:‘KD Displays’,     role:‘Retail Environments’,        desc:‘Environmental graphics for Home Depot Canada lines.’ },
{ no:‘05’, year:‘2024’, title:‘Onibi’,           role:‘Hard-Surface’,               desc:‘Wandering-flame lanterns. Soft emissives, hand-tuned.’ },
{ no:‘06’, year:‘2023’, title:‘Investohome’,     role:‘Brand · Identity’,           desc:‘Full identity system for a Toronto real-estate venture.’ },
{ no:‘07’, year:‘2023’, title:‘The Iron Garden’, role:‘Environment · Coursework’,   desc:‘Rust and cherry branches. A study in rain memory.’ },
];

/* ═══════════ HIDDEN VAULT (top picks revealed only on awakening) ═══════════ */
const VAULT = [
{ no:‘I’,   tag:‘CROWN JEWEL’,  title:‘Fudō Myōō’,     sub:‘Personal · 2025’ },
{ no:‘II’,  tag:‘LIVING ROOM’,  title:‘Kōhaku’,        sub:‘Concept · 2024’ },
{ no:‘III’, tag:‘INDUSTRY’,     title:‘Midea Canada’,  sub:‘Toronto · 2025’ },
{ no:‘IV’,  tag:‘FIRST LIGHT’,  title:‘The Iron Garden’, sub:‘Coursework · 2023’ },
];

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
function currentBeat(p){
if(p < 0.08) return 1;
if(p < 0.22) return 2;
if(p < 0.38) return 3;
if(p < 0.50) return 4;
if(p < 0.62) return 5;
if(p < 0.74) return 6;
if(p < 0.85) return 7;
if(p < 0.96) return 8;
return 9;
}

/* ═══════════ SCROLL ═══════════ */
let scrollMax = 1;
function updateScrollMax(){
scrollMax = Math.max(1, document.documentElement.scrollHeight - innerHeight);
}
addEventListener(‘scroll’, () => { S.scrollY = scrollY; }, {passive:true});
addEventListener(‘resize’, () => {
S.vw = innerWidth; S.vh = innerHeight;
updateScrollMax();
if(R){ R.setSize(S.vw, S.vh); CAM.aspect = S.vw/S.vh; CAM.updateProjectionMatrix(); }
resizeCanvases();
buildCrackPaths(); // reflow cracks on resize
});

/* ═══════════ CANVASES ═══════════ */
const stars = $(‘stars’), atmos = $(‘atmos’), inkAtmos = $(‘ink-atmos’);
const sx = stars.getContext(‘2d’);
const ax = atmos.getContext(‘2d’);
const ix = inkAtmos.getContext(‘2d’);

function resizeCanvases(){
[[stars, sx], [atmos, ax], [inkAtmos, ix]].forEach(([c, ctx]) => {
c.width = innerWidth * S.dpr;
c.height = innerHeight * S.dpr;
ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
});
}
resizeCanvases();

/* ═══════════ THREE.JS ═══════════ */
let R, SC, CAM, KAT, envMap;
let hemiL, keyL, fillL, rimL, edgeAccent, moonL, sunL, flashL;

function initThree(){
R = new THREE.WebGLRenderer({
canvas:$(‘three’), antialias:true, alpha:true, powerPreference:‘high-performance’
});
R.setPixelRatio(S.dpr);
R.setSize(S.vw, S.vh);
R.toneMapping = THREE.ACESFilmicToneMapping;
R.toneMappingExposure = 1.05;
R.outputEncoding = THREE.sRGBEncoding;
R.setClearColor(0x000000, 0);

SC = new THREE.Scene();
CAM = new THREE.PerspectiveCamera(36, S.vw/S.vh, 0.01, 200);
CAM.position.set(0, 0, 5);

/* RoomEnvironment for blade reflections */
try {
if(typeof THREE.RoomEnvironment === ‘function’ && typeof THREE.PMREMGenerator === ‘function’){
const pmrem = new THREE.PMREMGenerator(R);
pmrem.compileEquirectangularShader();
envMap = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
SC.environment = envMap;
pmrem.dispose();
S.envReady = true;
console.log(‘✦ RoomEnvironment ready — blade will reflect properly’);
} else {
console.warn(‘RoomEnvironment unavailable — blade reflections will be flat’);
S.envReady = true; // continue regardless
}
} catch(e){
console.warn(‘PMREM init failed:’, e);
S.envReady = true;
}

/* Lighting suite */
hemiL = new THREE.HemisphereLight(0xffe0b8, 0x1a1512, 0.8);
SC.add(hemiL);

keyL = new THREE.DirectionalLight(0xffe0b8, 1.4);
keyL.position.set(-3, 5, 4); SC.add(keyL);

fillL = new THREE.DirectionalLight(0x402020, 0.5);
fillL.position.set(4, -1, 2); SC.add(fillL);

rimL = new THREE.DirectionalLight(0xff6030, 0.7);
rimL.position.set(0, -3, -4); SC.add(rimL);

edgeAccent = new THREE.PointLight(0xc83c28, 0, 6);
edgeAccent.position.set(0, 0, 0.4); SC.add(edgeAccent);

moonL = new THREE.DirectionalLight(0xb8cde8, 0);
moonL.position.set(3, 4, 2); SC.add(moonL);

sunL = new THREE.DirectionalLight(0xffa040, 0);
sunL.position.set(-2, 2, 3); SC.add(sunL);

// Lightning flash light
flashL = new THREE.PointLight(0xddeeff, 0, 18);
flashL.position.set(0, 4, 2); SC.add(flashL);

KAT = new THREE.Group();
SC.add(KAT);
}
initThree();

/* ═══════════ KATANA LOAD ═══════════ */
function getGLTFLoader(){
if(typeof THREE.GLTFLoader === ‘function’) return new THREE.GLTFLoader();
if(typeof window.GLTFLoader === ‘function’) return new window.GLTFLoader();
return null;
}

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
return { group:g, meshes:[blade, handle, tsuba] };
}

function finalizeKatana(model, meshes){
KAT.add(model);
KAT.userData.model = model;
KAT.userData.meshes = meshes;
S.modelReady = true;
console.log(‘✦ Katana ready’);
checkBoot();
}

function enhanceMat(m){
const mat = m.clone();
if(!mat.emissive) mat.emissive = new THREE.Color(0,0,0);
const col = mat.color || new THREE.Color(1,1,1);
const b = (col.r+col.g+col.b)/3;
if(b < 0.18){ mat.metalness = 0.95; mat.roughness = 0.08; }
else if(b < 0.5){ mat.metalness = 0.72; mat.roughness = 0.22; }
mat.envMapIntensity = 2.0;
return mat;
}

const gltfLoader = getGLTFLoader();
let gltfTimeout = setTimeout(() => {
console.warn(‘GLTF load timeout — using stand-in’);
const { group, meshes } = createStandinKatana();
finalizeKatana(group, meshes);
}, 15000);

if(gltfLoader){
gltfLoader.load(‘models/katana.glb’,
gltf => {
clearTimeout(gltfTimeout);
const m = gltf.scene;
const box = new THREE.Box3().setFromObject(m);
const sz = box.getSize(new THREE.Vector3());
const scale = 5.4 / Math.max(sz.x, sz.y, sz.z, 0.001);
m.scale.setScalar(scale);
const ctr = box.getCenter(new THREE.Vector3());
m.position.set(-ctr.x*scale, -ctr.y*scale, -ctr.z*scale);

```
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
    const pct = 50 + (xhr.loaded/xhr.total)*40;
    updateLoaderBar(pct);
  }
},
err => {
  clearTimeout(gltfTimeout);
  console.warn('GLB missing — using stand-in:', err);
  const { group, meshes } = createStandinKatana();
  finalizeKatana(group, meshes);
}
```

);
} else {
clearTimeout(gltfTimeout);
console.warn(‘No GLTFLoader — stand-in katana’);
const { group, meshes } = createStandinKatana();
finalizeKatana(group, meshes);
}

/* ═══════════ INIT PARTICLE SYSTEMS ═══════════ */
function initParticles(){
// Petals (beats 1-3)
for(let i=0; i<55; i++){
S.petals.push(spawnPetal(true));
}
// Stars — 3 depth layers
for(let i=0; i<140; i++){
S.stars.push({
x:Math.random()*innerWidth,
y:Math.random()*innerHeight,
r:0.3 + Math.random()*1.2,
depth:Math.random(), // 0=far, 1=near
twink:Math.random()*Math.PI*2,
twinkS:0.5 + Math.random()*1.5,
});
}
// Bokeh fireflies (beats 4-5, 9)
for(let i=0; i<24; i++){
S.bokeh.push({
x:Math.random()*innerWidth,
y:Math.random()*innerHeight,
r:8 + Math.random()*22,
vx:(Math.random()-.5)*0.3,
vy:-(0.1 + Math.random()*0.4),
pulse:Math.random()*Math.PI*2,
pulseS:0.6 + Math.random()*1.2,
depth:Math.random(),
});
}
// Dandelions (beats 8-9)
for(let i=0; i<22; i++){
S.dandelions.push({
x:Math.random()*innerWidth*1.3 - innerWidth*0.15,
y:Math.random()*innerHeight,
r:1.4+Math.random()*1.6,
vx:0.16+Math.random()*0.4,
vy:-0.04-Math.random()*0.06,
rot:Math.random()*Math.PI*2,
rotV:(Math.random()-.5)*0.018,
op:0.5+Math.random()*0.4,
});
}
// Ink-mode ambient particles (leaves, petals, sparkles)
for(let i=0; i<24; i++){
S.inkPetals.push({
x:Math.random()*innerWidth,
y:Math.random()*innerHeight,
sz:8+Math.random()*16,
rot:Math.random()*Math.PI*2,
rotV:(Math.random()-.5)*0.015,
vx:-0.2-Math.random()*0.4,
vy:0.1+Math.random()*0.3,
type:Math.random()<0.4 ? ‘leaf’ : (Math.random()<0.5 ? ‘petal’ : ‘star’),
op:0.4+Math.random()*0.4,
});
}
}

function spawnPetal(distribute){
const close = Math.random() < 0.07;
return {
x:Math.random()*innerWidth+120,
y:distribute?Math.random()*innerHeight:-30-Math.random()*80,
sz:close?16+Math.random()*16:3+Math.random()*5,
rot:Math.random()*Math.PI*2, rv:(Math.random()-.5)*.018,
vx:-.3-Math.random()*.7-(close?.3:0),
vy:.15+Math.random()*.4+(close?.3:0),
sw:Math.random()*Math.PI*2, ss:.005+Math.random()*.012,
sa:.3+Math.random()*1.0,
op:close?.3+Math.random()*.25:.35+Math.random()*.5,
glass:close,
};
}

/* ═══════════ STAR LAYER (parallax) ═══════════ */
function drawStars(){
const W = innerWidth, H = innerHeight;
sx.clearRect(0, 0, W, H);
const p = S.progress;

// Show stars in beats 1-2 and 8-9
const wStart = (1 - smoothstep(0.10, 0.18, p));
const wEnd   = smoothstep(0.82, 0.94, p);
const w = Math.max(wStart, wEnd);
if(w < 0.02) return;

S.stars.forEach(st => {
st.twink += S.dt * st.twinkS;
const base = 0.45 + 0.35 * Math.sin(st.twink);
// parallax by depth
const px = st.x + S.nx * (8 + st.depth*16);
const py = st.y + S.ny * (4 + st.depth*8) - p * (st.depth*40);
const wrappedY = ((py % H) + H) % H;
const r = st.r * (0.5 + st.depth*0.8);

```
// glow halo
const haloOp = base * w * 0.25 * st.depth;
if(haloOp > 0.02){
  const g = sx.createRadialGradient(px, wrappedY, 0, px, wrappedY, r*4);
  g.addColorStop(0, `rgba(245,237,224,${haloOp})`);
  g.addColorStop(1, 'rgba(245,237,224,0)');
  sx.fillStyle = g;
  sx.beginPath(); sx.arc(px, wrappedY, r*4, 0, Math.PI*2); sx.fill();
}
// core
sx.fillStyle = `rgba(245,237,224,${base * w})`;
sx.beginPath(); sx.arc(px, wrappedY, r, 0, Math.PI*2); sx.fill();
```

});
}

/* ═══════════ BG CROSS-FADE + PARALLAX ═══════════ */
function updateBg(){
const p = S.progress;
const wHero    = smoothstep(0.02, 0.10, p)  * (1 - smoothstep(0.36, 0.44, p));
const wClouds  = smoothstep(0.36, 0.44, p)  * (1 - smoothstep(0.62, 0.68, p));
const wImpact  = smoothstep(0.62, 0.66, p)  * (1 - smoothstep(0.72, 0.78, p));
const wPaper   = smoothstep(0.70, 0.78, p)  * (1 - smoothstep(0.83, 0.88, p));
const wHilltop = smoothstep(0.82, 0.88, p)  * (1 - smoothstep(0.94, 0.97, p));
const wDawn    = smoothstep(0.93, 0.97, p);

setLayerOpacity($(‘bg-hero’),    wHero);
setLayerOpacity($(‘bg-clouds’),  wClouds);
setLayerOpacity($(‘bg-impact’),  wImpact);
setLayerOpacity($(‘bg-paper’),   wPaper);
setLayerOpacity($(‘bg-hilltop’), wHilltop);
setLayerOpacity($(‘bg-dawn’),    wDawn);

setParallax($(‘bg-hero’),    p, 0.00, 0.38, 1.05, 1.12, S.nx*0.8, S.ny*0.6);
setParallax($(‘bg-clouds’),  p, 0.36, 0.62, 1.02, 1.10, S.nx*1.2, S.ny*0.8);
setParallax($(‘bg-paper’),   p, 0.68, 0.88, 1.00, 1.04, S.nx*0.3, S.ny*0.2);
setParallax($(‘bg-hilltop’), p, 0.82, 0.97, 1.04, 1.12, S.nx*0.6, S.ny*0.4);
setParallax($(‘bg-dawn’),    p, 0.93, 1.00, 1.02, 1.08, S.nx*0.4, S.ny*0.3);
}
function setLayerOpacity(el, w){
if(!el) return;
const v = w > 0.01 ? Math.min(1, w) : 0;
el.style.opacity = v;
toggle(el, ‘-on’, v > 0.01);
}
function setParallax(el, p, start, end, minS, maxS, mx, my){
if(!el) return;
const local = smoothstep(start, end, p);
const scale = lerp(minS, maxS, local);
el.style.transform = `translate3d(${(mx*10).toFixed(1)}px, ${(my*10 + local*-20).toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
}

/* ═══════════ KATANA CHOREOGRAPHY ═══════════ */
let scrollVel = 0, lastSmooth = 0;
function updateKatana(){
if(!KAT.userData.model) return;
const p = S.progress;

// scroll velocity (for tilt)
scrollVel = scrollVel * 0.9 + (S.smooth - lastSmooth) * 0.1;
lastSmooth = S.smooth;

let kx, ky, kz, rX, rY, rZ;

if(p < 0.08){
const t = smoothstep(0, 0.08, p);
kx = lerp(0.3, 0.2, t);  ky = -0.04;  kz = lerp(0.6, 0.9, t);
rX = 0;  rY = 0.3;  rZ = -Math.PI*0.42;
} else if(p < 0.22){
const t = smoothstep(0.08, 0.22, p);
kx = lerp(0.2, 0, t);  ky = lerp(-0.04, 0.05, t);  kz = lerp(0.9, 5.2, t);
rX = 0;  rY = lerp(0.3, 0, t);  rZ = lerp(-Math.PI*0.42, 0, t);
} else if(p < 0.38){
kx = Math.sin(S.t*.28)*.05;  ky = 0.05 + Math.sin(S.t*.45)*.02;
kz = lerp(5.2, 5.8, smoothstep(0.22, 0.38, p));
rX = Math.sin(S.t*.3)*.006;  rY = 0;  rZ = 0;
} else if(p < 0.50){
const t = smoothstep(0.38, 0.50, p);
kx = lerp(0, -1.4, t);  ky = lerp(0.05, 1.6, t);  kz = lerp(5.8, 4.4, t);
rX = lerp(0, -0.32, t);  rY = lerp(0, -0.4, t);  rZ = lerp(0, -Math.PI*0.25, t);
} else if(p < 0.62){
const t = smoothstep(0.50, 0.62, p);
kx = lerp(-1.4, 1.4, t);  ky = lerp(1.6, 0.4, t);  kz = lerp(4.4, 3.6, t);
rX = lerp(-0.32, -0.12, t);  rY = lerp(-0.4, 0.3, t);  rZ = lerp(-Math.PI*0.25, -Math.PI*0.06, t);
} else if(p < 0.74){
const t = smoothstep(0.62, 0.74, p);
kx = lerp(1.4, 0, t);  ky = lerp(0.4, -3.4, t);  kz = lerp(3.6, 2.4, t);
rX = lerp(-0.12, -Math.PI*0.25, t);  rY = lerp(0.3, 0, t);  rZ = lerp(-Math.PI*0.06, -Math.PI*0.5, t);
} else if(p < 0.85){
const t = smoothstep(0.74, 0.85, p);
kx = lerp(0, 3.4, t);  ky = lerp(-3.4, 2.0, t);  kz = lerp(2.4, 7.6, t);
rX = lerp(-Math.PI*0.25, 0.1, t);  rY = lerp(0, -0.3, t);  rZ = lerp(-Math.PI*0.5, -Math.PI*0.2, t);
} else if(p < 0.96){
const t = smoothstep(0.85, 0.96, p);
kx = lerp(3.4, -2.4, t);  ky = lerp(2.0, -0.8, t);  kz = lerp(7.6, 3.4, t);
rX = lerp(0.1, -0.08, t);  rY = lerp(-0.3, 0.2, t);  rZ = lerp(-Math.PI*0.2, -Math.PI*0.48, t);
} else {
kx = -2.4;  ky = -0.8 + Math.sin(S.t*0.5)*0.02;  kz = 3.4;
rX = -0.08;  rY = 0.2 + Math.sin(S.t*0.3)*0.02;  rZ = -Math.PI*0.48;
}

// breathing idle
ky += Math.sin(S.t*0.7)*0.005;
// scroll-velocity tilt
rZ += scrollVel * 0.0008;

KAT.position.set(kx + S.nx*0.03, ky + S.ny*0.03, kz);
KAT.rotation.set(rX, rY, rZ);

// light tuning
if(p < 0.38){
keyL.color.setHex(0xffe0b8); keyL.intensity = 1.4;
rimL.color.setHex(0xff6030); rimL.intensity = 0.7;
moonL.intensity = 0; sunL.intensity = 0;
} else if(p < 0.62){
keyL.color.setHex(0xffc890); keyL.intensity = 1.7;
rimL.color.setHex(0xc83c28); rimL.intensity = 0.9;
moonL.intensity = 0; sunL.intensity = 0;
} else if(p < 0.85){
keyL.color.setHex(0xffe8d0); keyL.intensity = 1.5;
rimL.color.setHex(0x8b6340); rimL.intensity = 0.4;
moonL.intensity = 0; sunL.intensity = 0;
} else if(p < 0.96){
keyL.color.setHex(0xb8cde8); keyL.intensity = 0.9;
rimL.color.setHex(0x3a4a6a); rimL.intensity = 0.6;
moonL.intensity = smoothstep(0.85, 0.96, p)*1.2; sunL.intensity = 0;
} else {
keyL.color.setHex(0xffd890); keyL.intensity = 1.1;
rimL.color.setHex(0xffa040); rimL.intensity = 1.0;
moonL.intensity = 0; sunL.intensity = 1.5;
}

edgeAccent.intensity = smoothstep(0.22, 0.60, p)*1.2 + smoothstep(0.88, 1.0, p)*0.9;
edgeAccent.position.set(KAT.position.x, KAT.position.y, KAT.position.z + 0.4);

// flash light decay
if(S.flashIntensity > 0){
flashL.intensity = S.flashIntensity * 12;
S.flashIntensity *= 0.85;
} else {
flashL.intensity = 0;
}

// emissive crawl
if(KAT.userData.meshes){
const eW = smoothstep(0.34, 0.66, p)*0.42 + smoothstep(0.88, 1.0, p)*0.25;
KAT.userData.meshes.forEach(m => {
if(m.material?.emissive){
const col = m.material.color;
const b = (col.r+col.g+col.b)/3;
if(b < 0.18){
m.material.emissive.setRGB(eW*0.28, eW*0.05, eW*0.02);
}
}
});
}
}

/* ═══════════ ATMOSPHERE — bokeh fireflies, petals, lightning, dandelions ═══════════ */
function drawPetalShape(ctx, sz, stroke){
for(let i=0; i<5; i++){
ctx.save();
ctx.rotate(i * Math.PI*2/5);
ctx.beginPath();
ctx.ellipse(0, -sz*.5, sz*.26, sz*.52, 0, 0, Math.PI*2);
if(stroke) ctx.stroke(); else ctx.fill();
ctx.restore();
}
}

function drawAtmos(){
const W = innerWidth, H = innerHeight;
ax.clearRect(0, 0, W, H);
const p = S.progress;

// ─── PETALS (beats 1-3, around tree) ───
const petalW = smoothstep(0.02, 0.08, p) * (1 - smoothstep(0.34, 0.42, p));
if(petalW > 0.01){
const wind = Math.sin(S.t*0.4)*1.1;
S.petals.forEach(pe => {
pe.sw += pe.ss;
pe.x += pe.vx + Math.sin(pe.sw)*pe.sa + wind;
pe.y += pe.vy;
pe.rot += pe.rv;
if(pe.y > H+40 || pe.x < -60){ Object.assign(pe, spawnPetal(false)); }

```
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
    drawPetalShape(ax, pe.sz);
    ax.filter = 'none';
    ax.strokeStyle = 'rgba(255,220,230,.55)';
    ax.lineWidth = 0.6;
    drawPetalShape(ax, pe.sz, true);
  } else {
    ax.fillStyle = 'rgba(220,80,60,1)';
    drawPetalShape(ax, pe.sz);
  }
  ax.restore();
});
```

}

// ─── BOKEH FIREFLIES (color shifts per beat) ───
let bokehColor = null;
if(p > 0.36 && p < 0.62) bokehColor = [255, 180, 100];   // warm gold/orange in clouds
else if(p > 0.82 && p < 0.94) bokehColor = [180, 210, 240]; // cool blue in moonlit
else if(p > 0.94) bokehColor = [255, 200, 120];          // golden in dawn
else if(p < 0.36) bokehColor = [220, 100, 80];           // red in tree

if(bokehColor && S.perfMode === ‘high’){
S.bokeh.forEach(b => {
b.x += b.vx; b.y += b.vy;
b.pulse += S.dt * b.pulseS;
if(b.y < -30) { b.y = H+30; b.x = Math.random()*W; }
if(b.x < -30) b.x = W+30;
if(b.x > W+30) b.x = -30;

```
  const pulse = 0.5 + 0.5*Math.sin(b.pulse);
  const px = b.x + S.nx * (10 + b.depth*20);
  const py = b.y + S.ny * (6 + b.depth*12);
  const r = b.r * (0.7 + b.depth*0.6);
  const op = pulse * (0.18 + b.depth*0.18);

  const g = ax.createRadialGradient(px, py, 0, px, py, r);
  g.addColorStop(0, `rgba(${bokehColor[0]},${bokehColor[1]},${bokehColor[2]},${op})`);
  g.addColorStop(.4, `rgba(${bokehColor[0]},${bokehColor[1]},${bokehColor[2]},${op*0.4})`);
  g.addColorStop(1, `rgba(${bokehColor[0]},${bokehColor[1]},${bokehColor[2]},0)`);
  ax.fillStyle = g;
  ax.beginPath(); ax.arc(px, py, r, 0, Math.PI*2); ax.fill();
});
```

}

// ─── LIGHTNING (beat 5) ───
if(p > 0.46 && p < 0.62){
S.lightningT -= S.dt;
if(S.lightningT <= 0){
spawnLightning();
S.lightningT = 0.6 + Math.random()*1.0;
}
}
drawLightning();

// ─── DANDELIONS (beats 8-9) ───
const dandW = smoothstep(0.82, 0.90, p);
if(dandW > 0.01){
S.dandelions.forEach(d => {
d.x += d.vx + Math.sin(S.t*0.3 + d.rot)*0.4;
d.y += d.vy;
d.rot += d.rotV;
if(d.x > W+40) d.x = -40;
if(d.y < -20) d.y = H+20;

```
  ax.save();
  ax.translate(d.x, d.y);
  ax.rotate(d.rot);
  ax.globalAlpha = d.op * dandW;
  ax.fillStyle = 'rgba(245,238,220,.78)';
  ax.beginPath(); ax.arc(0, 0, d.r*0.5, 0, Math.PI*2); ax.fill();
  ax.strokeStyle = 'rgba(245,238,220,.5)';
  ax.lineWidth = 0.5;
  const bristles = 10;
  for(let i=0; i<bristles; i++){
    const a = i/bristles * Math.PI*2;
    ax.beginPath();
    ax.moveTo(0, 0);
    ax.lineTo(Math.cos(a)*d.r*2.6, Math.sin(a)*d.r*2.6);
    ax.stroke();
  }
  ax.fillStyle = 'rgba(250,245,230,.65)';
  for(let i=0; i<bristles; i++){
    const a = i/bristles * Math.PI*2;
    ax.beginPath();
    ax.arc(Math.cos(a)*d.r*2.6, Math.sin(a)*d.r*2.6, 0.7, 0, Math.PI*2);
    ax.fill();
  }
  ax.restore();
});
```

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
// fire screen flash
S.flashIntensity = 1.0;
toggle($(‘overlay-chromatic’), ‘-strong’, true);
setTimeout(() => toggle($(‘overlay-chromatic’), ‘-strong’, false), 220);
}
function lightningSegments(x1, y1, x2, y2, detail, seed){
const segs = [[x1, y1]];
const N = 12;
const rng = s => { const x = Math.sin(s+seed)*43758.5; return x - Math.floor(x); };
for(let i=1; i<N; i++){
const t = i/N;
const tx = x1+(x2-x1)*t, ty = y1+(y2-y1)*t;
const offset = detail*(rng(i*3.7)-0.5)*46;
const perpX = -(y2-y1), perpY = (x2-x1);
const pl = Math.hypot(perpX, perpY);
segs.push([tx+perpX/pl*offset, ty+perpY/pl*offset]);
}
segs.push([x2, y2]);
return segs;
}
function drawLightning(){
S.lightning = S.lightning.filter(b => b.life > 0);
S.lightning.forEach(b => {
b.life -= b.decay;
const op = Math.max(0, b.life);
const segs = lightningSegments(b.x1, b.y1, b.x2, b.y2, b.life, b.seed);
ax.lineCap = ‘round’; ax.lineJoin = ‘round’;

```
// outer halo
ax.strokeStyle = `rgba(180,140,255,${op*0.25})`; ax.lineWidth = 14;
drawPath(ax, segs);
// mid glow
ax.strokeStyle = `rgba(220,200,255,${op*0.55})`; ax.lineWidth = 5;
drawPath(ax, segs);
// bright core
ax.strokeStyle = `rgba(255,250,255,${op})`; ax.lineWidth = 1.5;
drawPath(ax, segs);

// branches
for(let k=0; k<b.branches; k++){
  const si = Math.floor(segs.length*(0.3+k*0.18));
  if(si >= segs.length-1) continue;
  const sp = segs[si];
  const bAng = Math.atan2(b.y2-b.y1, b.x2-b.x1) + (Math.random()-0.5)*1.5;
  const bLen = 50+Math.random()*80;
  const bx2 = sp[0]+Math.cos(bAng)*bLen;
  const by2 = sp[1]+Math.sin(bAng)*bLen;
  const bSegs = lightningSegments(sp[0], sp[1], bx2, by2, b.life*0.8, b.seed+k*7);
  ax.strokeStyle = `rgba(220,200,255,${op*0.3})`; ax.lineWidth = 6;
  drawPath(ax, bSegs);
  ax.strokeStyle = `rgba(255,240,255,${op*0.8})`; ax.lineWidth = 1;
  drawPath(ax, bSegs);
}
```

});
}
function drawPath(ctx, segs){
ctx.beginPath();
segs.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
ctx.stroke();
}

/* ═══════════ SCROLL-BOUND GLASS CRACK ═══════════ */
let crackPaths = []; // SVG path strings

function buildCrackPaths(){
// 14 fracture lines radiating from center, each with branching sub-cracks
const cx = 960, cy = 540;
const svg = $(‘crack-svg’);
// remove old paths (keep <defs>)
svg.querySelectorAll(‘path’).forEach(p => p.remove());
crackPaths = [];

const N = 16;
for(let i=0; i<N; i++){
const ang = (i/N) * Math.PI*2 + (Math.random()-0.5)*0.2;
const len = 600 + Math.random()*700;

```
let d = `M ${cx} ${cy}`;
let x = cx, y = cy;
const steps = 6;
for(let s=0; s<steps; s++){
  const segLen = len/steps;
  const wobble = (Math.random()-0.5)*0.5;
  const a = ang + wobble;
  x += Math.cos(a)*segLen;
  y += Math.sin(a)*segLen;
  d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
}

const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
path.setAttribute('d', d);
svg.appendChild(path);

const length = path.getTotalLength();
path.style.strokeDasharray = length;
path.style.strokeDashoffset = length;
crackPaths.push({ path, length });

// branches
if(Math.random() > 0.4){
  const branchAt = 0.3 + Math.random()*0.4;
  let bx = cx + Math.cos(ang)*len*branchAt;
  let by = cy + Math.sin(ang)*len*branchAt;
  const bAng = ang + (Math.random()-0.5)*1.4;
  const bLen = 200 + Math.random()*300;
  let bd = `M ${bx} ${by}`;
  const bSteps = 4;
  for(let s=0; s<bSteps; s++){
    const segLen = bLen/bSteps;
    const wobble = (Math.random()-0.5)*0.6;
    const a = bAng + wobble;
    bx += Math.cos(a)*segLen;
    by += Math.sin(a)*segLen;
    bd += ` L ${bx.toFixed(1)} ${by.toFixed(1)}`;
  }
  const bp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  bp.setAttribute('d', bd);
  bp.style.strokeWidth = '0.9';
  svg.appendChild(bp);
  const bl = bp.getTotalLength();
  bp.style.strokeDasharray = bl;
  bp.style.strokeDashoffset = bl;
  crackPaths.push({ path:bp, length:bl });
}
```

}
}

function updateCrack(){
const p = S.progress;
// crack progress: fades in 0.58 → reaches full at 0.74
const cp = smoothstep(0.58, 0.74, p);
const layer = $(‘glass-crack’);
toggle(layer, ‘-on’, cp > 0.01);
toggle(layer, ‘-cracking’, cp > 0.01);
if(layer) layer.style.setProperty(’–crack-progress’, cp);

crackPaths.forEach(({path, length}, i) => {
// staggered draw — each crack starts at a slightly different progress
const stagger = i * 0.025;
const local = Math.max(0, Math.min(1, (cp - stagger) * (1 + stagger)));
path.style.strokeDashoffset = length * (1 - local);
});
}

/* ═══════════ M-GLYPH MORPH ═══════════ */
function updateMGlyph(){
const cycle = (S.t % 12) / 12;
let glyph = ‘m’, rot = 0;
if(cycle < 0.30){ glyph = ‘m’; rot = cycle*8; }
else if(cycle < 0.36){ glyph = ‘3’; rot = (cycle-0.30) * 4 * 180; }
else if(cycle < 0.63){ glyph = ‘3’; rot = 90 + (cycle-0.36)*8; }
else if(cycle < 0.70){ glyph = ‘D’; rot = 180 + (cycle-0.63) * 4 * 180; }
else if(cycle < 0.94){ glyph = ‘D’; rot = 360 + (cycle-0.70)*8; }
else { glyph = ‘m’; rot = 360 + (cycle-0.94) * 4 * 360; }

[$(‘brand-m’), $(‘load-m’), $(‘hm-m’)].forEach(el => {
if(!el) return;
if(el.textContent !== glyph) el.textContent = glyph;
el.style.transform = `rotate(${rot.toFixed(1)}deg)`;
});
}

/* ═══════════ GLITCH SCRAMBLER ═══════════ */
const KANA = ‘アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン’;
const KANJI = ‘刀剣魂創造夢幻覚醒風炎月海’;
const SYMBOLS = ‘▓▒░│┤┐└┴┬├─┼╪’;
function scrambleChar(){
const src = Math.random() < 0.5 ? KANA : (Math.random() < 0.6 ? KANJI : SYMBOLS);
return src[Math.floor(Math.random()*src.length)];
}
function runScramble(el){
if(el._scrambling) return;
const target = el.dataset.target;
if(!target) return;
el._scrambling = true;
const lines = target.split(’|’);
const plainLines = lines.map(l => l.replace(/<[^>]+>/g, ‘’));
const steps = 14;
let step = 0;
const tick = () => {
step++;
const prog = step/steps;
if(step >= steps){
el.innerHTML = lines.join(’<br>’);
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
el.innerHTML = mixed.join(’<br>’);
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
if(!S.mugenVisible){ $(‘mugen’).classList.add(’-on’); S.mugenVisible = true; }
$(‘mb-who’).textContent = d.who;
if(typingJob) clearInterval(typingJob);
const target = d.text;
let i = 0;
$(‘mb-text’).innerHTML = ‘’;
typingJob = setInterval(() => {
i++;
let preview = target.slice(0, i);
const open = […preview.matchAll(/<(\w+)[^>]*>/g)].map(m => m[1]);
const close = […preview.matchAll(/</(\w+)>/g)].map(m => m[1]);
const unclosed = open.filter(t => {
const oi = open.indexOf(t);
const ci = close.indexOf(t);
return oi !== -1 && (ci === -1 || ci < oi);
});
let display = preview;
unclosed.forEach(t => display += `</${t}>`);
$(‘mb-text’).innerHTML = display;
if(i >= target.length){ clearInterval(typingJob); typingJob = null; }
}, 22);
}

/* ═══════════ BEATS ORCHESTRATION ═══════════ */
function updateBeats(){
const p = S.progress;
const b = currentBeat(p);

toggle($(‘hero-monogram’), ‘-on’, b === 1);
toggle($(‘cap-chapter’), ‘-on’, b <= 2);
toggle($(‘cap-bottom’),  ‘-on’, b === 2 || b === 3);
toggle($(‘cap-folio’),   ‘-on’, b === 4 || b === 5);

applyBeatTitle(‘bt-sacred’,   p > 0.10 && p < 0.24);
applyBeatTitle(‘bt-dialogue’, p > 0.28 && p < 0.40);
applyBeatTitle(‘bt-ascent’,   p > 0.44 && p < 0.58);
applyBeatTitle(‘bt-self’,     p > 0.70 && p < 0.78);

toggle($(‘scroll-hint’), ‘-on’, p < 0.04);
toggle($(‘skillhub’), ‘-on’, b === 7);
$(‘skillhub’).setAttribute(‘aria-hidden’, b === 7 ? ‘false’ : ‘true’);
toggle($(‘dawn-title’), ‘-on’, p > 0.93);
toggle($(‘jumper’), ‘-on’, p > 0.94);

// Sun position adjusts based on which scene Luffy appears in
const jumper = $(‘jumper’);
if(p > 0.94){
// bg-dawn: sun is roughly center-50% horizontally, 48% vertically
jumper.style.setProperty(’–sun-x’, ‘50%’);
jumper.style.setProperty(’–sun-y’, ‘48%’);
} else if(p > 0.85){
// bg-hilltop: moon at ~38% x, 18% y
jumper.style.setProperty(’–sun-x’, ‘38%’);
jumper.style.setProperty(’–sun-y’, ‘24%’);
}

for(let i = 0; i < DIALOGUE.length; i++){
if(p >= DIALOGUE[i].at && i > S.dialogueIdx){ showDialogue(i); break; }
}
if(p < DIALOGUE[0].at && S.mugenVisible){
$(‘mugen’).classList.remove(’-on’);
S.mugenVisible = false;
S.dialogueIdx = -1;
}

$(‘scroll-pct’).textContent = Math.round(p*100) + ‘%’;
$(‘progress’).style.width = (p*100) + ‘%’;
$(‘stat-run’).textContent = Math.round(p*100);
const sectionNames = [’’, ‘Codex’, ‘Sacred Tree’, ‘Dialogue’, ‘Ascent’, ‘Thunder’, ‘Impact’, ‘Skill Hub’, ‘Moonlit’, ‘Dawn’];
$(‘ch-label’).textContent = sectionNames[b] || ‘Codex’;
$(‘ch-num’).textContent = String(b).padStart(2, ‘0’);
$(‘stat-mode’).textContent = (sectionNames[b] || ‘Codex’).toUpperCase();

toggle($(‘meta-widget’), ‘-on’, p > 0.08 && p < 0.96);
$(‘mw-hour’).textContent = [’’, ‘Nightfall’, ‘Dusk’, ‘Witching’, ‘Witching’, ‘The Break’, ‘Silence’, ‘Paper Hour’, ‘Blue Hour’, ‘Daybreak’][b] || ‘’;
$(‘mw-wind’).textContent = (b >= 4 && b <= 5) ? ‘SW · GALE’ : (b === 8) ? ‘NE · SEA’ : ‘NE · LOW’;
}

function applyBeatTitle(id, on){
const el = $(id);
if(!el) return;
if(on){
if(!el.classList.contains(’-on’)){
el.classList.add(’-on’);
runScramble(el);
}
} else {
el.classList.remove(’-on’);
}
}

/* ═══════════ POPULATE ═══════════ */
function buildSkillHub(){
$(‘skillhub-right’).innerHTML = WORKS.map(w => `<div class="sh-row" data-cursor="hover"> <div class="sh-num">N° ${w.no}</div> <div class="sh-title-row">${w.title}</div> <div class="sh-role">${w.role}</div> <div class="sh-year">${w.year}</div> <div class="sh-desc">${w.desc}</div> </div>`).join(’’);
}
function buildVault(){
$(‘vault-grid’).innerHTML = VAULT.map(v => `<div class="vault-card" data-cursor="hover"> <div class="vc-no">N° ${v.no}</div> <div class="vc-tag">${v.tag}</div> <div class="vc-title">${v.title}</div> <div class="vc-sub">${v.sub}</div> </div>`).join(’’);
}
buildSkillHub();
buildVault();

/* ═══════════ CHAPTER JUMP ═══════════ */
$(‘ch-expand’).addEventListener(‘click’, e => {
const item = e.target.closest(’[data-jump]’);
if(!item) return;
const pct = parseFloat(item.dataset.jump);
if(!isNaN(pct)){
updateScrollMax();
scrollTo({ top: scrollMax * pct, behavior:‘smooth’ });
}
});

/* ═══════════ INK MODE ═══════════ */
$(‘jumper’).addEventListener(‘click’, toggleInkMode);

function toggleInkMode(){
S.inkMode = !S.inkMode;
$(‘stage’).classList.toggle(’-ink’, S.inkMode);
$(‘ink-system’).classList.toggle(’-on’, S.inkMode);
$(‘ink-system’).setAttribute(‘aria-hidden’, S.inkMode ? ‘false’ : ‘true’);

if(S.inkMode){
S.inkScrollY = scrollY;
S.inkClouds = [];
for(let i=0; i<35; i++){
S.inkClouds.push({
x: -120 + Math.random()*innerWidth*0.25,
y: innerHeight*(0.15 + Math.random()*0.7),
r: 70 + Math.random()*200,
vx: 2.5+Math.random()*4,
vy: (Math.random()-0.5)*0.5,
life: 1,
delay: Math.random()*0.8,
});
}
}
}

function drawInk(){
if(!S.inkMode){
if(S.inkClouds.length){ ix.clearRect(0, 0, innerWidth, innerHeight); S.inkClouds.length = 0; }
return;
}
ix.clearRect(0, 0, innerWidth, innerHeight);

// ink tsunami
S.inkClouds.forEach(c => {
if(c.delay > 0){ c.delay -= S.dt; return; }
c.x += c.vx; c.y += c.vy; c.r += 0.8;
if(c.x > innerWidth + c.r) c.life -= 0.012;
const g = ix.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
g.addColorStop(0, `rgba(10,9,6,${0.42*c.life})`);
g.addColorStop(0.5, `rgba(15,12,8,${0.32*c.life})`);
g.addColorStop(1, ‘rgba(0,0,0,0)’);
ix.fillStyle = g;
ix.beginPath(); ix.arc(c.x, c.y, c.r, 0, Math.PI*2); ix.fill();
});

// flowing ink lines
ix.strokeStyle = ‘rgba(10,9,6,.18)’;
ix.lineWidth = 1.2;
for(let i=0; i<6; i++){
const y = innerHeight*(0.15 + i*0.13);
const phase = S.t*0.4 + i;
ix.beginPath();
ix.moveTo(-20, y);
for(let x=0; x<innerWidth+20; x+=24){
ix.lineTo(x, y + Math.sin((x+phase*40)*0.012)*8);
}
ix.stroke();
}

// monochrome ink particles (leaves, petals, stars)
S.inkPetals.forEach(ip => {
ip.x += ip.vx; ip.y += ip.vy;
ip.rot += ip.rotV;
if(ip.x < -30) ip.x = innerWidth+30;
if(ip.y > innerHeight+30){ ip.y = -30; ip.x = Math.random()*innerWidth; }

```
ix.save();
ix.translate(ip.x, ip.y);
ix.rotate(ip.rot);
ix.globalAlpha = ip.op;
ix.fillStyle = '#0a0906';

if(ip.type === 'leaf'){
  ix.beginPath();
  ix.ellipse(0, 0, ip.sz*0.4, ip.sz, 0, 0, Math.PI*2);
  ix.fill();
  ix.strokeStyle = 'rgba(245,237,224,.25)';
  ix.lineWidth = 0.5;
  ix.beginPath();
  ix.moveTo(0, -ip.sz);
  ix.lineTo(0, ip.sz);
  ix.stroke();
} else if(ip.type === 'petal'){
  drawPetalShape(ix, ip.sz*0.5);
} else {
  // ✨ four-point star
  ix.beginPath();
  const pts = 4;
  for(let i=0; i<pts*2; i++){
    const ang = (i/(pts*2)) * Math.PI*2;
    const r = i%2 === 0 ? ip.sz*0.5 : ip.sz*0.2;
    const x = Math.cos(ang)*r, y = Math.sin(ang)*r;
    if(i===0) ix.moveTo(x, y); else ix.lineTo(x, y);
  }
  ix.closePath();
  ix.fill();
}
ix.restore();
```

});
}

/* ═══════════ CURSOR ═══════════ */
const cursor = $(‘cursor’);
addEventListener(‘mousemove’, e => {
S.mx = e.clientX; S.my = e.clientY;
S.nx = (e.clientX/innerWidth)*2 - 1;
S.ny = -((e.clientY/innerHeight)*2 - 1);
cursor.style.left = e.clientX + ‘px’;
cursor.style.top  = e.clientY + ‘px’;
});
document.addEventListener(‘mouseover’, e => {
if(e.target.closest(’[data-cursor=“hover”], button, .sh-row, .ch-item, .chapter-pill, .vault-card’)){
cursor.classList.add(’-hover’);
}
});
document.addEventListener(‘mouseout’, e => {
if(e.target.closest(’[data-cursor=“hover”], button, .sh-row, .ch-item, .chapter-pill, .vault-card’)){
cursor.classList.remove(’-hover’);
}
});

/* ═══════════ FPS-ADAPTIVE PERF ═══════════ */
function checkPerf(){
if(S.fps < 50){
S.lowFpsCount++;
if(S.lowFpsCount > 3 && S.perfMode === ‘high’){
S.perfMode = ‘low’;
console.log(‘▼ Switching to low-perf mode’);
$(‘overlay-grain’).style.display = ‘none’;
S.dpr = 1;
resizeCanvases();
if(R) R.setPixelRatio(1);
}
} else {
S.lowFpsCount = Math.max(0, S.lowFpsCount-1);
}
}

/* ═══════════ MAIN LOOP ═══════════ */
function loop(ts){
requestAnimationFrame(loop);
S.dt = Math.min((ts - S.lt)*0.001, 0.05);
S.lt = ts;
S.t += S.dt;

S.fpsC++; S.fpsT += S.dt;
if(S.fpsT >= 1){
S.fps = Math.round(S.fpsC/S.fpsT);
$(‘stat-fps’).textContent = S.fps;
S.fpsT = 0; S.fpsC = 0;
checkPerf();
}

S.smooth += (S.scrollY - S.smooth) * 0.09;
S.progress = Math.min(1, Math.max(0, S.smooth/scrollMax));

if(!S.inkMode){
updateBg();
updateKatana();
updateBeats();
updateCrack();
drawStars();
drawAtmos();
if(R) R.render(SC, CAM);
} else {
drawInk();
if(R){
// sword still visible in ink mode but only as silhouette via CSS filter
updateKatana();
R.render(SC, CAM);
}
}

updateMGlyph();
S.lastSmooth = S.smooth;
}

/* ═══════════ BOOT ═══════════ */
const ldText = $(‘loader-text’);
const ldBar = $(‘loader-bar’);
const ldPct = $(‘loader-pct’);
const STAGES = [‘Forging · 鍛造’, ‘Tempering · 焼入’, ‘Polishing · 研磨’, ‘Awakening · 覚醒’];

function updateLoaderBar(pct){
ldBar.style.width = pct + ‘%’;
ldPct.textContent = String(Math.round(pct)).padStart(3, ‘0’) + ’ %’;
}

let ldP = 0, ldStage = 0;
const ldInt = setInterval(() => {
if(S.assetsReady && S.modelReady) return;
ldP += 0.4 + Math.random()*1.2;
if(ldP > 30) ldP = 30;
updateLoaderBar(ldP);
if(ldP > 12 && ldStage === 0){ ldStage = 1; ldText.textContent = STAGES[1]; }
if(ldP > 22 && ldStage === 1){ ldStage = 2; ldText.textContent = STAGES[2]; }
if(ldP >= 30) clearInterval(ldInt);
}, 100);

// show skip button after 8 seconds
setTimeout(() => $(‘loader-skip’).classList.add(’-show’), 8000);
$(‘loader-skip’).addEventListener(‘click’, () => {
S.modelReady = true;
S.assetsReady = true;
checkBoot();
});

function checkBoot(){
if(S.modelReady && S.assetsReady) boot();
}

function boot(){
if(S.booted) return;
S.booted = true;
updateLoaderBar(100);
ldText.textContent = STAGES[3];

initParticles();
buildCrackPaths();

setTimeout(() => {
$(‘loader’).classList.add(’-out’);
S.lt = performance.now();
updateScrollMax();
scrollTo(0, 0);
requestAnimationFrame(loop);
setTimeout(() => $(‘loader’).remove(), 2000);
}, 700);
}

// preload assets
function preloadImages(urls){
return Promise.all(urls.map(u => new Promise(resolve => {
const img = new Image();
img.onload = img.onerror = () => resolve(u);
img.src = u;
})));
}
preloadImages([
‘assets/bg-hero.png’,
‘assets/bg-clouds.png’,
‘assets/bg-hilltop.png’,
‘assets/bg-dawn.png’,
‘assets/sensei-mugen.png’,
‘assets/jumper-silhouette.png’,
‘assets/texture-paper.jpg’,
]).then(() => {
S.assetsReady = true;
console.log(‘✦ All images loaded’);
updateLoaderBar(45);
checkBoot();
});

// failsafe
setTimeout(() => {
if(!S.modelReady){ console.warn(‘Model failsafe triggered’); S.modelReady = true; }
if(!S.assetsReady){ console.warn(‘Assets failsafe triggered’); S.assetsReady = true; }
checkBoot();
}, 20000);

updateScrollMax();

})();
