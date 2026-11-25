/* MOLTEN enhancements — edit CFG below to plug in your own content */
(function () {
  var CFG = {
    reelVideo: 'assets/reel.mp4',     // local showreel file (mp4/webm)
    reelYouTubeId: '',                // OR a YouTube video id, e.g. 'dQw4w9WgXcQ' (wins over reelVideo)
    formEndpoint: '',                 // Formspree/Web3Forms URL, e.g. 'https://formspree.io/f/xxxxxxx' (blank = mailto fallback)
    ytChannelId: '',                  // YouTube channel id (starts with UC...) to show latest videos
    channelUrl: 'https://www.youtube.com/@molten_fx'
  };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  function el(h) { var d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstChild; }

  /* ---- 1. SHOWREEL ---- */
  var reel = null, reelVid = null;
  function openReel() {
    if (!reel) {
      var media = CFG.reelYouTubeId
        ? '<iframe src="https://www.youtube.com/embed/' + CFG.reelYouTubeId + '?autoplay=1&rel=0" allow="autoplay; fullscreen" allowfullscreen></iframe>'
        : '<video controls playsinline preload="metadata"></video>';
      reel = el('<div class="mx-modal" role="dialog" aria-modal="true" aria-label="Showreel"><div class="mx-box"><button class="mx-close">CLOSE ✕</button>' + media +
        '<div class="mx-hint">SPACE / K play · J −5s · L +5s · F fullscreen · ESC close</div></div></div>');
      document.body.appendChild(reel);
      reelVid = $('video', reel);
      if (reelVid) { reelVid.src = CFG.reelVideo; reelVid.addEventListener('error', function () { $('.mx-hint', reel).textContent = 'Add your reel at ' + CFG.reelVideo + ' (or set reelYouTubeId in enhance.js)'; }); }
      reel.addEventListener('click', function (e) { if (e.target === reel || e.target.className === 'mx-close') closeReel(); });
    }
    reel.classList.add('open');
    if (reelVid) reelVid.play().catch(function () {});
  }
  function closeReel() { if (!reel) return; reel.classList.remove('open'); if (reelVid) reelVid.pause(); }
  var hb = null; // showreel button removed from hero

  /* ---- 2. HOVER VIDEO PREVIEWS (add data-preview="assets/previews/x.webm" to a card) ---- */
  $$('.project-card[data-preview]').forEach(function (c) {
    var v = null;
    c.addEventListener('mouseenter', function () {
      if (!v) { v = document.createElement('video'); v.className = 'card-preview'; v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'metadata'; v.src = c.dataset.preview; c.appendChild(v); }
      v.play().then(function () { v.classList.add('on'); }).catch(function () {});
    });
    c.addEventListener('mouseleave', function () { if (v) { v.classList.remove('on'); v.pause(); } });
  });

  /* ---- 3. BEFORE / AFTER SLIDER ---- */
  function buildBA(box) {
    if (box._ba) return; box._ba = 1;
    var f = box.dataset.beforeFilter || '';
    box.innerHTML = '<img src="' + box.dataset.after + '" alt="After" draggable="false"><img class="ba-top" src="' + box.dataset.before + '" alt="Before" draggable="false"' + (f ? ' style="filter:' + f + '"' : '') + '>' +
      '<span class="ba-tag l">' + (box.dataset.beforeLabel || 'Raw') + '</span><span class="ba-tag r">' + (box.dataset.afterLabel || 'Final') + '</span><div class="ba-bar"></div>';
    var top = $('.ba-top', box), bar = $('.ba-bar', box), drag = false;
    function set(x) { var r = box.getBoundingClientRect(), p = Math.max(0, Math.min(1, (x - r.left) / r.width)) * 100; top.style.clipPath = 'inset(0 ' + (100 - p) + '% 0 0)'; bar.style.left = p + '%'; }
    box.addEventListener('pointerdown', function (e) { drag = true; box.setPointerCapture(e.pointerId); set(e.clientX); });
    box.addEventListener('pointermove', function (e) { if (drag) set(e.clientX); });
    box.addEventListener('pointerup', function () { drag = false; });
  }
  $$('.ba-slider').forEach(buildBA);
  var baModal = null;
  document.addEventListener('click', function (e) {   // cards with data-before + data-after open a slider modal
    var c = e.target.closest && e.target.closest('.project-card[data-before][data-after]');
    if (!c) return;
    e.stopImmediatePropagation(); e.preventDefault();
    if (!baModal) { baModal = el('<div class="mx-modal"><div class="mx-box"><button class="mx-close">CLOSE ✕</button><div class="ba-slider"></div><div class="mx-hint">DRAG TO COMPARE · ESC close</div></div></div>'); document.body.appendChild(baModal); baModal.addEventListener('click', function (ev) { if (ev.target === baModal || ev.target.className === 'mx-close') baModal.classList.remove('open'); }); }
    var s = $('.ba-slider', baModal); s._ba = 0; s.dataset.before = c.dataset.before; s.dataset.after = c.dataset.after; s.dataset.beforeFilter = c.dataset.beforeFilter || ''; buildBA(s); baModal.classList.add('open');
  }, true);

  /* ---- 4. CONTACT FORM ---- */
  var form = $('#contactForm');
  if (form && CFG.formEndpoint) {
    var hp = el('<input type="text" name="_gotcha" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">'); form.appendChild(hp);
    form.addEventListener('submit', function (e) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var st = $('#formStatus'), btn = $('.form-submit', form); btn.disabled = true; st.textContent = 'Sending…';
      fetch(CFG.formEndpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw 0; form.reset(); st.textContent = '✓ Sent! I\u2019ll get back to you soon.'; })
        .catch(function () { st.textContent = 'Something went wrong — please try again or DM me on Instagram.'; })
        .then(function () { btn.disabled = false; });
    }, true);
  }

  /* ---- 6. TIMELINE PROGRESS + TIMECODE ---- */
  var bar = el('<div id="tlProgress"></div>'), head = el('<div id="tlHead"></div>'), tc = el('<div id="tcReadout">TC <b>00:00:00:00</b></div>');
  document.body.appendChild(bar); document.body.appendChild(head); document.body.appendChild(tc);
  var tcb = $('b', tc), tick = false;
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function upd() {
    var h = document.documentElement, max = Math.max(1, h.scrollHeight - innerHeight), p = Math.min(1, scrollY / max);
    bar.style.transform = 'scaleX(' + p + ')'; head.style.left = (p * (innerWidth - 2)) + 'px';
    var f = Math.round(p * 180 * 24); tcb.textContent = '00:' + pad(Math.floor(f / 1440)) + ':' + pad(Math.floor(f / 24) % 60) + ':' + pad(f % 24); tick = false;
  }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true }); upd();
  var tr = $('.tracks');
  if (tr && 'IntersectionObserver' in window) new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { tr.classList.add('go'); o.disconnect(); } }, { threshold: .3 }).observe(tr);

  /* ---- 7. CONTEXT CURSOR LABELS ---- */
  if (fine) {
    var lab = el('<div id="cursor-label"></div>'); document.body.appendChild(lab);
    addEventListener('mousemove', function (e) { lab.style.transform = 'translate(' + (e.clientX + 18) + 'px,' + (e.clientY + 18) + 'px)'; }, { passive: true });
    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest && e.target.closest('[data-cursor],.ba-slider,.project-card[data-before],.project-card[data-preview],.project-card[data-lightbox],.feat-card,.channel-card,.yt-card');
      var txt = '';
      if (t) txt = t.dataset.cursor || (t.matches('.ba-slider,[data-before]') ? 'DRAG' : t.matches('[data-preview]') ? 'PLAY' : t.matches('.channel-card,.yt-card,.feat-card') ? 'OPEN' : 'VIEW');
      lab.textContent = txt; lab.classList.toggle('show', !!txt);
    });
  }

  /* ---- 8. EDITOR KEYBOARD SHORTCUTS ---- */
  var help = el('<div id="kbHelp"><h4>SHORTCUTS</h4><div><kbd>1</kbd>–<kbd>5</kbd> Home · About · Portfolio · Services · Contact</div><div><kbd>J</kbd> <kbd>L</kbd> or <kbd>←</kbd> <kbd>→</kbd> Prev / next in lightbox</div><div><kbd>Space</kbd>/<kbd>K</kbd> <kbd>J</kbd> <kbd>L</kbd> <kbd>F</kbd> Reel: play · ±5s · fullscreen</div><div><kbd>Esc</kbd> Close · <kbd>?</kbd> This panel</div></div>');
  document.body.appendChild(help);
  var pages = ['index', 'about', 'projects', 'services', 'contact'];
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    var k = e.key.toLowerCase(), reelOpen = reel && reel.classList.contains('open'), lbOpen = $('.lb-overlay.lb-open');
    if (k === 'escape') { help.classList.remove('open'); closeReel(); if (baModal) baModal.classList.remove('open'); return; }
    if (k === '?') { help.classList.toggle('open'); return; }
    if (reelOpen && reelVid) {
      if (k === ' ' || k === 'k') { e.preventDefault(); reelVid.paused ? reelVid.play() : reelVid.pause(); }
      else if (k === 'j') reelVid.currentTime -= 5; else if (k === 'l') reelVid.currentTime += 5;
      else if (k === 'f') { reelVid.requestFullscreen && reelVid.requestFullscreen(); }
      return;
    }
    if (lbOpen) { if (k === 'j') $('#lbPrev') && $('#lbPrev').click(); else if (k === 'l') $('#lbNext') && $('#lbNext').click(); return; }
    if (k === 'r' && hb) { openReel(); return; }
    if (/^[1-5]$/.test(k)) location.href = pages[+k - 1] + '.html';
  });

})();
