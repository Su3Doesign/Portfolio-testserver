/* =================================================================
sumanth.D (c) - SCENE ENGINE v6 FINAL

- Breathing zones between beats (no congestion)
- Sumi ink bleed replaces shatter
- Jelly glass mouse tracking on titles
- Interactive scrollable emaki vault on Luffy click
- Sword: scroll-driven only, slight parallax, never clips
- Hero monogram fits viewport
- ASCII-only code paths (no smart quotes)
  ================================================================= */

(function(){

var $ = function(id){ return document.getElementById(id); };

/* ============== STATE ============== */
var S = {
  scrollY:0, smooth:0, progress:0,
  vw:innerWidth, vh:innerHeight,
  dpr:Math.min(devicePixelRatio||1, 1.5),
  mx:innerWidth/2, my:innerHeight/2, nx:0, ny:0,
  t:0, lt:0, dt:0,
  fps:60, fpsT:0, fpsC:0, lowFpsCount:0, perfMode:'high',
  modelReady:false, assetsReady:false, booted:false,
  dialogueIdx:-1, mugenVisible:false,
  inkMode:false,
  lightning:[], lightningT:0, flashIntensity:0,
  inkClouds:[], inkPetals:[],
  bokeh:[], stars:[], petals:[], dandelions:[],
};

/* ============== DIALOGUE ============== */
var DIALOGUE = [
  { at:0.08, who:'SENSEI MUGEN', text:'<em>Hmm.</em> So you finally crossed the line. Sit, traveler - the road is long, and the blade is older than your grandfather.' },
  { at:0.15, who:'SENSEI MUGEN', text:'I am <strong>Mugen</strong>, keeper of unfinished worlds. This katana has cut the dreams of seventeen apprentices. Each returned home a craftsman.' },
  { at:0.23, who:'SENSEI MUGEN', text:'But none - <em>none</em> - became a builder of worlds. Few inherit the will. Fewer still answer it.' },
  { at:0.31, who:'SENSEI MUGEN', text:'Tell me, then. <strong>What world do you intend to build?</strong>' },
  { at:0.38, who:'sumanth.D', text:'<em>The one I cannot find on any map.</em>' },
  { at:0.46, who:'SENSEI MUGEN', text:'Good. Then the blade goes with you. Through cloud. Through thunder. Through the breaking of this old world.' },
  { at:0.56, who:'SENSEI MUGEN', text:'They will tell you the sky has an edge. They are wrong. <em>You were made to find out.</em>' },
  { at:0.66, who:'SENSEI MUGEN', text:"Every stroke of ink you see was once the shape of somebody else's dream. Step over them." },
  { at:0.77, who:'SENSEI MUGEN', text:'These are your works. Not trophies - <em>evidence</em>. Proof the hand moves when the will points.' },
  { at:0.95, who:'SENSEI MUGEN', text:'Now look up. The dawn does not arrive. It is <em>answered</em>.' },
  { at:0.99, who:'SENSEI MUGEN', text:'Go on, builder. The world is waiting for yours.' },
];

/* ============== WORKS LEDGER ============== */
var WORKS = [
  { no:'01', year:'2025', title:'Kohaku',          role:'3D Concept'            },
  { no:'02', year:'2025', title:'Midea Canada',    role:'Graphic Design'        },
  { no:'03', year:'2024', title:'Onibi',           role:'Hard-Surface'          },
  { no:'04', year:'2024', title:'KD Displays',     role:'Retail Environments'   },
  { no:'05', year:'2023', title:'Investohome',     role:'Brand Identity'        },
  { no:'06', year:'2023', title:'The Iron Garden', role:'Environment Coursework'},
  { no:'07', year:'2022', title:'Early Studies',   role:'Foundation Work'       },
];

/* ============== HIDDEN VAULT (revealed on awakening) ============== */
var VAULT = [
  { no:'I',   art:'\u5200', tag:'CROWN JEWEL',  title:'Fudo Myoo', sub:'Environment - Personal - 2025', desc:'A sanctum of still fire. Shingon iconography rendered as walkable space.', meta:[['YEAR','2025'],['TYPE','Personal'],['STACK','Blender / Substance']] },
  { no:'II',  art:'\u6D77', tag:'LIVING ROOM',  title:'Kohaku',    sub:'Concept - 2024',                 desc:'Silent koi. Studies in subsurface scatter and lanternlight above water.', meta:[['YEAR','2024'],['TYPE','Concept'],['STACK','Blender / ZBrush']] },
  { no:'III', art:'\u98A8', tag:'INDUSTRY',     title:'Midea Canada', sub:'Toronto - 2025',             desc:'Five sub-brand campaigns across a Canadian retail year. First international placement.', meta:[['YEAR','2025'],['TYPE','Placement'],['STACK','Adobe Suite']] },
  { no:'IV',  art:'\u5922', tag:'FIRST LIGHT',  title:'The Iron Garden', sub:'Coursework - 2023',       desc:'Rust and cherry branches. A study in rain memory.', meta:[['YEAR','2023'],['TYPE','Coursework'],['STACK','Unreal / Quixel']] },
];

/* ============== UTIL ============== */
function smoothstep(a, b, x){
  var t = Math.max(0, Math.min(1, (x-a)/(b-a)));
  return t*t*(3 - 2*t);
}
function lerp(a, b, t){ return a + (b-a)*t; }
function toggle(el, cls, on){
  if(!el) return;
  if(on) el.classList.add(cls); else el.classList.remove(cls);
}
function currentBeat(p){
  if(p < 0.07) return 1;
  if(p < 0.22) return 2;
  if(p < 0.38) return 3;
  if(p < 0.54) return 4;
  if(p < 0.62) return 5;
  if(p < 0.72) return 6;
  if(p < 0.94) return 7;
  if(p < 0.98) return 8;
  return 9;
}

/* ============== WRAP BEAT-TITLES IN INNER DIVS ============== */
['bt-sacred','bt-dialogue','bt-ascent','bt-self'].forEach(function(id){
  var el = $(id);
  if(!el) return;
  var inner = document.createElement('div');
  inner.className = 'bt-inner';
  var orig = el.innerHTML;
  el.innerHTML = '';
  inner.innerHTML = orig;
  el.appendChild(inner);
});

/* ============== SCROLL ============== */
var scrollMax = 1;
function updateScrollMax(){ scrollMax = Math.max(1, document.documentElement.scrollHeight - innerHeight); }
window.addEventListener('scroll', function(){ S.scrollY = window.scrollY; }, {passive:true});
window.addEventListener('resize', function(){
  S.vw = innerWidth; S.vh = innerHeight;
  updateScrollMax();
  if(R){ R.setSize(S.vw, S.vh); CAM.aspect = S.vw/S.vh; CAM.updateProjectionMatrix(); }
  resizeCanvases();
});

/* ============== CANVASES ============== */
var starsC = $('stars'), atmosC = $('atmos'), inkC = $('ink-atmos');
var sx = starsC.getContext('2d');
var ax = atmosC.getContext('2d');
var ix = inkC.getContext('2d');
function resizeCanvases(){
  [[starsC, sx], [atmosC, ax], [inkC, ix]].forEach(function(pair){
    pair[0].width = innerWidth * S.dpr;
    pair[0].height = innerHeight * S.dpr;
    pair[1].setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  });
}
resizeCanvases();

/* ============== THREE.JS ============== */
var R, SC, CAM, KAT, envMap;
var hemiL, keyL, fillL, rimL, edgeAccent, moonL, sunL, flashL;

function initThree(){
  R = new THREE.WebGLRenderer({ canvas:$('three'), antialias:true, alpha:true, powerPreference:'high-performance' });
  R.setPixelRatio(S.dpr);
  R.setSize(S.vw, S.vh);
  R.toneMapping = THREE.ACESFilmicToneMapping;
  R.toneMappingExposure = 1.0;
  R.outputEncoding = THREE.sRGBEncoding;
  R.setClearColor(0x000000, 0);

  SC = new THREE.Scene();
  CAM = new THREE.PerspectiveCamera(36, S.vw/S.vh, 0.01, 200);
  CAM.position.set(0, 0, 5);

  try {
    if(typeof THREE.RoomEnvironment === 'function' && typeof THREE.PMREMGenerator === 'function'){
      var pmrem = new THREE.PMREMGenerator(R);
      pmrem.compileEquirectangularShader();
      envMap = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
      SC.environment = envMap;
      pmrem.dispose();
      console.log('Blade environment ready');
    }
  } catch(e){ console.warn('PMREM init failed:', e); }

  hemiL = new THREE.HemisphereLight(0xffe0b8, 0x1a1512, 0.6); SC.add(hemiL);
  keyL = new THREE.DirectionalLight(0xffe0b8, 1.0); keyL.position.set(-3, 5, 4); SC.add(keyL);
  fillL = new THREE.DirectionalLight(0x402020, 0.4); fillL.position.set(4, -1, 2); SC.add(fillL);
  rimL = new THREE.DirectionalLight(0xff6030, 0.5); rimL.position.set(0, -3, -4); SC.add(rimL);
  edgeAccent = new THREE.PointLight(0xc83c28, 0, 6); edgeAccent.position.set(0, 0, 0.4); SC.add(edgeAccent);
  moonL = new THREE.DirectionalLight(0xb8cde8, 0); moonL.position.set(3, 4, 2); SC.add(moonL);
  sunL = new THREE.DirectionalLight(0xffa040, 0); sunL.position.set(-2, 2, 3); SC.add(sunL);
  flashL = new THREE.PointLight(0xddeeff, 0, 18); flashL.position.set(0, 4, 2); SC.add(flashL);

  KAT = new THREE.Group();
  SC.add(KAT);
}
initThree();

/* ============== KATANA LOAD ============== */
function getGLTFLoader(){
  if(typeof THREE.GLTFLoader === 'function') return new THREE.GLTFLoader();
  if(typeof window.GLTFLoader === 'function') return new window.GLTFLoader();
  return null;
}
function createStandin(){
  var blade = new THREE.Mesh(new THREE.BoxGeometry(2.6, .085, .020),
    new THREE.MeshStandardMaterial({color:0x080910, metalness:.96, roughness:.06}));
  var handle = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .82, 18),
    new THREE.MeshStandardMaterial({color:0x1a0510, metalness:.4, roughness:.55}));
  handle.rotation.z = Math.PI/2; handle.position.x = -1.7;
  var tsuba = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .035, 28),
    new THREE.MeshStandardMaterial({color:0x4a2e1a, metalness:.7, roughness:.3}));
  tsuba.rotation.z = Math.PI/2; tsuba.position.x = -1.25;
  var g = new THREE.Group();
  g.add(blade, handle, tsuba);
  return { group:g, meshes:[blade, handle, tsuba] };
}
function finalizeKatana(model, meshes){
  KAT.add(model);
  KAT.userData.model = model;
  KAT.userData.meshes = meshes;
  S.modelReady = true;
  checkBoot();
}
function enhanceMat(m){
  var mat = m.clone();
  if(!mat.emissive) mat.emissive = new THREE.Color(0,0,0);
  var col = mat.color || new THREE.Color(1,1,1);
  var b = (col.r+col.g+col.b)/3;
  if(b < 0.18){ mat.metalness = 0.95; mat.roughness = 0.08; }
  else if(b < 0.5){ mat.metalness = 0.72; mat.roughness = 0.22; }
  mat.envMapIntensity = 1.5;
  return mat;
}

var gltfLoader = getGLTFLoader();
var gltfTimeout = setTimeout(function(){
  console.warn('GLTF timeout - standin');
  var s = createStandin();
  finalizeKatana(s.group, s.meshes);
}, 15000);

if(gltfLoader){
  gltfLoader.load('models/katana.glb', function(gltf){
    clearTimeout(gltfTimeout);
    var m = gltf.scene;
    var box = new THREE.Box3().setFromObject(m);
    var sz = box.getSize(new THREE.Vector3());
    var scale = 5.4 / Math.max(sz.x, sz.y, sz.z, 0.001);
    m.scale.setScalar(scale);
    var ctr = box.getCenter(new THREE.Vector3());
    m.position.set(-ctr.x*scale, -ctr.y*scale, -ctr.z*scale);
    var meshes = [];
    m.traverse(function(o){
      if(!o.isMesh) return;
      var ms = Array.isArray(o.material) ? o.material : [o.material];
      o.material = Array.isArray(o.material) ? ms.map(enhanceMat) : enhanceMat(ms[0]);
      meshes.push(o);
    });
    finalizeKatana(m, meshes);
  }, function(xhr){
    if(xhr.total > 0){
      var pct = 50 + (xhr.loaded/xhr.total)*40;
      updateLoaderBar(pct);
    }
  }, function(err){
    clearTimeout(gltfTimeout);
    console.warn('GLB missing - standin:', err);
    var s = createStandin();
    finalizeKatana(s.group, s.meshes);
  });
} else {
  clearTimeout(gltfTimeout);
  var s = createStandin();
  finalizeKatana(s.group, s.meshes);
}

/* ============== PARTICLES ============== */
function initParticles(){
  for(var i=0; i<48; i++) S.petals.push(spawnPetal(true));
  for(var i=0; i<100; i++){
    S.stars.push({
      x:Math.random()*innerWidth, y:Math.random()*innerHeight,
      r:0.3 + Math.random()*1.2, depth:Math.random(),
      twink:Math.random()*Math.PI*2, twinkS:0.5 + Math.random()*1.5,
    });
  }
  for(var i=0; i<18; i++){
    S.bokeh.push({
      x:Math.random()*innerWidth, y:Math.random()*innerHeight,
      r:10 + Math.random()*22,
      vx:(Math.random()-.5)*0.3, vy:-(0.1+Math.random()*0.4),
      pulse:Math.random()*Math.PI*2, pulseS:0.6+Math.random()*1.2,
      depth:Math.random(),
    });
  }
  for(var i=0; i<18; i++){
    S.dandelions.push({
      x:Math.random()*innerWidth*1.3 - innerWidth*0.15,
      y:Math.random()*innerHeight,
      r:1.4+Math.random()*1.6,
      vx:0.16+Math.random()*0.4, vy:-0.04-Math.random()*0.06,
      rot:Math.random()*Math.PI*2, rotV:(Math.random()-.5)*0.018,
      op:0.5+Math.random()*0.4,
    });
  }
  for(var i=0; i<28; i++){
    S.inkPetals.push({
      x:Math.random()*innerWidth, y:Math.random()*innerHeight,
      sz:8+Math.random()*16, depth:Math.random(),
      rot:Math.random()*Math.PI*2, rotV:(Math.random()-.5)*0.015,
      vx:-0.1-Math.random()*0.3, vy:0.15+Math.random()*0.4,
      type:Math.random()<0.35 ? 'leaf' : (Math.random()<0.5 ? 'petal' : 'star'),
      op:0.3+Math.random()*0.5,
    });
  }
}
function spawnPetal(distribute){
  var close = Math.random() < 0.07;
  return {
    x:Math.random()*innerWidth+120,
    y:distribute ? Math.random()*innerHeight : -30-Math.random()*80,
    sz:close ? 16+Math.random()*16 : 3+Math.random()*5,
    rot:Math.random()*Math.PI*2, rv:(Math.random()-0.5)*0.018,
    vx:-0.3-Math.random()*0.7-(close ? 0.3 : 0),
    vy:0.15+Math.random()*0.4+(close ? 0.3 : 0),
    sw:Math.random()*Math.PI*2, ss:0.005+Math.random()*0.012,
    sa:0.3+Math.random()*1.0,
    op:close ? 0.3+Math.random()*0.25 : 0.35+Math.random()*0.5,
    glass:close,
  };
}

/* ============== STARS ============== */
function drawStars(){
  var W = innerWidth, H = innerHeight;
  sx.clearRect(0, 0, W, H);
  var p = S.progress;
  var wStart = 1 - smoothstep(0.10, 0.18, p);
  var wEnd = smoothstep(0.94, 0.98, p);
  var w = Math.max(wStart, wEnd);
  if(w < 0.02) return;

  for(var i=0; i<S.stars.length; i++){
    var st = S.stars[i];
    st.twink += S.dt * st.twinkS;
    var base = 0.45 + 0.35 * Math.sin(st.twink);
    var px = st.x + S.nx * (8 + st.depth*16);
    var py = st.y + S.ny * (4 + st.depth*8);
    var r = st.r * (0.5 + st.depth*0.8);
    var haloOp = base * w * 0.25 * st.depth;
    if(haloOp > 0.02){
      var g = sx.createRadialGradient(px, py, 0, px, py, r*4);
      g.addColorStop(0, 'rgba(245,237,224,'+haloOp+')');
      g.addColorStop(1, 'rgba(245,237,224,0)');
      sx.fillStyle = g;
      sx.beginPath(); sx.arc(px, py, r*4, 0, Math.PI*2); sx.fill();
    }
    sx.fillStyle = 'rgba(245,237,224,'+(base*w)+')';
    sx.beginPath(); sx.arc(px, py, r, 0, Math.PI*2); sx.fill();
  }
}

/* ============== BG CROSS-FADE + PARALLAX ============== */
function updateBg(){
  var p = S.progress;
  var wHero    = smoothstep(0.04, 0.12, p) * (1 - smoothstep(0.40, 0.48, p));
  var wClouds  = smoothstep(0.42, 0.50, p) * (1 - smoothstep(0.64, 0.70, p));
  var wPaper   = smoothstep(0.66, 0.74, p) * (1 - smoothstep(0.94, 0.97, p));
  var wHilltop = smoothstep(0.94, 0.97, p) * (1 - smoothstep(0.98, 1.00, p));
  var wDawn    = smoothstep(0.97, 1.00, p);

  setOp($('bg-hero'), wHero);
  setOp($('bg-clouds'), wClouds);
  setOp($('bg-paper'), wPaper);
  setOp($('bg-hilltop'), wHilltop);
  setOp($('bg-dawn'), wDawn);

  parallax($('bg-hero'),    p, 0.00, 0.40, 1.05, 1.12, S.nx*0.6, S.ny*0.4);
  parallax($('bg-clouds'),  p, 0.42, 0.64, 1.02, 1.10, S.nx*0.8, S.ny*0.5);
  parallax($('bg-paper'),   p, 0.66, 0.94, 1.00, 1.02, S.nx*0.2, S.ny*0.1);
  parallax($('bg-hilltop'), p, 0.94, 0.98, 1.04, 1.10, S.nx*0.5, S.ny*0.3);
  parallax($('bg-dawn'),    p, 0.97, 1.00, 1.02, 1.08, S.nx*0.3, S.ny*0.2);
}
function setOp(el, w){
  if(!el) return;
  el.style.opacity = w > 0.01 ? Math.min(1, w) : 0;
}
function parallax(el, p, start, end, minS, maxS, mx, my){
  if(!el) return;
  var local = smoothstep(start, end, p);
  var scale = lerp(minS, maxS, local);
  el.style.transform = 'translate3d('+(mx*10).toFixed(1)+'px,'+(my*10 + local*-20).toFixed(1)+'px,0) scale('+scale.toFixed(4)+')';
}

/* ============== KATANA CHOREOGRAPHY ============== */
var lastSmooth = 0;
function updateKatana(){
  if(!KAT.userData.model) return;
  var p = S.progress;
  var kx, ky, kz, rX, rY, rZ;

  if(p < 0.07){
    var t = smoothstep(0, 0.07, p);
    kx = lerp(0.35, 0.22, t);  ky = -0.04;  kz = lerp(1.0, 1.2, t);
    rX = 0;  rY = 0.3;  rZ = 0;
  } else if(p < 0.22){
    var t = smoothstep(0.07, 0.22, p);
    kx = lerp(0.22, 0, t);  ky = lerp(-0.04, 0.05, t);  kz = lerp(1.2, 5.4, t);
    rX = 0;  rY = lerp(0.3, 0, t);  rZ = 0;
  } else if(p < 0.38){
    kx = Math.sin(S.t*.28)*.04;
    ky = 0.05 + Math.sin(S.t*.45)*.025;
    kz = 5.4 + Math.sin(S.t*0.2)*0.15;
    rX = Math.sin(S.t*.3)*.006;  rY = 0;  rZ = 0;
  } else if(p < 0.54){
    var t = smoothstep(0.38, 0.54, p);
    kx = lerp(0, -1.3, t);  ky = lerp(0.05, 1.4, t);  kz = lerp(5.4, 4.6, t);
    rX = lerp(0, -0.30, t);  rY = lerp(0, -0.38, t);  rZ = lerp(0, -Math.PI*0.23, t);
  } else if(p < 0.62){
    var t = smoothstep(0.54, 0.62, p);
    kx = lerp(-1.3, 1.3, t);  ky = lerp(1.4, 0.3, t);  kz = lerp(4.6, 4.0, t);
    rX = lerp(-0.30, -0.10, t);  rY = lerp(-0.38, 0.32, t);  rZ = lerp(-Math.PI*0.23, -Math.PI*0.05, t);
  } else if(p < 0.72){
    var t = smoothstep(0.62, 0.72, p);
    kx = lerp(1.3, 0, t);  ky = lerp(0.3, -3.0, t);  kz = lerp(4.0, 3.0, t);
    rX = lerp(-0.10, -Math.PI*0.22, t);  rY = lerp(0.32, 0, t);  rZ = lerp(-Math.PI*0.05, -Math.PI*0.48, t);
  } else if(p < 0.94){
    var t = smoothstep(0.72, 0.94, p);
    kx = lerp(0, 3.6, t);  ky = lerp(-3.0, 2.2, t);  kz = lerp(3.0, 8.2, t);
    rX = lerp(-Math.PI*0.22, 0.12, t);  rY = lerp(0, -0.28, t);  rZ = lerp(-Math.PI*0.48, -Math.PI*0.2, t);
  } else if(p < 0.98){
    var t = smoothstep(0.94, 0.98, p);
    kx = lerp(3.6, -2.4, t);  ky = lerp(2.2, -0.8, t);  kz = lerp(8.2, 3.6, t);
    rX = lerp(0.12, -0.08, t);  rY = lerp(-0.28, 0.2, t);  rZ = lerp(-Math.PI*0.2, -Math.PI*0.48, t);
  } else {
    kx = -2.4;  ky = -0.8 + Math.sin(S.t*0.5)*0.02;  kz = 3.6;
    rX = -0.08;  rY = 0.2 + Math.sin(S.t*0.3)*0.02;  rZ = -Math.PI*0.48;
  }

  ky += Math.sin(S.t*0.6)*0.005;
  kx += S.nx*0.015;
  ky += S.ny*0.015;

  if(kz < 1.0) kz = 1.0;

  KAT.position.set(kx, ky, kz);
  KAT.rotation.set(rX, rY, rZ);

  if(p < 0.38){
    keyL.color.setHex(0xffe0b8); keyL.intensity = 1.1;
    rimL.color.setHex(0xff6030); rimL.intensity = 0.5;
    moonL.intensity = 0; sunL.intensity = 0;
  } else if(p < 0.62){
    keyL.color.setHex(0xffc890); keyL.intensity = 1.3;
    rimL.color.setHex(0xc83c28); rimL.intensity = 0.7;
    moonL.intensity = 0; sunL.intensity = 0;
  } else if(p < 0.94){
    keyL.color.setHex(0xffe8d0); keyL.intensity = 1.2;
    rimL.color.setHex(0x8b6340); rimL.intensity = 0.3;
    moonL.intensity = 0; sunL.intensity = 0;
  } else if(p < 0.98){
    keyL.color.setHex(0xb8cde8); keyL.intensity = 0.7;
    rimL.color.setHex(0x3a4a6a); rimL.intensity = 0.5;
    moonL.intensity = smoothstep(0.94, 0.98, p)*1.1; sunL.intensity = 0;
  } else {
    keyL.color.setHex(0xffd890); keyL.intensity = 0.9;
    rimL.color.setHex(0xffa040); rimL.intensity = 0.9;
    moonL.intensity = 0; sunL.intensity = 1.3;
  }

  edgeAccent.intensity = smoothstep(0.25, 0.60, p)*0.9 + smoothstep(0.92, 1.0, p)*0.8;
  edgeAccent.position.set(KAT.position.x, KAT.position.y, KAT.position.z + 0.4);

  if(S.flashIntensity > 0){
    flashL.intensity = S.flashIntensity * 12;
    S.flashIntensity *= 0.85;
  } else {
    flashL.intensity = 0;
  }

  if(KAT.userData.meshes){
    var eW = smoothstep(0.34, 0.66, p)*0.35 + smoothstep(0.92, 1.0, p)*0.25;
    for(var i=0; i<KAT.userData.meshes.length; i++){
      var m = KAT.userData.meshes[i];
      if(m.material && m.material.emissive){
        var col = m.material.color;
        var b = (col.r+col.g+col.b)/3;
        if(b < 0.18){ m.material.emissive.setRGB(eW*0.28, eW*0.05, eW*0.02); }
      }
    }
  }
}

/* ============== ATMOSPHERE ============== */
function drawPetalShape(ctx, sz, stroke){
  for(var i=0; i<5; i++){
    ctx.save();
    ctx.rotate(i * Math.PI*2/5);
    ctx.beginPath();
    ctx.ellipse(0, -sz*.5, sz*.26, sz*.52, 0, 0, Math.PI*2);
    if(stroke) ctx.stroke(); else ctx.fill();
    ctx.restore();
  }
}
function drawAtmos(){
  var W = innerWidth, H = innerHeight;
  ax.clearRect(0, 0, W, H);
  var p = S.progress;

  var petalW = smoothstep(0.04, 0.10, p) * (1 - smoothstep(0.36, 0.44, p));
  if(petalW > 0.01){
    var wind = Math.sin(S.t*0.4)*1.1;
    for(var i=0; i<S.petals.length; i++){
      var pe = S.petals[i];
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
        var g = ax.createRadialGradient(0, 0, 0, 0, 0, pe.sz);
        g.addColorStop(0, 'rgba(255,210,220,.45)');
        g.addColorStop(0.6, 'rgba(240,160,180,.22)');
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
    }
  }

  var bokehColor = null;
  if(p > 0.42 && p < 0.62) bokehColor = [255, 180, 100];
  else if(p > 0.94 && p < 0.98) bokehColor = [180, 210, 240];
  else if(p > 0.98) bokehColor = [255, 200, 120];
  else if(p < 0.36) bokehColor = [220, 100, 80];

  if(bokehColor && S.perfMode === 'high'){
    for(var i=0; i<S.bokeh.length; i++){
      var b = S.bokeh[i];
      b.x += b.vx; b.y += b.vy;
      b.pulse += S.dt * b.pulseS;
      if(b.y < -30){ b.y = H+30; b.x = Math.random()*W; }
      if(b.x < -30) b.x = W+30;
      if(b.x > W+30) b.x = -30;
      var pulse = 0.5 + 0.5*Math.sin(b.pulse);
      var px = b.x + S.nx * (10 + b.depth*20);
      var py = b.y + S.ny * (6 + b.depth*12);
      var r = b.r * (0.7 + b.depth*0.6);
      var op = pulse * (0.15 + b.depth*0.18);
      var g = ax.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, 'rgba('+bokehColor[0]+','+bokehColor[1]+','+bokehColor[2]+','+op+')');
      g.addColorStop(0.4, 'rgba('+bokehColor[0]+','+bokehColor[1]+','+bokehColor[2]+','+(op*0.4)+')');
      g.addColorStop(1, 'rgba('+bokehColor[0]+','+bokehColor[1]+','+bokehColor[2]+',0)');
      ax.fillStyle = g;
      ax.beginPath(); ax.arc(px, py, r, 0, Math.PI*2); ax.fill();
    }
  }

  if(p > 0.54 && p < 0.62){
    S.lightningT -= S.dt;
    if(S.lightningT <= 0){ spawnLightning(); S.lightningT = 0.6 + Math.random()*1.0; }
  }
  drawLightning();

  var dandW = smoothstep(0.94, 0.98, p);
  if(dandW > 0.01){
    for(var i=0; i<S.dandelions.length; i++){
      var d = S.dandelions[i];
      d.x += d.vx + Math.sin(S.t*0.3 + d.rot)*0.4;
      d.y += d.vy;
      d.rot += d.rotV;
      if(d.x > W+40) d.x = -40;
      if(d.y < -20) d.y = H+20;
      ax.save();
      ax.translate(d.x, d.y);
      ax.rotate(d.rot);
      ax.globalAlpha = d.op * dandW;
      ax.fillStyle = 'rgba(245,238,220,.78)';
      ax.beginPath(); ax.arc(0, 0, d.r*0.5, 0, Math.PI*2); ax.fill();
      ax.strokeStyle = 'rgba(245,238,220,.5)';
      ax.lineWidth = 0.5;
      for(var j=0; j<10; j++){
        var a = j/10 * Math.PI*2;
        ax.beginPath();
        ax.moveTo(0, 0);
        ax.lineTo(Math.cos(a)*d.r*2.6, Math.sin(a)*d.r*2.6);
        ax.stroke();
      }
      ax.fillStyle = 'rgba(250,245,230,.65)';
      for(var j=0; j<10; j++){
        var a = j/10 * Math.PI*2;
        ax.beginPath();
        ax.arc(Math.cos(a)*d.r*2.6, Math.sin(a)*d.r*2.6, 0.7, 0, Math.PI*2);
        ax.fill();
      }
      ax.restore();
    }
  }
}

function spawnLightning(){
  var x1 = innerWidth * (0.15 + Math.random()*0.7);
  var x2 = x1 + (Math.random()-0.5)*innerWidth*0.4;
  S.lightning.push({
    x1:x1, y1:-20, x2:x2, y2:innerHeight*(0.45+Math.random()*0.35),
    life:1, decay:0.04+Math.random()*0.03,
    seed:Math.random()*1000,
    branches:Math.floor(Math.random()*3)+1,
  });
  S.flashIntensity = 1.0;
  toggle($('overlay-chromatic'), '-strong', true);
  setTimeout(function(){ toggle($('overlay-chromatic'), '-strong', false); }, 220);
}
function lightningSegments(x1, y1, x2, y2, detail, seed){
  var segs = [[x1, y1]];
  var N = 12;
  function rng(s){ var x = Math.sin(s+seed)*43758.5; return x - Math.floor(x); }
  for(var i=1; i<N; i++){
    var t = i/N;
    var tx = x1+(x2-x1)*t, ty = y1+(y2-y1)*t;
    var offset = detail*(rng(i*3.7)-0.5)*46;
    var perpX = -(y2-y1), perpY = (x2-x1);
    var pl = Math.hypot(perpX, perpY);
    segs.push([tx+perpX/pl*offset, ty+perpY/pl*offset]);
  }
  segs.push([x2, y2]);
  return segs;
}
function drawLightning(){
  for(var idx=S.lightning.length-1; idx>=0; idx--){
    var b = S.lightning[idx];
    b.life -= b.decay;
    if(b.life <= 0){ S.lightning.splice(idx, 1); continue; }
    var op = Math.max(0, b.life);
    var segs = lightningSegments(b.x1, b.y1, b.x2, b.y2, b.life, b.seed);
    ax.lineCap = 'round'; ax.lineJoin = 'round';
    ax.strokeStyle = 'rgba(180,140,255,'+(op*0.25)+')'; ax.lineWidth = 14;
    drawPath(ax, segs);
    ax.strokeStyle = 'rgba(220,200,255,'+(op*0.55)+')'; ax.lineWidth = 5;
    drawPath(ax, segs);
    ax.strokeStyle = 'rgba(255,250,255,'+op+')'; ax.lineWidth = 1.5;
    drawPath(ax, segs);
    for(var k=0; k<b.branches; k++){
      var si = Math.floor(segs.length*(0.3+k*0.18));
      if(si >= segs.length-1) continue;
      var sp = segs[si];
      var bAng = Math.atan2(b.y2-b.y1, b.x2-b.x1) + (Math.random()-0.5)*1.5;
      var bLen = 50+Math.random()*80;
      var bx2 = sp[0]+Math.cos(bAng)*bLen;
      var by2 = sp[1]+Math.sin(bAng)*bLen;
      var bSegs = lightningSegments(sp[0], sp[1], bx2, by2, b.life*0.8, b.seed+k*7);
      ax.strokeStyle = 'rgba(220,200,255,'+(op*0.3)+')'; ax.lineWidth = 6;
      drawPath(ax, bSegs);
      ax.strokeStyle = 'rgba(255,240,255,'+(op*0.8)+')'; ax.lineWidth = 1;
      drawPath(ax, bSegs);
    }
  }
}
function drawPath(ctx, segs){
  ctx.beginPath();
  for(var i=0; i<segs.length; i++){
    if(i===0) ctx.moveTo(segs[i][0], segs[i][1]);
    else ctx.lineTo(segs[i][0], segs[i][1]);
  }
  ctx.stroke();
}

/* ============== SUMI BLEED ============== */
function updateSumiBleed(){
  var p = S.progress;
  var el = $('sumi-bleed');
  if(!el) return;
  var bleedIn = smoothstep(0.62, 0.68, p);
  var bleedOut = smoothstep(0.70, 0.74, p);
  var bleed = bleedIn - bleedOut;
  bleed = Math.max(0, Math.min(1, bleed));
  toggle(el, '-on', bleed > 0.01);
  el.style.setProperty('--bleed', bleed * 0.6);
}

/* ============== M-GLYPH MORPH ============== */
function updateMGlyph(){
  var cycle = (S.t % 12) / 12;
  var glyph = 'm', rot = 0;
  if(cycle < 0.30){ glyph = 'm'; rot = cycle*8; }
  else if(cycle < 0.36){ glyph = '3'; rot = (cycle-0.30) * 4 * 180; }
  else if(cycle < 0.63){ glyph = '3'; rot = 90 + (cycle-0.36)*8; }
  else if(cycle < 0.70){ glyph = 'D'; rot = 180 + (cycle-0.63) * 4 * 180; }
  else if(cycle < 0.94){ glyph = 'D'; rot = 360 + (cycle-0.70)*8; }
  else { glyph = 'm'; rot = 360 + (cycle-0.94) * 4 * 360; }
  var els = [$('brand-m'), $('load-m'), $('hm-m')];
  for(var i=0; i<els.length; i++){
    var el = els[i];
    if(!el) continue;
    if(el.textContent !== glyph) el.textContent = glyph;
    el.style.transform = 'rotate('+rot.toFixed(1)+'deg)';
  }
}

/* ============== GLITCH SCRAMBLE ============== */
var KANA = '\u30A2\u30A4\u30A6\u30A8\u30AA\u30AB\u30AD\u30AF\u30B1\u30B3\u30B5\u30B7\u30B9\u30BB\u30BD\u30BF\u30C1\u30C4\u30C6\u30C8\u30CA\u30CB\u30CC\u30CD\u30CE\u30CF\u30D2\u30D5\u30D8\u30DB';
var KANJI = '\u5200\u5263\u9B42\u5275\u9020\u5922\u5E7B\u899A\u9192\u98A8\u708E\u6708\u6D77';
var SYMBOLS = '\u2593\u2592\u2591\u2502\u2524\u2510\u2514\u2534\u252C\u251C\u2500\u253C\u256A';
function scrambleChar(){
  var src = Math.random() < 0.5 ? KANA : (Math.random() < 0.6 ? KANJI : SYMBOLS);
  return src[Math.floor(Math.random()*src.length)];
}
function runScramble(el){
  if(el._scrambling) return;
  var target = el.dataset.target;
  if(!target) return;
  el._scrambling = true;
  var inner = el.querySelector('.bt-inner');
  if(!inner) return;
  var lines = target.split('|');
  var plainLines = lines.map(function(l){ return l.replace(/<[^>]+>/g, ''); });
  var steps = 14;
  var step = 0;
  function tick(){
    step++;
    var prog = step/steps;
    if(step >= steps){
      inner.innerHTML = lines.join('<br>');
      el._scrambling = false;
      return;
    }
    var mixed = lines.map(function(line, li){
      var plain = plainLines[li];
      var reveal = Math.floor(plain.length * prog);
      var scrLen = Math.min(plain.length - reveal, 5);
      var s = plain.slice(0, reveal);
      for(var i=0; i<scrLen; i++) s += scrambleChar();
      return s;
    });
    inner.innerHTML = mixed.join('<br>');
    setTimeout(tick, 50);
  }
  tick();
}

/* ============== JELLY GLASS MOUSE TRACKING ============== */
function initJellyGlass(){
  var titles = document.querySelectorAll('.beat-title');
  titles.forEach(function(t){
    t.addEventListener('mousemove', function(e){
      var r = t.getBoundingClientRect();
      var mx = ((e.clientX - r.left) / r.width) * 100;
      var my = ((e.clientY - r.top) / r.height) * 100;
      t.style.setProperty('--mx', mx + '%');
      t.style.setProperty('--my', my + '%');
    });
  });
}

/* ============== DIALOGUE TYPEWRITER ============== */
var typingJob = null;
function showDialogue(idx){
  if(idx === S.dialogueIdx) return;
  S.dialogueIdx = idx;
  var d = DIALOGUE[idx];
  if(!d) return;
  if(!S.mugenVisible){ $('mugen').classList.add('-on'); S.mugenVisible = true; }
  $('mb-who').textContent = d.who;
  if(typingJob) clearInterval(typingJob);
  var target = d.text;
  var i = 0;
  $('mb-text').innerHTML = '';
  typingJob = setInterval(function(){
    i++;
    var preview = target.slice(0, i);
    var open = [];
    var close = [];
    var om = preview.match(/<\w+/g) || [];
    var cm = preview.match(/<\/\w+/g) || [];
    om.forEach(function(x){ open.push(x.slice(1)); });
    cm.forEach(function(x){ close.push(x.slice(2)); });
    var unclosed = [];
    open.forEach(function(t){
      if(close.indexOf(t) === -1) unclosed.push(t);
    });
    var display = preview;
    unclosed.forEach(function(t){ display += '</' + t + '>'; });
    $('mb-text').innerHTML = display;
    if(i >= target.length){ clearInterval(typingJob); typingJob = null; }
  }, 22);
}

/* ============== BEAT ORCHESTRATION ============== */
function updateBeats(){
  var p = S.progress;
  var b = currentBeat(p);

  toggle($('hero-monogram'), '-on', p < 0.08);
  toggle($('cap-chapter'), '-on', p < 0.12);
  toggle($('cap-bottom'),  '-on', p > 0.10 && p < 0.22);
  toggle($('cap-folio'),   '-on', p > 0.42 && p < 0.62);

  applyBeatTitle('bt-sacred',   p > 0.14 && p < 0.24);
  applyBeatTitle('bt-dialogue', p > 0.30 && p < 0.40);
  applyBeatTitle('bt-ascent',   p > 0.48 && p < 0.58);
  applyBeatTitle('bt-self',     p > 0.68 && p < 0.73);

  toggle($('scroll-hint'), '-on', p < 0.04);

  var inHub = p >= 0.72 && p < 0.94;
  toggle($('skillhub'), '-on', inHub);
  $('skillhub').setAttribute('aria-hidden', inHub ? 'false' : 'true');
  toggle($('sh-intro'),   '-on', p >= 0.72 && p < 0.80);
  toggle($('sh-ledger'),  '-on', p >= 0.82 && p < 0.88);
  toggle($('sh-feature'), '-on', p >= 0.90 && p < 0.94);

  toggle($('dawn-title'), '-on', p > 0.97);
  toggle($('jumper'), '-on', p > 0.97);

  var jumper = $('jumper');
  if(p > 0.98){
    jumper.style.setProperty('--sun-x', '50%');
    jumper.style.setProperty('--sun-y', '48%');
  } else if(p > 0.94){
    jumper.style.setProperty('--sun-x', '38%');
    jumper.style.setProperty('--sun-y', '24%');
  }

  for(var i = 0; i < DIALOGUE.length; i++){
    if(p >= DIALOGUE[i].at && i > S.dialogueIdx){ showDialogue(i); break; }
  }
  if(p < DIALOGUE[0].at && S.mugenVisible){
    $('mugen').classList.remove('-on');
    S.mugenVisible = false;
    S.dialogueIdx = -1;
  }

  $('scroll-pct').textContent = Math.round(p*100) + '%';
  $('progress').style.width = (p*100) + '%';
  $('stat-run').textContent = Math.round(p*100);

  var sectionNames = ['', 'Codex', 'Sacred Tree', 'Dialogue', 'Ascent', 'Thunder', 'Bleed', 'Skill Hub', 'Moonlit', 'Dawn'];
  $('ch-label').textContent = sectionNames[b] || 'Codex';
  $('ch-num').textContent = ('0' + b).slice(-2);
  $('stat-mode').textContent = (sectionNames[b] || 'Codex').toUpperCase();

  toggle($('meta-widget'), '-on', p > 0.12 && p < 0.94);
  var hours = ['', 'Nightfall', 'Dusk', 'Witching', 'Witching', 'The Break', 'Silence', 'Paper Hour', 'Blue Hour', 'Daybreak'];
  $('mw-hour').textContent = hours[b] || '';
  $('mw-wind').textContent = (b >= 4 && b <= 5) ? 'SW GALE' : (b === 8) ? 'NE SEA' : 'NE LOW';
}

function applyBeatTitle(id, on){
  var el = $(id);
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

/* ============== POPULATE ============== */
function buildSkillHub(){
  var html = '';
  for(var i=0; i<WORKS.length; i++){
    var w = WORKS[i];
    html += '<div class="sh-row" data-cursor="hover">'
         +  '<div class="sh-num">N ' + w.no + '</div>'
         +  '<div class="sh-title-row">' + w.title + '</div>'
         +  '<div class="sh-role">' + w.role + '</div>'
         +  '<div class="sh-year">' + w.year + '</div>'
         +  '</div>';
  }
  $('sh-ledger').innerHTML = html;
}

function buildVault(){
  var html = '';
  for(var i=0; i<VAULT.length; i++){
    var v = VAULT[i];
    var metaHtml = '';
    for(var j=0; j<v.meta.length; j++){
      metaHtml += '<div><span>' + v.meta[j][0] + '</span><strong>' + v.meta[j][1] + '</strong></div>';
    }
    html += '<div class="vault-card" data-cursor="hover">'
         +  '<div class="vc-art">' + v.art + '</div>'
         +  '<div class="vc-body">'
         +  '<div class="vc-no">N ' + v.no + ' · ' + v.tag + '</div>'
         +  '<div class="vc-title">' + v.title + '</div>'
         +  '<div class="vc-tag">' + v.sub + '</div>'
         +  '<div class="vc-desc">' + v.desc + '</div>'
         +  '<div class="vc-meta">' + metaHtml + '</div>'
         +  '</div>'
         +  '</div>';
  }
  $('vault-stack').innerHTML = html;
}

buildSkillHub();
buildVault();

/* ============== CHAPTER JUMP ============== */
$('ch-expand').addEventListener('click', function(e){
  var item = e.target.closest('[data-jump]');
  if(!item) return;
  var pct = parseFloat(item.dataset.jump);
  if(!isNaN(pct)){
    updateScrollMax();
    window.scrollTo({ top: scrollMax * pct, behavior:'smooth' });
  }
});

/* ============== INK MODE ============== */
$('jumper').addEventListener('click', toggleInkMode);
function toggleInkMode(){
  S.inkMode = !S.inkMode;
  $('stage').classList.toggle('-ink', S.inkMode);
  $('ink-system').classList.toggle('-on', S.inkMode);
  $('ink-system').setAttribute('aria-hidden', S.inkMode ? 'false' : 'true');
  if(S.inkMode){
    S.inkClouds = [];
    for(var i=0; i<28; i++){
      S.inkClouds.push({
        x: -120 + Math.random()*innerWidth*0.3,
        y: innerHeight*(0.15+Math.random()*0.7),
        r: 70 + Math.random()*200,
        vx: 2.5+Math.random()*4,
        vy: (Math.random()-0.5)*0.5,
        life: 1,
        delay: Math.random()*0.8,
      });
    }
    setTimeout(function(){ $('ink-system').scrollTo({top:0, behavior:'instant'}); }, 50);
  }
}

function drawInk(){
  if(!S.inkMode){
    if(S.inkClouds.length){ ix.clearRect(0, 0, innerWidth, innerHeight); S.inkClouds.length = 0; }
    return;
  }
  ix.clearRect(0, 0, innerWidth, innerHeight);
  for(var i=0; i<S.inkClouds.length; i++){
    var c = S.inkClouds[i];
    if(c.delay > 0){ c.delay -= S.dt; continue; }
    c.x += c.vx; c.y += c.vy; c.r += 0.8;
    if(c.x > innerWidth + c.r) c.life -= 0.012;
    var g = ix.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
    g.addColorStop(0, 'rgba(10,9,6,'+(0.35*c.life)+')');
    g.addColorStop(0.5, 'rgba(15,12,8,'+(0.24*c.life)+')');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ix.fillStyle = g;
    ix.beginPath(); ix.arc(c.x, c.y, c.r, 0, Math.PI*2); ix.fill();
  }
  ix.strokeStyle = 'rgba(10,9,6,.14)';
  ix.lineWidth = 1.2;
  for(var i=0; i<5; i++){
    var y = innerHeight*(0.15 + i*0.16);
    var phase = S.t*0.4 + i;
    ix.beginPath();
    ix.moveTo(-20, y);
    for(var x=0; x<innerWidth+20; x+=24){
      ix.lineTo(x, y + Math.sin((x+phase*40)*0.012)*8);
    }
    ix.stroke();
  }
  for(var i=0; i<S.inkPetals.length; i++){
    var ip = S.inkPetals[i];
    ip.x += ip.vx; ip.y += ip.vy;
    ip.rot += ip.rotV;
    if(ip.x < -30) ip.x = innerWidth+30;
    if(ip.y > innerHeight+30){ ip.y = -30; ip.x = Math.random()*innerWidth; }
    var depthScale = 0.4 + ip.depth * 1.2;
    var depthBlur = (1 - ip.depth) * 1.5;
    ix.save();
    ix.translate(ip.x, ip.y);
    ix.rotate(ip.rot);
    ix.scale(depthScale, depthScale);
    ix.globalAlpha = ip.op * (0.4 + ip.depth * 0.6);
    ix.filter = 'blur(' + depthBlur.toFixed(1) + 'px)';
    ix.fillStyle = '#0a0906';
    if(ip.type === 'leaf'){
      ix.beginPath();
      ix.ellipse(0, 0, ip.sz*0.4, ip.sz, 0, 0, Math.PI*2);
      ix.fill();
    } else if(ip.type === 'petal'){
      drawPetalShape(ix, ip.sz*0.5);
    } else {
      ix.beginPath();
      for(var j=0; j<8; j++){
        var ang = (j/8) * Math.PI*2;
        var r = j%2 === 0 ? ip.sz*0.5 : ip.sz*0.2;
        var xx = Math.cos(ang)*r, yy = Math.sin(ang)*r;
        if(j===0) ix.moveTo(xx, yy); else ix.lineTo(xx, yy);
      }
      ix.closePath();
      ix.fill();
    }
    ix.filter = 'none';
    ix.restore();
  }
}

/* ============== CURSOR ============== */
var cursor = $('cursor');
window.addEventListener('mousemove', function(e){
  S.mx = e.clientX; S.my = e.clientY;
  S.nx = (e.clientX/innerWidth)*2 - 1;
  S.ny = -((e.clientY/innerHeight)*2 - 1);
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});
document.addEventListener('mouseover', function(e){
  if(e.target.closest('[data-cursor="hover"], button, .sh-row, .ch-item, .chapter-pill, .vault-card, .beat-title')){
    cursor.classList.add('-hover');
  }
});
document.addEventListener('mouseout', function(e){
  if(e.target.closest('[data-cursor="hover"], button, .sh-row, .ch-item, .chapter-pill, .vault-card, .beat-title')){
    cursor.classList.remove('-hover');
  }
});

/* ============== PERF ============== */
function checkPerf(){
  if(S.fps < 48){
    S.lowFpsCount++;
    if(S.lowFpsCount > 3 && S.perfMode === 'high'){
      S.perfMode = 'low';
      console.log('Low perf mode');
      $('overlay-grain').style.display = 'none';
      S.dpr = 1;
      resizeCanvases();
      if(R) R.setPixelRatio(1);
    }
  } else {
    S.lowFpsCount = Math.max(0, S.lowFpsCount-1);
  }
}

/* ============== MAIN LOOP ============== */
function loop(ts){
  requestAnimationFrame(loop);
  S.dt = Math.min((ts - S.lt)*0.001, 0.05);
  S.lt = ts;
  S.t += S.dt;
  S.fpsC++; S.fpsT += S.dt;
  if(S.fpsT >= 1){
    S.fps = Math.round(S.fpsC/S.fpsT);
    $('stat-fps').textContent = S.fps;
    S.fpsT = 0; S.fpsC = 0;
    checkPerf();
  }
  S.smooth += (S.scrollY - S.smooth) * 0.09;
  S.progress = Math.min(1, Math.max(0, S.smooth/scrollMax));

  if(!S.inkMode){
    updateBg();
    updateKatana();
    updateBeats();
    updateSumiBleed();
    drawStars();
    drawAtmos();
    if(R) R.render(SC, CAM);
  } else {
    drawInk();
  }
  updateMGlyph();
}

/* ============== LOADER & BOOT ============== */
var ldText = $('loader-text'), ldBar = $('loader-bar'), ldPct = $('loader-pct');
var STAGES = ['Forging', 'Tempering', 'Polishing', 'Awakening'];
function updateLoaderBar(pct){
  ldBar.style.width = pct + '%';
  ldPct.textContent = ('00' + Math.round(pct)).slice(-3) + ' %';
}
var ldP = 0, ldStage = 0;
var ldInt = setInterval(function(){
  if(S.assetsReady && S.modelReady) return;
  ldP += 0.4 + Math.random()*1.2;
  if(ldP > 30) ldP = 30;
  updateLoaderBar(ldP);
  if(ldP > 12 && ldStage === 0){ ldStage = 1; ldText.textContent = STAGES[1]; }
  if(ldP > 22 && ldStage === 1){ ldStage = 2; ldText.textContent = STAGES[2]; }
  if(ldP >= 30) clearInterval(ldInt);
}, 100);
setTimeout(function(){ $('loader-skip').classList.add('-show'); }, 8000);
$('loader-skip').addEventListener('click', function(){
  S.modelReady = true;
  S.assetsReady = true;
  checkBoot();
});
function checkBoot(){ if(S.modelReady && S.assetsReady) boot(); }
function boot(){
  if(S.booted) return;
  S.booted = true;
  updateLoaderBar(100);
  ldText.textContent = STAGES[3];
  initParticles();
  initJellyGlass();
  setTimeout(function(){
    $('loader').classList.add('-out');
    S.lt = performance.now();
    updateScrollMax();
    window.scrollTo(0, 0);
    requestAnimationFrame(loop);
    setTimeout(function(){ var l = $('loader'); if(l) l.remove(); }, 2000);
  }, 700);
}

function preloadImages(urls){
  return Promise.all(urls.map(function(u){
    return new Promise(function(resolve){
      var img = new Image();
      img.onload = img.onerror = function(){ resolve(u); };
      img.src = u;
    });
  }));
}
preloadImages([
  'assets/bg-hero.png','assets/bg-clouds.png','assets/bg-hilltop.png','assets/bg-dawn.png',
  'assets/sensei-mugen.png','assets/jumper-silhouette.png','assets/texture-paper.jpg'
]).then(function(){
  S.assetsReady = true;
  console.log('Images loaded');
  updateLoaderBar(45);
  checkBoot();
});
setTimeout(function(){
  if(!S.modelReady){ console.warn('Model failsafe'); S.modelReady = true; }
  if(!S.assetsReady){ console.warn('Assets failsafe'); S.assetsReady = true; }
  checkBoot();
}, 20000);
updateScrollMax();

})();
