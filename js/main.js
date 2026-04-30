/* ============================================================
   MOʟTEN — Creative Portfolio
   main.js — All JavaScript interactions
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ── NAV HIDE / SHOW ON SCROLL ── */
  (function () {
    const nav = document.querySelector('.molten-nav');
    let lastScroll = 0, ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
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

  /* ── MOBILE HAMBURGER ── */
  window.toggleMenu = function () {
    const hamburger = document.getElementById('hamburger');
    const menu = document.getElementById('mobileMenu');
    hamburger.classList.toggle('open');
    menu.classList.toggle('open');
    document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
  };

 // Cursor — dot snaps, filled square lags + rotates
const dot    = document.getElementById('cursor-dot');
const square = document.getElementById('cursor-square');

let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
let sqX = mouseX, sqY = mouseY;
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
  sqX = lerp(sqX, mouseX, 0.055);
  sqY = lerp(sqY, mouseY, 0.055);
  angle += speed * 0.5;
  speed *= 0.92;
  if (square) {
    square.style.left = sqX + 'px';
    square.style.top  = sqY + 'px';
    square.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
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
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

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
    const colors = ['rgba(10,26,255,', 'rgba(31,59,255,', 'rgba(80,120,255,', 'rgba(140,170,255,', 'rgba(10,60,255,'];
    const style = document.createElement('style');
    style.textContent = `
      @keyframes rippleOut { 0%{transform:translate(-50%,-50%) scale(0);opacity:1} 60%{opacity:.6} 100%{transform:translate(-50%,-50%) scale(18);opacity:0} }
      @keyframes bubblePop { 0%{transform:translate(-50%,-50%) scale(0) translate(0,0);opacity:1} 60%{opacity:.8} 100%{transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(1);opacity:0} }
    `;
    document.head.appendChild(style);

    function spawnRipple(x, y) {
      ['8px', '5px'].forEach((sz, i) => {
        const el = document.createElement('div');
        el.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${sz};height:${sz};border-radius:50%;border:1.5px solid rgba(10,26,255,${i ? '0.6' : '0.9'});transform:translate(-50%,-50%) scale(0);pointer-events:none;z-index:9997;animation:rippleOut ${i ? '0.9' : '0.7'}s cubic-bezier(.2,.8,.4,1) ${i ? '0.08' : '0'}s forwards;`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1000);
      });
    }

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
      spawnRipple(x, y);
      const count = 10 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) setTimeout(() => spawnBubble(x, y), i * 18);
    }

    document.addEventListener('click', e => spawnBubbles(e.clientX, e.clientY));
    document.addEventListener('touchstart', e => {
      const t = e.touches[0];
      spawnBubbles(t.clientX, t.clientY);
    }, { passive: true });
  })();

  /* ── SPACE STARFIELD ── */
  (function () {
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

  /* ── FLOATING CARDS (zoom-through) ── */
  (function () {
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

});
