(() => {
    const $ = id => document.getElementById(id);
    let R, SC, CAM, KAT, envMap;
    
    // Global State
    const S = {
        vw: innerWidth, vh: innerHeight,
        dpr: Math.min(devicePixelRatio || 1, 1.5),
        mx: innerWidth / 2, my: innerHeight / 2
    };

    /* ═══════════ THREE.JS SETUP ═══════════ */
    function initThree() {
        R = new THREE.WebGLRenderer({
            canvas: $('three-canvas'), antialias: true, alpha: true, powerPreference: 'high-performance'
        });
        R.setPixelRatio(S.dpr);
        R.setSize(S.vw, S.vh);
        R.toneMapping = THREE.ACESFilmicToneMapping;
        R.toneMappingExposure = 1.05;
        R.outputEncoding = THREE.sRGBEncoding;
        R.setClearColor(0x000000, 0);

        SC = new THREE.Scene();
        CAM = new THREE.PerspectiveCamera(36, S.vw / S.vh, 0.01, 200);
        CAM.position.set(0, 0, 5);

        // Best lighting for metallic blade reflections
        try {
            if (typeof THREE.RoomEnvironment === 'function' && typeof THREE.PMREMGenerator === 'function') {
                const pmrem = new THREE.PMREMGenerator(R);
                pmrem.compileEquirectangularShader();
                envMap = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
                SC.environment = envMap;
                pmrem.dispose();
            }
        } catch (e) { console.warn('RoomEnv failed'); }

        const hemiL = new THREE.HemisphereLight(0xffe0b8, 0x1a1512, 0.8);
        SC.add(hemiL);
        const keyL = new THREE.DirectionalLight(0xffe0b8, 1.4);
        keyL.position.set(-3, 5, 4); SC.add(keyL);
        const rimL = new THREE.DirectionalLight(0xc83c28, 0.9);
        rimL.position.set(0, -3, -4); SC.add(rimL);

        KAT = new THREE.Group();
        SC.add(KAT);
        
        loadModel();
    }

    function loadModel() {
        const loader = new THREE.GLTFLoader();
        loader.load('assets/models/katana.glb', (gltf) => {
            const m = gltf.scene;
            
            // Auto-scale model based on bounding box
            const box = new THREE.Box3().setFromObject(m);
            const sz = box.getSize(new THREE.Vector3());
            const scale = 5.4 / Math.max(sz.x, sz.y, sz.z, 0.001);
            m.scale.setScalar(scale);
            
            // Center it
            const ctr = box.getCenter(new THREE.Vector3());
            m.position.set(-ctr.x * scale, -ctr.y * scale, -ctr.z * scale);
            
            // Material enhancement for metallic look
            m.traverse(o => {
                if (o.isMesh && o.material) {
                    const mat = o.material.clone();
                    mat.metalness = 0.95; 
                    mat.roughness = 0.08;
                    mat.envMapIntensity = 2.0;
                    o.material = mat;
                }
            });
            
            KAT.add(m);
            setupGSAP(); // Initialize scroll mechanics once loaded
        }, undefined, (e) => console.error("Model load failed", e));
    }

    /* ═══════════ GSAP ANIMATIONS & 3D-to-2D SWAP ═══════════ */
    function setupGSAP() {
        gsap.registerPlugin(ScrollTrigger);

        // 1. Initial State: PERFECTLY HORIZONTAL, CLOSE UP, OFFSCREEN LEFT
        KAT.rotation.set(0, 0, Math.PI / 2);
        KAT.position.set(-2.5, 0, 2.8);

        // 2. Scroll Timeline for Katana
        const heroTl = gsap.timeline({
            scrollTrigger: {
                trigger: ".hero",
                start: "top top",
                end: "bottom top",
                scrub: 1, // Smooth scrub
                onUpdate: (self) => {
                    // THE OPTIMIZATION ILLUSION: Swap 3D canvas for 2D PNG
                    if(self.progress > 0.85) {
                        $('three-canvas').style.opacity = 0;
                        $('katana-2d').style.opacity = 1;
                    } else {
                        $('three-canvas').style.opacity = 1;
                        $('katana-2d').style.opacity = 0;
                    }
                }
            }
        });

        // Track left to right
        heroTl.to(KAT.position, { x: 2.5, ease: "none" }, 0);
        // Slight organic rotation on the X axis while staying perfectly horizontal
        heroTl.to(KAT.rotation, { x: 0.5, ease: "none" }, 0);


        // 3. Typography Reveals
        gsap.to(".blur-reveal-text", {
            scrollTrigger: { trigger: ".scroll-text-section", start: "top 75%", end: "center center", scrub: true },
            filter: "blur(0px)", opacity: 1, ease: "power2.out"
        });

        gsap.to(".color-shift-text", {
            scrollTrigger: { trigger: ".scroll-text-section", start: "top 60%", end: "bottom 60%", scrub: true },
            color: "#f5ede0", ease: "none"
        });

        // 4. Wave Animation on Titles
        gsap.to(".wave-text span", {
            scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: 2 },
            skewX: -15, scaleY: 1.1, stagger: 0.05, yoyo: true, repeat: -1, ease: "sine.inOut"
        });

        setupWobbleCards();
    }

    /* ═══════════ GLASS WOBBLE CARDS ═══════════ */
    function setupWobbleCards() {
        document.querySelectorAll('.glass-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                gsap.to(card, {
                    duration: 0.3,
                    rotateX: ((y - centerY) / centerY) * -12,
                    rotateY: ((x - centerX) / centerX) * 12,
                    transformPerspective: 800,
                    ease: "power2.out"
                });
            });
            card.addEventListener('mouseleave', () => {
                gsap.to(card, { duration: 0.6, rotateX: 0, rotateY: 0, ease: "elastic.out(1, 0.3)" });
            });
        });
    }

    /* ═══════════ INTERACTIVE STRING ENGINE ═══════════ */
    const stringCanvas = $('string-canvas');
    const strCtx = stringCanvas.getContext('2d');
    
    function resizeString() {
        stringCanvas.width = innerWidth;
        stringCanvas.height = 200;
    }
    resizeString();
    
    let strControlY = 100, strTargetY = 100;

    stringCanvas.addEventListener('mousemove', (e) => {
        const rect = stringCanvas.getBoundingClientRect();
        const mouseLocalX = e.clientX - rect.left;
        const mouseLocalY = e.clientY - rect.top;
        strTargetY = (mouseLocalX > innerWidth / 2 - 300 && mouseLocalX < innerWidth / 2 + 300) ? mouseLocalY : 100;
    });
    stringCanvas.addEventListener('mouseleave', () => { strTargetY = 100; });

    function animateString() {
        strCtx.clearRect(0, 0, stringCanvas.width, stringCanvas.height);
        strControlY += (strTargetY - strControlY) * 0.15; // Spring physics
        strCtx.beginPath();
        strCtx.moveTo(0, 100);
        strCtx.quadraticCurveTo(innerWidth / 2, strControlY, innerWidth, 100);
        strCtx.strokeStyle = 'rgba(200, 60, 40, 0.6)';
        strCtx.lineWidth = 1.5;
        strCtx.stroke();
        requestAnimationFrame(animateString);
    }

    /* ═══════════ PIXELATED SNAKE CURSOR ═══════════ */
    const trailContainer = $('cursor-trail-container');
    const cursorDot = $('cursor');
    const snakeDots = [];
    const numDots = 18; 
    
    for (let i = 0; i < numDots; i++) {
        const dot = document.createElement('div');
        dot.className = 'trail-dot';
        trailContainer.appendChild(dot);
        snakeDots.push({ x: 0, y: 0, element: dot });
    }

    addEventListener('mousemove', e => {
        S.mx = e.clientX; S.my = e.clientY;
        cursorDot.style.left = e.clientX + 'px';
        cursorDot.style.top  = e.clientY + 'px';
    });

    function animateSnakeTrail() {
        let x = S.mx, y = S.my;
        snakeDots.forEach((dot, index) => {
            const nextDot = snakeDots[index + 1] || snakeDots[0];
            dot.x = x; dot.y = y;
            dot.element.style.left = `${dot.x}px`;
            dot.element.style.top = `${dot.y}px`;
            dot.element.style.transform = `translate(-50%, -50%) scale(${(numDots - index) / numDots})`;
            dot.element.style.opacity = (numDots - index) / numDots;
            x += (nextDot.x - x) * 0.45; 
            y += (nextDot.y - y) * 0.45;
        });
        requestAnimationFrame(animateSnakeTrail);
    }

    /* ═══════════ RENDER LOOP & RESIZE ═══════════ */
    function loop() {
        if(R) R.render(SC, CAM);
        requestAnimationFrame(loop);
    }

    addEventListener('resize', () => {
        S.vw = innerWidth; S.vh = innerHeight;
        if(R) { R.setSize(S.vw, S.vh); CAM.aspect = S.vw / S.vh; CAM.updateProjectionMatrix(); }
        resizeString();
    });

    // Boot
    initThree();
    animateString();
    animateSnakeTrail();
    loop();

})();
