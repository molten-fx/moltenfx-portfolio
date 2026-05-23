/* ============================================================
   MOʟTEN — Creative Portfolio
   main.js — All JavaScript interactions
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── NAV HIDE / SHOW ON SCROLL ── */
  (function () {
    const nav = document.querySelector('.molten-nav');
    let lastScroll = 0, ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          const current = window.scrollY;
          if (current <= 60) nav.classList.remove('nav-hidden');
          else if (current > lastScroll + 6) nav.classList.add('nav-hidden');
          else if (current < lastScroll - 4) nav.classList.remove('nav-hidden');
          lastScroll = current;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  })();

  /* ── CURSOR SHAPE CYCLE + SCALE + GLOW ── */
  (function () {
    const shapes = ['', 'cursor-triangle', 'cursor-circle'];
    let shapeIdx = 0;

    function setShape(i) {
      if (!square) return;
      square.classList.remove('cursor-triangle', 'cursor-circle');
      if (shapes[i]) square.classList.add(shapes[i]);
    }

    /* Click: advance shape + burst glow + bubbles */
    document.addEventListener('click', e => {
      shapeIdx = (shapeIdx + 1) % shapes.length;
      setShape(shapeIdx);
      window._cursorScale = 1.55;
      setTimeout(() => { window._cursorScale = 1; }, 200);
      if (dot)    { dot.classList.add('cursor-clicked');    setTimeout(() => dot.classList.remove('cursor-clicked'),    240); }
      if (square) { square.classList.add('cursor-clicked'); setTimeout(() => square.classList.remove('cursor-clicked'), 320); }
      if (window._spawnBubbles) window._spawnBubbles(e.clientX, e.clientY);
    });

    /* Hold to grow */
    document.addEventListener('mousedown', () => {
      window._cursorScale = 1.38;
      if (dot)    dot.classList.add('cursor-clicked');
      if (square) square.classList.add('cursor-clicked');
    });
    document.addEventListener('mouseup', () => {
      window._cursorScale = 1;
      if (dot)    dot.classList.remove('cursor-clicked');
      if (square) square.classList.remove('cursor-clicked');
    });
  })();

  /* ── MOBILE HAMBURGER ── */
  window.toggleMenu = function () {
    const hamburger = document.getElementById('hamburger');
    const menu = document.getElementById('mobileMenu');
    hamburger.classList.toggle('open');
    menu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', menu.classList.contains('open') ? 'true' : 'false');
    document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
  };

 // Cursor — dot snaps, filled square lags + rotates
const dot    = document.getElementById('cursor-dot');
const square = document.getElementById('cursor-square');

let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
let sqX = mouseX, sqY = mouseY;
let sqScale = 1;
let angle = 0, speed = 0;
let lastX = mouseX, lastY = mouseY;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (dot) {
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';
  }
  const dx = mouseX - lastX;
  const dy = mouseY - lastY;
  speed = Math.sqrt(dx * dx + dy * dy);
  lastX = mouseX;
  lastY = mouseY;
});

function lerp(a, b, t) { return a + (b - a) * t; }

(function animateSquare() {
  if (prefersReducedMotion) return;
  sqX = lerp(sqX, mouseX, 0.055);
  sqY = lerp(sqY, mouseY, 0.055);
  angle += speed * 0.5;
  speed *= 0.92;
  // Smoothly lerp scale toward target
  const targetScale = window._cursorScale || 1;
  sqScale = lerp(sqScale, targetScale, 0.14);
  if (square) {
    square.style.left = sqX + 'px';
    square.style.top  = sqY + 'px';
    square.style.transform = `translate(-50%, -50%) rotate(${angle}deg) scale(${sqScale})`;
  }
  requestAnimationFrame(animateSquare);
})();

document.querySelectorAll('a, button, .project-card, .service-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    if (!square) return;
    square.style.width  = '28px';
    square.style.height = '28px';
    square.style.background = 'rgba(10,26,255,0.9)';
    square.style.boxShadow = '0 0 20px rgba(10,26,255,0.9), 0 0 40px rgba(10,26,255,0.4)';
  });
  el.addEventListener('mouseleave', () => {
    if (!square) return;
    square.style.width  = '18px';
    square.style.height = '18px';
    square.style.background = 'rgba(10,26,255,0.75)';
    square.style.boxShadow = '0 0 10px rgba(10,26,255,0.6), 0 0 24px rgba(10,26,255,0.2)';
  });
});

document.addEventListener('mouseleave', () => {
  if (dot)    dot.style.opacity    = '0';
  if (square) square.style.opacity = '0';
});
document.addEventListener('mouseenter', () => {
  if (dot)    dot.style.opacity    = '1';
  if (square) square.style.opacity = '1';
});

  /* ── SMOOTH NAV LINKS ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });

  /* ── SCROLL REVEAL (legacy) ── */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ── POP IN / POP OUT SCROLL ANIMATION ── */
  const saObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const el = entry.target;
      if (entry.isIntersecting) {
        el.classList.remove('out-up', 'out-down', 'out-pop');
        el.classList.add('in');
      } else {
        const rect = el.getBoundingClientRect();
        el.classList.remove('in');
        if (rect.top < 0) {
          el.classList.add(el.classList.contains('sa-pop') ? 'out-pop' : 'out-up');
        } else {
          el.classList.add('out-down');
        }
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
  document.querySelectorAll('.sa').forEach(el => saObserver.observe(el));

  /* ── FILTER BUTTONS ── */
  function filterProjects(filter) {
    const grid = document.querySelector('.portfolio-grid');
    if (grid) grid.dataset.activeFilter = filter;
    document.querySelectorAll('.project-card').forEach(card => {
      const categories = (card.dataset.category || '').split(/\s+/);
      const shouldShow = categories.includes(filter);
      card.classList.toggle('is-hidden', !shouldShow);
    });
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const filter = this.dataset.filter || 'film';
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      filterProjects(filter);
    });
  });

  const activeFilter = document.querySelector('.filter-btn.active');
  if (activeFilter) filterProjects(activeFilter.dataset.filter || 'film');

  /* CONTACT FORM */
  (function () {
    const form = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');
    if (!form) return;

    const CONTACT_EMAIL = 'moltenfx2006@gmail.com';

    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const data = new FormData(form);
      const name = data.get('name');
      const email = data.get('email');
      const projectType = data.get('projectType');
      const message = data.get('message');
      const subject = encodeURIComponent(`Portfolio enquiry: ${projectType}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nProject Type: ${projectType}\n\nMessage:\n${message}`
      );

      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      if (status) status.textContent = 'Opening your email app...';
    });
  })();

  /* ── SHOWREEL VIDEO ── */
  const videoOverlay = document.getElementById('videoOverlay');
  const showreelFrame = document.getElementById('showreelFrame');
  const playBtn = document.getElementById('playBtn');
  if (videoOverlay && showreelFrame) {
    videoOverlay.addEventListener('click', function () {
      showreelFrame.src = showreelFrame.getAttribute('data-src');
      showreelFrame.style.opacity = '1';
      this.style.opacity = '0';
      this.style.pointerEvents = 'none';
    });
  }
  if (playBtn) {
    playBtn.addEventListener('mouseenter', function () {
      this.style.background = 'rgba(10,26,255,0.8)';
      this.style.borderColor = 'rgba(10,26,255,1)';
      this.style.transform = 'scale(1.1)';
    });
    playBtn.addEventListener('mouseleave', function () {
      this.style.background = 'transparent';
      this.style.borderColor = 'rgba(255,255,255,0.25)';
      this.style.transform = 'scale(1)';
    });
  }

  /* ── MARQUEE ── */
  (function () {
    if (prefersReducedMotion) return;
    const inner = document.getElementById('marqueeInner');
    if (!inner) return;
    const clone = inner.cloneNode(true);
    clone.removeAttribute('id');
    clone.style.cssText = 'position:absolute;top:0;left:0;height:44px;display:flex;align-items:center;';
    inner.parentNode.appendChild(clone);
    let singleW = inner.scrollWidth;
    let pos = 0, paused = false;
    const speed = 0.6;
    let lastT = null;
    inner.parentNode.addEventListener('mouseenter', () => paused = true);
    inner.parentNode.addEventListener('mouseleave', () => paused = false);
    window.addEventListener('resize', () => { singleW = inner.scrollWidth; });
    function tick(t) {
      if (lastT === null) lastT = t;
      const dt = Math.min(t - lastT, 32);
      lastT = t;
      if (!paused) {
        pos += speed * (dt / 16.667);
        if (pos >= singleW) pos -= singleW;
        inner.style.transform = `translateX(${-pos}px)`;
        clone.style.transform = `translateX(${singleW - pos}px)`;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  /* ── CLICK BUBBLE ANIMATION ── */
  (function () {
    if (prefersReducedMotion) return;
    const colors = ['rgba(10,26,255,', 'rgba(31,59,255,', 'rgba(80,120,255,', 'rgba(140,170,255,', 'rgba(10,60,255,'];
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bubblePop { 0%{transform:translate(-50%,-50%) scale(0) translate(0,0);opacity:1} 60%{opacity:.8} 100%{transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(1);opacity:0} }
    `;
    document.head.appendChild(style);

    function spawnBubble(x, y) {
      const el = document.createElement('div');
      const size = 4 + Math.random() * 14;
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 80;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist - (30 + Math.random() * 40);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const op = 0.4 + Math.random() * 0.6;
      const dur = 500 + Math.random() * 600;
      const hollow = Math.random() > 0.5;
      el.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;z-index:9996;transform:translate(-50%,-50%) scale(0);${hollow ? `border:1px solid ${color}${op});background:${color}${op * 0.15});` : `background:${color}${op});box-shadow:0 0 ${size * 1.5}px ${color}${op * 0.5});`}animation:bubblePop ${dur}ms cubic-bezier(.2,.8,.3,1) forwards;--tx:${tx}px;--ty:${ty}px;`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), dur + 100);
    }

    function spawnBubbles(x, y) {
      const count = 10 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) setTimeout(() => spawnBubble(x, y), i * 18);
    }
    window._spawnBubbles = spawnBubbles;


        document.addEventListener('touchstart', e => {
      const t = e.touches[0];
      spawnBubbles(t.clientX, t.clientY);
    }, { passive: true });
  })();

  /* ── SPACE STARFIELD ── */
  (function () {
    if (prefersReducedMotion) return;
    const canvas = document.getElementById('spaceCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;
    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    const layerDefs = [
      { count: 180, size: [0.3, 0.8], speed: 0.015, opacity: [0.3, 0.7] },
      { count:  90, size: [0.6, 1.2], speed: 0.008, opacity: [0.4, 0.9] },
      { count:  40, size: [1.0, 2.0], speed: 0.003, opacity: [0.5, 1.0] },
    ];
    const stars = [];
    layerDefs.forEach((layer, li) => {
      for (let i = 0; i < layer.count; i++) {
        stars.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: layer.size[0] + Math.random() * (layer.size[1] - layer.size[0]),
          baseOpacity: layer.opacity[0] + Math.random() * (layer.opacity[1] - layer.opacity[0]),
          twinkleSpeed: 0.004 + Math.random() * 0.008,
          twinkleOffset: Math.random() * Math.PI * 2,
          parallaxFactor: layer.speed,
          layerIndex: li,
          hue: Math.random() > 0.85 ? 'rgba(180,200,255,' : Math.random() > 0.7 ? 'rgba(200,215,255,' : 'rgba(255,255,255,',
        });
      }
    });

    let targetX = window.innerWidth / 2, targetY = window.innerHeight / 2;
    const smoothed = layerDefs.map((_, i) => ({ x: window.innerWidth / 2, y: window.innerHeight / 2, ease: 0.018 + i * 0.014 }));
    document.addEventListener('mousemove', e => { targetX = e.clientX; targetY = e.clientY; });
    let scrollY = 0;
    window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
    let frame = 0;

    function drawStarfield() {
      ctx.clearRect(0, 0, W, H);
      frame++;
      smoothed.forEach(s => { s.x += (targetX - s.x) * s.ease; s.y += (targetY - s.y) * s.ease; });
      stars.forEach(star => {
        const sm = smoothed[star.layerIndex];
        const ox = (sm.x - W / 2) * star.parallaxFactor * 8;
        const oy = (sm.y - H / 2) * star.parallaxFactor * 6 + scrollY * star.parallaxFactor * 0.5;
        const px = ((star.x + ox) % W + W) % W;
        const py = ((star.y + oy) % H + H) % H;
        const twinkle = 0.5 + 0.5 * Math.sin(frame * star.twinkleSpeed + star.twinkleOffset);
        const alpha = star.baseOpacity * (0.5 + 0.5 * twinkle);
        if (star.size > 1.4) {
          const glow = ctx.createRadialGradient(px, py, 0, px, py, star.size * 3);
          glow.addColorStop(0, star.hue + alpha + ')');
          glow.addColorStop(1, star.hue + '0)');
          ctx.beginPath(); ctx.arc(px, py, star.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = glow; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(px, py, star.size, 0, Math.PI * 2);
        ctx.fillStyle = star.hue + alpha + ')'; ctx.fill();
      });
      requestAnimationFrame(drawStarfield);
    }
    drawStarfield();

    /* Shooting stars */
    function launchShootingStar() {
      const el = document.getElementById('shootingStar');
      if (!el) return;
      el.style.left = (Math.random() * W * 0.7) + 'px';
      el.style.top  = (Math.random() * H * 0.3) + 'px';
      el.style.animation = 'none';
      el.getBoundingClientRect();
      el.style.animation = `shootingStarAnim ${1.2 + Math.random() * 0.8}s cubic-bezier(.4,0,1,1) forwards`;
      setTimeout(launchShootingStar, 3000 + Math.random() * 6000);
    }
    setTimeout(launchShootingStar, 2000);

    /* Constellation dots */
    function addConstellations(selector, count) {
      document.querySelectorAll(selector).forEach(section => {
        const con = document.createElement('div');
        con.className = 'constellation';
        section.style.position = 'relative';
        section.insertBefore(con, section.firstChild);
        const pts = [];
        for (let i = 0; i < count; i++) {
          const dot = document.createElement('div');
          dot.className = 'const-dot';
          const s = 1 + Math.random() * 2, x = 2 + Math.random() * 96, y = 2 + Math.random() * 96;
          dot.style.cssText = `width:${s}px;height:${s}px;left:${x}%;top:${y}%;--tw:${2 + Math.random() * 4}s;animation-delay:${Math.random() * 4}s;opacity:${0.2 + Math.random() * 0.5};`;
          con.appendChild(dot); pts.push({ x, y });
        }
        for (let i = 0; i < pts.length - 1; i++) {
          if (Math.random() > 0.55) continue;
          const a = pts[i], b = pts[i + 1];
          const dx = b.x - a.x, dy = b.y - a.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 25) continue;
          const line = document.createElement('div');
          line.className = 'const-line';
          line.style.cssText = `left:${a.x}%;top:${a.y}%;width:${len}%;transform:rotate(${Math.atan2(dy, dx) * 180 / Math.PI}deg);`;
          con.appendChild(line);
        }
      });
    }
    addConstellations('.services-section', 18);
    addConstellations('.about-section', 14);
    addConstellations('.contact-section', 12);
    addConstellations('.portfolio-section', 10);
  })();

  /* ── HERO CANVAS MOTION GRAPHIC ── */
  (function () {
    if (prefersReducedMotion) return;
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, cx, cy, t = 0;
    let mouseX = 0.5, mouseY = 0.5;

    function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; cx = W / 2; cy = H / 2; }
    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', e => { mouseX = e.clientX / window.innerWidth; mouseY = e.clientY / window.innerHeight; });

    const PARTICLE_COUNT = 120;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * 2000 - 1000, y: Math.random() * 2000 - 1000,
      z: Math.random() * 1000, speed: 0.3 + Math.random() * 0.5,
      size: Math.random() * 1.5 + 0.3, brightness: Math.random()
    }));

    const orbs = [
      { ox: -0.28, oy: 0.18, r: 0.32, hue: 220, speed: 0.00028 },
      { ox:  0.32, oy: -0.22, r: 0.22, hue: 230, speed: 0.00038 },
      { ox:  0.0,  oy: 0.35,  r: 0.18, hue: 215, speed: 0.00022 },
    ];
    const rings = [
      { baseR: 0.22, width: 1, speed: 0.00015, phase: 0,   alpha: 0.12 },
      { baseR: 0.38, width: 0.7, speed: -0.0001, phase: 1.2, alpha: 0.08 },
      { baseR: 0.55, width: 0.5, speed: 0.00008, phase: 2.5, alpha: 0.06 },
    ];
    const beams = [
      { angle: 0, speed: 0.00018, alpha: 0.06, spread: 0.06 },
      { angle: Math.PI, speed: -0.00012, alpha: 0.04, spread: 0.04 },
    ];

    function drawGrid() {
      const parallaxX = (mouseX - 0.5) * 40, parallaxY = (mouseY - 0.5) * 30;
      ctx.save(); ctx.translate(cx + parallaxX * 0.3, cy + parallaxY * 0.3);
      const rows = 20, cols = 24, gridW = 3200, vanishY = -H * 0.12;
      for (let r = 0; r <= rows; r++) { const pct = r/rows, frac = Math.pow(pct,1.6), sy = vanishY+(H*0.9-vanishY)*frac, w = gridW*(0.05+frac*0.95), a = frac*0.13*(0.5+0.5*Math.sin(t*0.001+pct*3)); ctx.beginPath(); ctx.moveTo(-w/2,sy); ctx.lineTo(w/2,sy); ctx.strokeStyle=`rgba(10,30,255,${a})`; ctx.lineWidth=0.5; ctx.stroke(); }
      for (let c = 0; c <= cols; c++) { const pct=(c/cols)-0.5, a=(1-Math.abs(pct)*1.4)*0.1; if(a<=0)continue; ctx.beginPath(); ctx.moveTo(0,vanishY); ctx.lineTo(pct*gridW,H*0.9-vanishY+vanishY); ctx.strokeStyle=`rgba(10,30,255,${a})`; ctx.lineWidth=0.4; ctx.stroke(); }
      ctx.restore();
    }
    function drawOrbs() {
      const px2 = (mouseX-0.5)*60, py2 = (mouseY-0.5)*40;
      orbs.forEach(o => { const ang=t*o.speed, px=cx+(o.ox*W)+Math.cos(ang)*W*0.06+px2*0.5, py=cy+(o.oy*H)+Math.sin(ang*1.3)*H*0.04+py2*0.5, r=o.r*Math.min(W,H), g=ctx.createRadialGradient(px,py,0,px,py,r), pulse=0.5+0.5*Math.sin(t*0.0006+(o.phase||0)); g.addColorStop(0,`hsla(${o.hue},100%,55%,${0.13+pulse*0.05})`); g.addColorStop(0.4,`hsla(${o.hue},100%,40%,${0.07+pulse*0.02})`); g.addColorStop(1,`hsla(${o.hue},100%,30%,0)`); ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2); ctx.fillStyle=g; ctx.fill(); });
    }
    function drawRings() {
      const px2=(mouseX-0.5)*20, py2=(mouseY-0.5)*14;
      rings.forEach(ring => { const r=ring.baseR*Math.min(W,H)*(1+0.04*Math.sin(t*0.0005+ring.phase)), rot=t*ring.speed; ctx.save(); ctx.translate(cx+px2,cy+py2); ctx.rotate(rot); const segs=48,dashLen=(2*Math.PI*r)/segs; ctx.setLineDash([dashLen*0.35,dashLen*0.65]); ctx.lineDashOffset=t*ring.speed*r*0.5; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.strokeStyle=`rgba(10,60,255,${ring.alpha})`; ctx.lineWidth=ring.width; ctx.stroke(); [0,Math.PI/2,Math.PI,Math.PI*1.5].forEach(ang=>{const tx=Math.cos(ang)*r,ty=Math.sin(ang)*r; ctx.beginPath(); ctx.arc(tx,ty,1.5,0,Math.PI*2); ctx.fillStyle=`rgba(30,80,255,${ring.alpha*3})`; ctx.setLineDash([]); ctx.fill();}); ctx.restore(); });
    }
    function drawBeams() {
      beams.forEach(beam => { beam.angle+=beam.speed*16; const len=Math.max(W,H)*1.5; ctx.save(); ctx.translate(cx,cy); ctx.rotate(beam.angle); const g=ctx.createLinearGradient(0,0,len,0); g.addColorStop(0,`rgba(10,26,255,${beam.alpha*1.5})`); g.addColorStop(0.3,`rgba(10,26,255,${beam.alpha})`); g.addColorStop(1,'rgba(10,26,255,0)'); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(len,-len*beam.spread); ctx.lineTo(len,len*beam.spread); ctx.closePath(); ctx.fillStyle=g; ctx.fill(); ctx.restore(); });
    }
    function drawParticles() {
      const px2=(mouseX-0.5)*30, py2=(mouseY-0.5)*20, fov=360;
      particles.forEach(p => { p.z-=p.speed*1.8; if(p.z<=1)p.z=900+Math.random()*100; const scale=fov/p.z, px=p.x*scale+cx+px2, py=p.y*scale+cy+py2; if(px<0||px>W||py<0||py>H)return; const size=p.size*scale*0.6, alpha=(1-p.z/1000)*0.6*(0.4+0.6*p.brightness), prevZ=p.z+p.speed*10, prevScale=fov/prevZ; ctx.beginPath(); ctx.moveTo(p.x*prevScale+cx+px2, p.y*prevScale+cy+py2); ctx.lineTo(px,py); ctx.strokeStyle=`rgba(80,120,255,${alpha*0.4})`; ctx.lineWidth=size*0.5; ctx.stroke(); ctx.beginPath(); ctx.arc(px,py,Math.max(0.3,size),0,Math.PI*2); ctx.fillStyle=`rgba(150,180,255,${alpha})`; ctx.fill(); });
    }
    function drawScanlines() {
      for(let i=0;i<6;i++){const y=((t*0.025+i*(H/6))%H),a=0.025*(1-Math.abs(y/H-0.5)*2); ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.strokeStyle=`rgba(10,40,255,${a})`; ctx.lineWidth=1; ctx.stroke();}
    }
    function drawCornerBrackets() {
      const bSize=Math.min(W,H)*0.06, pad=30, a=0.12+0.04*Math.sin(t*0.001);
      ctx.lineWidth=1; ctx.strokeStyle=`rgba(10,40,255,${a})`;
      [[pad,pad,1,1],[W-pad,pad,-1,1],[pad,H-pad,1,-1],[W-pad,H-pad,-1,-1]].forEach(([x,y,sx,sy])=>{ctx.beginPath();ctx.moveTo(x+bSize*sx,y);ctx.lineTo(x,y);ctx.lineTo(x,y+bSize*sy);ctx.stroke();});
    }
    function drawReticle() {
      const px2=(mouseX-0.5)*25, py2=(mouseY-0.5)*18, rx=cx+px2, ry=cy+py2, rSize=Math.min(W,H)*0.04, pulse=0.5+0.5*Math.sin(t*0.0015), alpha=0.1+pulse*0.06;
      ctx.save(); ctx.translate(rx,ry); ctx.rotate(t*0.0002);
      ctx.beginPath(); ctx.setLineDash([4,8]); ctx.arc(0,0,rSize*2,0,Math.PI*2); ctx.strokeStyle=`rgba(10,50,255,${alpha*0.6})`; ctx.lineWidth=0.8; ctx.stroke();
      ctx.setLineDash([]);
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{ctx.beginPath();ctx.moveTo(dx*rSize*0.3,dy*rSize*0.3);ctx.lineTo(dx*(rSize*0.3+rSize*0.7),dy*(rSize*0.3+rSize*0.7));ctx.strokeStyle=`rgba(30,80,255,${alpha})`;ctx.lineWidth=0.8;ctx.stroke();});
      ctx.beginPath(); ctx.arc(0,0,2,0,Math.PI*2); ctx.fillStyle=`rgba(60,120,255,${alpha*2})`; ctx.fill();
      ctx.restore();
    }
    function render() {
      ctx.clearRect(0,0,W,H);
      const vg=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*0.7); vg.addColorStop(0,'rgba(5,7,13,0)'); vg.addColorStop(1,'rgba(3,4,8,0.55)'); ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
      drawBeams(); drawOrbs(); drawGrid(); drawRings(); drawParticles(); drawScanlines(); drawCornerBrackets(); drawReticle();
      t+=16; requestAnimationFrame(render);
    }
    render();
  })();


  /* ================================================================
     LIQUID / BLOB HERO BACKGROUND
     Canvas-based organic metaballs — deep blue & indigo lava motion.
     Runs on every .page-hero-section that has a .blob-canvas inside.
     Uses layered smooth-noise (sum of sines) — zero dependencies.
  ================================================================ */
  (function () {
    if (prefersReducedMotion) return;

    /* smooth noise: sum of sine waves at multiple frequencies */
    function sn(x, y, t, seed) {
      var v = 0;
      var freqs = [0.8, 1.7, 3.1, 5.3];
      var amps  = [1.0, 0.5, 0.25, 0.125];
      for (var i = 0; i < freqs.length; i++) {
        var f = freqs[i];
        v += amps[i] * Math.sin(f * x * 1.3 + t * (0.31 + seed * 0.07) + seed * 2.1)
                     * Math.cos(f * y * 1.1 + t * (0.19 + seed * 0.05) + seed * 3.7);
      }
      return v; // range approx -1.8..+1.8
    }

    /* blob definitions: home pos (0-1 normalised), wander, size, colours */
    var BLOBS = [
      { hx:0.30, hy:0.55, wr:0.22, wry:0.18, speed:0.28, size:0.52,
        c0:'rgba(10,26,255,0.55)',  c1:'rgba(20,40,220,0.18)',  c2:'rgba(10,26,200,0)', seed:0 },
      { hx:0.72, hy:0.32, wr:0.20, wry:0.16, speed:0.22, size:0.42,
        c0:'rgba(80,20,210,0.48)',  c1:'rgba(60,10,180,0.15)',  c2:'rgba(40,0,160,0)',  seed:1 },
      { hx:0.78, hy:0.78, wr:0.16, wry:0.14, speed:0.34, size:0.33,
        c0:'rgba(30,80,255,0.44)',  c1:'rgba(10,50,220,0.14)',  c2:'rgba(5,30,180,0)',  seed:2 },
      { hx:0.18, hy:0.22, wr:0.14, wry:0.13, speed:0.19, size:0.28,
        c0:'rgba(0,40,200,0.38)',   c1:'rgba(5,20,180,0.12)',   c2:'rgba(0,10,150,0)',  seed:3 },
      { hx:0.52, hy:0.60, wr:0.18, wry:0.15, speed:0.26, size:0.36,
        c0:'rgba(100,10,200,0.32)', c1:'rgba(70,5,160,0.10)',   c2:'rgba(50,0,130,0)', seed:4 },
    ];

    function initBlob(canvas) {
      if (canvas._blobInit) return;
      canvas._blobInit = true;
      var ctx = canvas.getContext('2d');
      var W, H, t = Math.random() * 1000;
      var mouseX = 0.5, mouseY = 0.5, targetMX = 0.5, targetMY = 0.5;

      function resize() {
        W = canvas.width  = canvas.offsetWidth  || canvas.parentElement.offsetWidth;
        H = canvas.height = canvas.offsetHeight || canvas.parentElement.offsetHeight;
      }
      resize();
      if (typeof ResizeObserver !== 'undefined') { new ResizeObserver(resize).observe(canvas); }
      else { window.addEventListener('resize', resize); }

      document.addEventListener('mousemove', function (e) {
        var rect = canvas.getBoundingClientRect();
        if (rect.bottom < -300 || rect.top > window.innerHeight + 300) return;
        targetMX = e.clientX / window.innerWidth;
        targetMY = e.clientY / window.innerHeight;
      });

      function render() {
        requestAnimationFrame(render);
        t += 0.008;
        mouseX += (targetMX - mouseX) * 0.04;
        mouseY += (targetMY - mouseY) * 0.04;

        ctx.clearRect(0, 0, W, H);
        var minDim = Math.min(W, H);
        var mxo = (mouseX - 0.5) * 0.06;
        var myo = (mouseY - 0.5) * 0.04;

        BLOBS.forEach(function (b) {
          var nx = sn(b.hx, b.hy, t * b.speed,        b.seed);
          var ny = sn(b.hy, b.hx, t * b.speed + 10,   b.seed + 0.5);
          var bx = (b.hx + nx * b.wr  + mxo * (1 - b.hx)) * W;
          var by = (b.hy + ny * b.wry + myo * (1 - b.hy)) * H;
          var pulse = 1 + 0.12 * Math.sin(t * b.speed * 2.3 + b.seed * 1.9);
          var r = b.size * minDim * 0.55 * pulse;
          var g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
          g.addColorStop(0,    b.c0);
          g.addColorStop(0.45, b.c1);
          g.addColorStop(1,    b.c2);
          ctx.beginPath();
          ctx.arc(bx, by, r, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        });

        /* dark vignette — keeps text readable */
        var vg = ctx.createRadialGradient(W*.5,H*.5,0, W*.5,H*.5, Math.max(W,H)*.75);
        vg.addColorStop(0,   'rgba(3,4,12,0)');
        vg.addColorStop(0.6, 'rgba(3,4,12,0.15)');
        vg.addColorStop(1,   'rgba(3,4,12,0.55)');
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);
      }
      render();
    }

    function initAll() {
      document.querySelectorAll('.blob-canvas').forEach(initBlob);
    }
    initAll();
    setTimeout(initAll, 400);
  })();

  /* ── FLOATING CARDS (zoom-through) ── */
  (function () {
    if (prefersReducedMotion) return;
    const container = document.getElementById('floatCards');
    if (!container) return;
    const W = () => window.innerWidth, H = () => window.innerHeight;

    const templates = [
      { label:'Color Grading',tag:'VFX',grad:'linear-gradient(135deg,#0A0E1F,#0D1535,#060912)',accent:'rgba(10,40,220,0.25)',shape:'filmstrip',w:200,h:130},
      { label:'Motion Design',tag:'MOTION',grad:'linear-gradient(160deg,#07091A,#0B1228,#050810)',accent:'rgba(20,50,255,0.2)',shape:'circle_rings',w:160,h:210},
      { label:'Brand Identity',tag:'DESIGN',grad:'linear-gradient(120deg,#060A1C,#0C1530)',accent:'rgba(15,40,255,0.18)',shape:'grid_lines',w:180,h:120},
      { label:'VFX Compositing',tag:'VFX',grad:'linear-gradient(145deg,#080C1E,#0A1128)',accent:'rgba(30,60,255,0.22)',shape:'orbit',w:150,h:150},
      { label:'Short Film Edit',tag:'FILM',grad:'linear-gradient(130deg,#060812,#0D1530,#070A18)',accent:'rgba(10,30,210,0.2)',shape:'waveform',w:220,h:140},
      { label:'Poster Art',tag:'DESIGN',grad:'linear-gradient(155deg,#08091A,#0B1128)',accent:'rgba(20,50,255,0.15)',shape:'cross_hatch',w:150,h:190},
      { label:'Color Grade',tag:'EDIT',grad:'linear-gradient(140deg,#07091C,#0E1632)',accent:'rgba(10,40,240,0.2)',shape:'filmstrip',w:170,h:110},
      { label:'Kinetic Type',tag:'MOTION',grad:'linear-gradient(130deg,#060A1A,#0C1428)',accent:'rgba(15,45,255,0.18)',shape:'circle_rings',w:140,h:140},
      { label:'VFX Breakdown',tag:'VFX',grad:'linear-gradient(150deg,#07091B,#0B1330)',accent:'rgba(20,55,255,0.2)',shape:'orbit',w:160,h:120},
      { label:'3D Animation',tag:'3D',grad:'linear-gradient(135deg,#06081A,#0D1535)',accent:'rgba(10,35,230,0.22)',shape:'grid_lines',w:190,h:130},
    ];

    function svg(type, w, h) {
      const cx=w/2,cy=(h-32)/2;
      const s={
        filmstrip:`<svg width="${w}" height="${h-32}" viewBox="0 0 ${w} ${h-32}" style="position:absolute;top:0;left:0;opacity:.5;pointer-events:none"><rect x="10" y="8" width="${w-20}" height="${h-52}" rx="2" stroke="rgba(10,50,255,.35)" stroke-width=".8" fill="none"/>${[0,1,2,3,4].map(i=>`<rect x="${14+i*((w-28)/5)}" y="12" width="8" height="5" rx="1" fill="rgba(10,50,255,.25)"/>`).join('')}${[0,1,2,3,4].map(i=>`<rect x="${14+i*((w-28)/5)}" y="${h-48}" width="8" height="5" rx="1" fill="rgba(10,50,255,.25)"/>`).join('')}</svg>`,
        circle_rings:`<svg width="${w}" height="${h-32}" viewBox="0 0 ${w} ${h-32}" style="position:absolute;top:0;left:0;opacity:.5;pointer-events:none"><circle cx="${cx}" cy="${cy}" r="${Math.min(cx,cy)*.72}" stroke="rgba(10,55,255,.28)" stroke-width=".8" fill="none"/><circle cx="${cx}" cy="${cy}" r="${Math.min(cx,cy)*.46}" stroke="rgba(10,55,255,.38)" stroke-width=".8" fill="none" stroke-dasharray="3,5"/><circle cx="${cx}" cy="${cy}" r="${Math.min(cx,cy)*.2}" fill="rgba(10,55,255,.22)"/></svg>`,
        grid_lines:`<svg width="${w}" height="${h-32}" viewBox="0 0 ${w} ${h-32}" style="position:absolute;top:0;left:0;opacity:.38;pointer-events:none">${[1,2,3,4].map(i=>`<line x1="${i*(w/5)}" y1="0" x2="${i*(w/5)}" y2="${h-32}" stroke="rgba(10,50,255,.32)" stroke-width=".5"/>`).join('')}${[1,2,3].map(i=>`<line x1="0" y1="${i*((h-32)/4)}" x2="${w}" y2="${i*((h-32)/4)}" stroke="rgba(10,50,255,.32)" stroke-width=".5"/>`).join('')}<rect x="${w*.25}" y="${(h-32)*.25}" width="${w*.5}" height="${(h-32)*.5}" stroke="rgba(10,65,255,.55)" stroke-width=".8" fill="rgba(10,50,255,.07)"/></svg>`,
        orbit:`<svg width="${w}" height="${h-32}" viewBox="0 0 ${w} ${h-32}" style="position:absolute;top:0;left:0;opacity:.48;pointer-events:none"><ellipse cx="${cx}" cy="${cy}" rx="${cx*.76}" ry="${cy*.36}" stroke="rgba(10,55,255,.32)" stroke-width=".8" fill="none" stroke-dasharray="2,4"/><ellipse cx="${cx}" cy="${cy}" rx="${cx*.36}" ry="${cy*.76}" stroke="rgba(10,55,255,.22)" stroke-width=".8" fill="none" stroke-dasharray="2,4"/><circle cx="${cx}" cy="${cy}" r="5" fill="rgba(10,65,255,.55)"/></svg>`,
        waveform:`<svg width="${w}" height="${h-32}" viewBox="0 0 ${w} ${h-32}" style="position:absolute;top:0;left:0;opacity:.42;pointer-events:none"><polyline points="${Array.from({length:22},(_,i)=>`${i*(w/21)},${cy+Math.sin(i*.75)*cy*.62}`).join(' ')}" stroke="rgba(10,65,255,.55)" stroke-width="1.2" fill="none"/></svg>`,
        cross_hatch:`<svg width="${w}" height="${h-32}" viewBox="0 0 ${w} ${h-32}" style="position:absolute;top:0;left:0;opacity:.36;pointer-events:none">${Array.from({length:7},(_,i)=>`<line x1="${-w/2+i*(w/3)}" y1="0" x2="${w/2+i*(w/3)}" y2="${h-32}" stroke="rgba(10,50,255,.28)" stroke-width=".5"/>`).join('')}<rect x="${w*.3}" y="${(h-32)*.3}" width="${w*.4}" height="${(h-32)*.4}" stroke="rgba(10,65,255,.48)" stroke-width=".8" fill="rgba(10,50,255,.07)"/></svg>`,
      };
      return s[type]||s.grid_lines;
    }

    const activeCards=[], SLOT_COUNT=3, CYCLE_DURATION=5000;
    const slotPositions=[{x:.10,y:.22},{x:.78,y:.18},{x:.44,y:.74}];
    let templateIndex=0;

    function createSlot(i) {
      const tpl=templates[templateIndex++%templates.length], zone=slotPositions[i];
      const el=document.createElement('div');
      el.className='float-card';
      el.style.cssText=`width:${tpl.w}px;height:${tpl.h}px;border:1px solid rgba(255,255,255,.07);box-shadow:0 8px 32px rgba(0,0,0,.5);`;
      el.innerHTML=`<div style="width:100%;height:100%;position:relative;display:flex;align-items:flex-end;padding:10px;background:${tpl.grad};"><div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 80% at 50% 50%,${tpl.accent},transparent);border-radius:12px;"></div>${svg(tpl.shape,tpl.w,tpl.h)}<span style="position:absolute;top:9px;left:9px;font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:rgba(10,26,255,1);background:rgba(10,26,255,.14);border:1px solid rgba(10,26,255,.3);padding:3px 7px;border-radius:3px;z-index:2;">${tpl.tag}</span><span style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:rgba(240,242,255,.5);position:relative;z-index:1;">${tpl.label}</span></div>`;
      container.appendChild(el);
      return { el, tpl, originX:zone.x, originY:zone.y, progress:i/SLOT_COUNT, driftX:(Math.random()-.5)*.04, driftY:(Math.random()-.5)*.04, maxRot:(Math.random()-.5)*5, slotIndex:i };
    }

    for(let i=0;i<SLOT_COUNT;i++) activeCards.push(createSlot(i));
    let lastTime=performance.now();

    function tick(now) {
      const dt=Math.min(now-lastTime,50); lastTime=now;
      const vw=W(),vh=H();
      activeCards.forEach(card=>{
        card.progress+=dt/CYCLE_DURATION;
        if(card.progress>=1){
          card.progress-=1;
          const tpl=templates[templateIndex++%templates.length]; card.tpl=tpl;
          card.el.style.width=tpl.w+'px'; card.el.style.height=tpl.h+'px';
          card.el.innerHTML=`<div style="width:100%;height:100%;position:relative;display:flex;align-items:flex-end;padding:10px;background:${tpl.grad};"><div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 80% at 50% 50%,${tpl.accent},transparent);border-radius:12px;"></div>${svg(tpl.shape,tpl.w,tpl.h)}<span style="position:absolute;top:9px;left:9px;font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:rgba(10,26,255,1);background:rgba(10,26,255,.14);border:1px solid rgba(10,26,255,.3);padding:3px 7px;border-radius:3px;z-index:2;">${tpl.tag}</span><span style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:rgba(240,242,255,.5);position:relative;z-index:1;">${tpl.label}</span></div>`;
          card.driftX=(Math.random()-.5)*.04; card.driftY=(Math.random()-.5)*.04; card.maxRot=(Math.random()-.5)*5;
        }
        const p=card.progress; let scale,opacity;
        if(p<.70){const t=p/.70,ease=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; scale=.05+ease*2.4; opacity=(t<.10?t/.10:t>.82?1-(t-.82)/.18:1)*.65;}
        else{const t=(p-.70)/.30,ease=t*t*t; scale=2.45+ease*5.0; opacity=(1-t)*.22;}
        const driftAngle=p*Math.PI*2, px=(card.originX+Math.sin(driftAngle*.6)*card.driftX)*vw, py=(card.originY+Math.cos(driftAngle*.4)*card.driftY)*vh;
        const rot=Math.sin(p*Math.PI)*card.maxRot, tx=px-(card.tpl.w/2), ty=py-(card.tpl.h/2);
        card.el.style.transform=`translate(${tx}px,${ty}px) scale(${scale}) rotate(${rot}deg)`;
        card.el.style.opacity=opacity;
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)lastTime=performance.now();});
  })();

  /* ── SKILL BAR FILL on scroll into view ── */
  (function () {
    const cards = document.querySelectorAll('.skill-card');
    if (!cards.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); obs.unobserve(e.target); } });
    }, { threshold: 0.3 });
    cards.forEach(c => obs.observe(c));
  })();

  /* ================================================================
     LIGHTBOX — graphics-design & illustration cards
  ================================================================ */
  (function () {
    const overlay  = document.getElementById('lbOverlay');
    if (!overlay) return;

    const backdrop = document.getElementById('lbBackdrop');
    const closeBtn = document.getElementById('lbClose');
    const prevBtn  = document.getElementById('lbPrev');
    const nextBtn  = document.getElementById('lbNext');
    const lbImg    = document.getElementById('lbImg');
    const spinner  = document.getElementById('lbSpinner');
    const lbTitle  = document.getElementById('lbTitle');
    const lbTag    = document.getElementById('lbTag');
    const lbCtr    = document.getElementById('lbCounter');

    // Build ordered list of all lightbox cards in current visible tab
    let cards = [];
    let current = 0;

    function gatherCards() {
      cards = Array.from(
        document.querySelectorAll('.project-card[data-lightbox="true"]:not(.is-hidden)')
      );
    }

    function getCatLabel(card) {
      const cat = card.dataset.category || '';
      if (cat === 'graphics-design')  return 'Graphic Design';
      if (cat === 'illustration')     return 'Illustration';
      if (cat === 'ai')               return 'AI';
      if (cat === 'web-design')       return 'Web Design';
      return cat;
    }

    function loadImage(src) {
      lbImg.classList.add('lb-loading');
      spinner.classList.add('lb-spinning');
      const tmp = new Image();
      tmp.onload = () => {
        lbImg.src = src;
        lbImg.classList.remove('lb-loading');
        spinner.classList.remove('lb-spinning');
      };
      tmp.onerror = () => {
        lbImg.src = src;
        lbImg.classList.remove('lb-loading');
        spinner.classList.remove('lb-spinning');
      };
      tmp.src = src;
    }

    function show(idx) {
      gatherCards();
      if (!cards.length) return;
      current = (idx + cards.length) % cards.length;
      const card = cards[current];

      const img   = card.dataset.lbImg   || '';
      const title = card.dataset.lbTitle || '';
      const tag   = getCatLabel(card);

      loadImage(img);
      lbTitle.textContent = title;
      lbTag.textContent   = tag;
      lbCtr.textContent   = `${current + 1} / ${cards.length}`;
      lbImg.alt           = title;

      overlay.classList.add('lb-open');
      document.body.style.overflow = 'hidden';

      // Show/hide nav arrows
      prevBtn.style.display = cards.length > 1 ? 'flex' : 'none';
      nextBtn.style.display = cards.length > 1 ? 'flex' : 'none';
    }

    function close() {
      overlay.classList.remove('lb-open');
      document.body.style.overflow = '';
      setTimeout(() => { lbImg.src = ''; }, 350);
    }

    // Open on card click
    document.addEventListener('click', e => {
      const card = e.target.closest('.project-card[data-lightbox="true"]');
      if (!card) return;
      gatherCards();
      const idx = cards.indexOf(card);
      show(idx >= 0 ? idx : 0);
    });

    // Navigation
    nextBtn.addEventListener('click',  e => { e.stopPropagation(); show(current + 1); });
    prevBtn.addEventListener('click',  e => { e.stopPropagation(); show(current - 1); });
    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);

    // Keyboard navigation
    document.addEventListener('keydown', e => {
      if (!overlay.classList.contains('lb-open')) return;
      if (e.key === 'Escape')     close();
      if (e.key === 'ArrowRight') show(current + 1);
      if (e.key === 'ArrowLeft')  show(current - 1);
    });

    // Touch swipe
    let touchX = 0;
    overlay.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    overlay.addEventListener('touchend',   e => {
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) dx < 0 ? show(current + 1) : show(current - 1);
    });
  })();

  /* ── SHOWCASE SECTION SCROLL REVEAL + FADE OUT ── */
  (function () {
    const els = document.querySelectorAll('.sc-reveal');
    if (!els.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          // Fade in: remove out, add in
          e.target.classList.remove('sc-out');
          e.target.classList.add('sc-in');
        } else if (e.target.classList.contains('sc-in')) {
          // Fade out only after it has already faded in once
          e.target.classList.remove('sc-in');
          e.target.classList.add('sc-out');
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    els.forEach(el => obs.observe(el));
  })();

  /* ── SHOWCASE LIGHTBOX — image cards and biz cards ── */
  (function () {
    // Re-use the existing lightbox elements
    const overlay = document.getElementById('lbOverlay');
    if (!overlay) return;

    document.addEventListener('click', e => {
      // Check for showcase image card or biz card click
      const card = e.target.closest('.showcase-img-card[data-lightbox], .showcase-biz-card[data-lightbox]');
      if (!card) return;

      const img   = card.dataset.lbImg   || card.querySelector('img')?.src || '';
      const title = card.dataset.lbTitle || '';

      const lbImg   = document.getElementById('lbImg');
      const lbTitle = document.getElementById('lbTitle');
      const lbTag   = document.getElementById('lbTag');
      const lbCtr   = document.getElementById('lbCounter');
      const spinner = document.getElementById('lbSpinner');

      if (!lbImg) return;

      // Gather siblings for prev/next
      const section = card.closest('.showcase-section');
      const allCards = section
        ? Array.from(section.querySelectorAll('[data-lightbox]'))
        : [card];
      const idx = allCards.indexOf(card);

      // Store on overlay for nav use
      overlay._showcaseCards = allCards;
      overlay._showcaseIdx   = idx;

      function openIdx(i) {
        const c   = allCards[i];
        const src = c.dataset.lbImg || c.querySelector('img')?.src || '';
        const ttl = c.dataset.lbTitle || '';
        lbImg.classList.add('lb-loading');
        if (spinner) spinner.classList.add('lb-spinning');
        const tmp   = new Image();
        tmp.onload = tmp.onerror = () => {
          lbImg.src = src;
          lbImg.classList.remove('lb-loading');
          if (spinner) spinner.classList.remove('lb-spinning');
        };
        tmp.src = src;
        if (lbTitle) lbTitle.textContent = ttl;
        if (lbTag)   lbTag.textContent   = 'Illustration';
        if (lbCtr)   lbCtr.textContent   = `${i + 1} / ${allCards.length}`;
        overlay._showcaseIdx = i;
        const prev = document.getElementById('lbPrev');
        const next = document.getElementById('lbNext');
        if (prev) prev.style.display = allCards.length > 1 ? 'flex' : 'none';
        if (next) next.style.display = allCards.length > 1 ? 'flex' : 'none';
      }

      openIdx(idx);
      overlay.classList.add('lb-open');
      document.body.style.overflow = 'hidden';
      // Flag so the main lightbox nav also works
      overlay._isShowcase = true;
    });

    // Patch nav buttons to also handle showcase mode
    const prev = document.getElementById('lbPrev');
    const next = document.getElementById('lbNext');
    if (prev) prev.addEventListener('click', () => {
      if (!overlay._isShowcase || !overlay._showcaseCards) return;
      const n = (overlay._showcaseIdx - 1 + overlay._showcaseCards.length) % overlay._showcaseCards.length;
      overlay._showcaseIdx = n;
      const c = overlay._showcaseCards[n];
      const lbImg = document.getElementById('lbImg');
      if (lbImg) { lbImg.src = c.dataset.lbImg || c.querySelector('img')?.src || ''; }
      const lbTitle = document.getElementById('lbTitle');
      if (lbTitle) lbTitle.textContent = c.dataset.lbTitle || '';
      const lbCtr = document.getElementById('lbCounter');
      if (lbCtr) lbCtr.textContent = `${n+1} / ${overlay._showcaseCards.length}`;
    });
    if (next) next.addEventListener('click', () => {
      if (!overlay._isShowcase || !overlay._showcaseCards) return;
      const n = (overlay._showcaseIdx + 1) % overlay._showcaseCards.length;
      overlay._showcaseIdx = n;
      const c = overlay._showcaseCards[n];
      const lbImg = document.getElementById('lbImg');
      if (lbImg) { lbImg.src = c.dataset.lbImg || c.querySelector('img')?.src || ''; }
      const lbTitle = document.getElementById('lbTitle');
      if (lbTitle) lbTitle.textContent = c.dataset.lbTitle || '';
      const lbCtr = document.getElementById('lbCounter');
      if (lbCtr) lbCtr.textContent = `${n+1} / ${overlay._showcaseCards.length}`;
    });

    // Reset flag on close
    const closeBtn  = document.getElementById('lbClose');
    const backdrop  = document.getElementById('lbBackdrop');
    [closeBtn, backdrop].forEach(el => {
      if (el) el.addEventListener('click', () => { overlay._isShowcase = false; });
    });
  })();

  /* ================================================================
     #1 — MAGNETIC CURSOR EFFECT
     Buttons, cards, nav links pull toward the cursor on hover
  ================================================================ */
  (function () {
    const MAGNETIC_SELECTORS = [
      '.btn-primary-molten',
      '.btn-secondary-molten',
      '.nav-cta',
      '.feat-link',
      '.project-link',
      '.contact-cta-btn',
      '.cv-open-btn',
      '.cv-download-btn',
      '.cv-btn',
      '.featured-view-all',
      '.mbn-item',
      '.channel-card',
      '.footer-social a',
    ].join(',');

    const STRENGTH = 0.38;   // how far element moves (0–1)
    const EASE     = 0.12;   // lerp speed

    const magnetics = [];

    function initMagnetic(el) {
      let tx = 0, ty = 0, cx = 0, cy = 0;
      let raf = null;

      function onMove(e) {
        const rect = el.getBoundingClientRect();
        const cx0  = rect.left + rect.width  / 2;
        const cy0  = rect.top  + rect.height / 2;
        tx = (e.clientX - cx0) * STRENGTH;
        ty = (e.clientY - cy0) * STRENGTH;
      }

      function onLeave() {
        tx = 0; ty = 0;
      }

      function animate() {
        cx = lerp(cx, tx, EASE);
        cy = lerp(cy, ty, EASE);
        el.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px)`;
        if (Math.abs(cx - tx) > 0.05 || Math.abs(cy - ty) > 0.05) {
          raf = requestAnimationFrame(animate);
        } else {
          cx = tx; cy = ty;
          el.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px)`;
          raf = null;
        }
      }

      function startAnim() {
        if (!raf) raf = requestAnimationFrame(animate);
      }

      el.addEventListener('mousemove',  e => { onMove(e);  startAnim(); });
      el.addEventListener('mouseleave', () => { onLeave(); startAnim(); });
      magnetics.push(el);
    }

    // Init on load + re-init on tab switch (new cards may appear)
    function initAll() {
      document.querySelectorAll(MAGNETIC_SELECTORS).forEach(el => {
        if (!el._magnetic) {
          el._magnetic = true;
          // Preserve any existing transition for non-transform props
          const cur = el.style.transition;
          el.style.transition = cur
            ? cur + ', transform 0.1s ease'
            : 'transform 0.1s ease';
          initMagnetic(el);
        }
      });
    }

    // Run after DOM ready
    initAll();
    // Also re-run when filter buttons are clicked (new cards shown)
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => setTimeout(initAll, 50));
    });
  })();





  /* ================================================================
     #6 — 3D CARD TILT ON HOVER
     Direct cursor-tracking — no lerp lag while hovering,
     smooth ease-back only on mouse leave
  ================================================================ */
  (function () {
    if (prefersReducedMotion) return;

    var TILT_MAX    = 12;    // max degrees
    var LEAVE_EASE  = 0.18;  // ease speed when returning to flat (higher = faster snap-back)
    var SCALE       = 1.03;

    function initTilt(el) {
      if (el._tilt) return;
      el._tilt = true;

      var cx = 0, cy = 0, sc = 1;
      var leaving = false, raf = null;
      var enterTimer = null;  // debounce rapid enter/leave at corners

      el.style.transformStyle = 'preserve-3d';
      el.style.willChange = 'transform';

      // Clamp helper — prevents extreme corner values that cause jumps
      function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }

      function getTilt(e, rect) {
        // Scale-expansion gap: when the card scales up by (SCALE-1),
        // each edge grows by half that fraction of its dimension.
        // We add 8px extra buffer to absorb subpixel rounding.
        // This is proportional, so large cards get a larger safe-zone than small ones.
        var padX = rect.width  * (SCALE - 1) / 2 + 8;
        var padY = rect.height * (SCALE - 1) / 2 + 8;
        var nx = clamp((e.clientX - rect.left - padX) / (rect.width  - padX * 2), 0, 1);
        var ny = clamp((e.clientY - rect.top  - padY) / (rect.height - padY * 2), 0, 1);
        return {
          rx:  (nx - 0.5) * TILT_MAX * 2,
          ry: -(ny - 0.5) * TILT_MAX * 2
        };
      }

      function applyTransform(rx, ry, scale) {
        el.style.transform =
          'perspective(800px) rotateX(' + ry.toFixed(3) + 'deg) rotateY(' + rx.toFixed(3) + 'deg) scale3d(' + scale.toFixed(4) + ',' + scale.toFixed(4) + ',1)';
      }

      // While leaving: ease cx/cy/sc back to 0/0/1
      function leaveLoop() {
        cx += (0 - cx) * LEAVE_EASE;
        cy += (0 - cy) * LEAVE_EASE;
        sc += (1 - sc) * LEAVE_EASE;
        applyTransform(cx, cy, sc);
        if (Math.abs(cx) > 0.01 || Math.abs(cy) > 0.01 || Math.abs(sc - 1) > 0.001) {
          raf = requestAnimationFrame(leaveLoop);
        } else {
          cx = 0; cy = 0; sc = 1;
          applyTransform(0, 0, 1);
          el.style.transition = ''; // restore any CSS transitions
          raf = null;
        }
      }

      el.addEventListener('mouseenter', function (e) {
        // Cancel any pending leave that was debounced
        if (enterTimer) { clearTimeout(enterTimer); enterTimer = null; }
        leaving = false;
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        // Kill any CSS transition on transform so JS updates are instant
        el.style.transition = 'none';
        sc = SCALE;
        var rect = el.getBoundingClientRect();
        var t = getTilt(e, rect);
        cx = t.rx; cy = t.ry;
        applyTransform(cx, cy, sc);
      });

      el.addEventListener('mousemove', function (e) {
        if (leaving) return;
        var rect = el.getBoundingClientRect();
        var t = getTilt(e, rect);
        cx = t.rx; cy = t.ry;
        applyTransform(cx, cy, SCALE);
      });

      el.addEventListener('mouseleave', function () {
        // Debounce delay scales with card area — large cards repaint slower,
        // so they need a bigger window to absorb corner bounce re-entries.
        // Clamped between 30ms (small cards) and 80ms (huge hero cards).
        var rect = el.getBoundingClientRect();
        var area = rect.width * rect.height;
        var delay = Math.min(Math.max(Math.round(area / 8000), 30), 80);
        enterTimer = setTimeout(function () {
          enterTimer = null;
          leaving = true;
          if (raf) cancelAnimationFrame(raf);
          raf = requestAnimationFrame(leaveLoop);
        }, delay);
      });
    }

    function initAll() {
      document.querySelectorAll('.project-card, .feat-card, .service-card, .skill-card, .achievement-item').forEach(initTilt);
    }

    initAll();
    document.querySelectorAll('.filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { setTimeout(initAll, 60); });
    });
  })();

  /* #8 — Lenis removed: using native browser scrolling */

  /* ================================================================
     #9 — SKILL BAR COUNTER ANIMATION
     Numbers count up as skill bars fill
  ================================================================ */
  (function () {
    var cards = document.querySelectorAll('.skill-card');
    if (!cards.length) return;

    // Inject counter span into each skill bar
    cards.forEach(function (card) {
      var bar = card.querySelector('.skill-bar-fill');
      if (!bar || card.querySelector('.skill-pct')) return;
      var pct = (bar.style.getPropertyValue('--pct') || '0%').replace('%','');
      var span = document.createElement('span');
      span.className = 'skill-pct';
      span.textContent = '0%';
      span.setAttribute('data-target', pct);
      card.querySelector('.skill-bar').appendChild(span);
    });

    // Animate counter on scroll in
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var span = e.target.querySelector('.skill-pct');
        if (!span || span._counted) return;
        span._counted = true;
        var target = parseInt(span.getAttribute('data-target'), 10);
        var start  = 0, duration = 1200, startTime = null;
        function step(ts) {
          if (!startTime) startTime = ts;
          var progress = Math.min((ts - startTime) / duration, 1);
          var ease = 1 - Math.pow(1 - progress, 3);
          span.textContent = Math.round(ease * target) + '%';
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        obs.unobserve(e.target);
      });
    }, { threshold: 0.4 });

    cards.forEach(function (c) { obs.observe(c); });
  })();

  /* #10 — Horizontal scroll removed: featured section uses normal grid layout */

  /* ── NAV LOGO GLITCH ── */
  (function () {
    if (prefersReducedMotion) return;
    var logos = document.querySelectorAll('.nav-logo');
    logos.forEach(function (logo) {
      logo.setAttribute('data-text', logo.textContent);
      var sl = document.createElement('span');
      sl.className = 'nav-logo-scanlines';
      logo.appendChild(sl);
      var tear = document.createElement('span');
      tear.className = 'nav-logo-tear';
      logo.appendChild(tear);
    });

    var GLITCH_DURATION = 680; // ms — matches CSS animation length

    function fireGlitch() {
      logos.forEach(function (logo) {
        if (logo.classList.contains('glitching')) return;
        logo.classList.add('glitching');
        setTimeout(function () { logo.classList.remove('glitching'); }, GLITCH_DURATION);
      });
    }

    function triggerGlitch() {
      fireGlitch();

      // 45% chance of a rapid double-burst (makes it feel erratic/alive)
      if (Math.random() < 0.45) {
        setTimeout(function () { fireGlitch(); }, GLITCH_DURATION + 80 + Math.random() * 120);
      }

      // Next glitch: random 1.8s – 5s (tighter range = more frequent)
      setTimeout(triggerGlitch, 1800 + Math.random() * 3200);
    }

    // First glitch fires quickly so visitors notice it right away
    setTimeout(triggerGlitch, 800 + Math.random() * 800);

    // Also trigger on logo hover for instant feedback
    logos.forEach(function (logo) {
      logo.addEventListener('mouseenter', function () {
        if (!logo.classList.contains('glitching')) fireGlitch();
      });
    });
  })();

  /* ================================================================
     #11 — SCROLLBAR GLOW
     Adds `is-scrolling` to body while scrolling so CSS can light up
     the scrollbar thumb with a blue glow
  ================================================================ */
  (function () {
    var scrollTimer = null;
    window.addEventListener('scroll', function () {
      document.body.classList.add('is-scrolling');
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        document.body.classList.remove('is-scrolling');
      }, 150);
    }, { passive: true });
  })();

});