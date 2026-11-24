/* ============================================================
   MOʟTEN — WebGL Fluid Simulation
   fluid.js — Real-time Navier-Stokes fluid on GPU
   Electric blue / molten metal palette
   ============================================================ */

(function () {
  'use strict';

  const canvas = document.getElementById('fluidCanvas');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ── WebGL context ── */
  const gl = canvas.getContext('webgl', {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: false,
  });
  if (!gl) return;

  /* ── Extensions ── */
  const extHalfFloat = gl.getExtension('OES_texture_half_float');
  const extHalfFloatLinear = gl.getExtension('OES_texture_half_float_linear');
  const extFloat = gl.getExtension('OES_texture_float');
  const extFloatLinear = gl.getExtension('OES_texture_float_linear');

  const halfFloat = extHalfFloat ? extHalfFloat.HALF_FLOAT_OES : null;
  const hasLinearHalf = !!extHalfFloatLinear;
  const hasLinearFloat = !!extFloatLinear;

  // Pick best supported float format
  let texType, filterType;
  if (extFloat && hasLinearFloat) {
    texType = gl.FLOAT;
    filterType = gl.LINEAR;
  } else if (halfFloat && hasLinearHalf) {
    texType = halfFloat;
    filterType = gl.LINEAR;
  } else if (extFloat) {
    texType = gl.FLOAT;
    filterType = gl.NEAREST;
  } else if (halfFloat) {
    texType = halfFloat;
    filterType = gl.NEAREST;
  } else {
    // Fallback: no float textures → use UNSIGNED_BYTE + visual degradation
    texType = gl.UNSIGNED_BYTE;
    filterType = gl.LINEAR;
  }

  /* ── Simulation resolution ── */
  const SIM_RESOLUTION = 128;
  const DYE_RESOLUTION = 512;
  const PRESSURE_ITERATIONS = 20;

  /* ── State ── */
  let W = 0, H = 0;
  let simW, simH, dyeW, dyeH;

  /* ── Framebuffer helper ── */
  function createFBO(w, h, internalFormat, format, type, filter) {
    gl.activeTexture(gl.TEXTURE0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    return { texture: tex, fbo: fb, width: w, height: h,
      texelSizeX: 1 / w, texelSizeY: 1 / h };
  }

  function createDoubleFBO(w, h, internalFormat, format, type, filter) {
    let fbo1 = createFBO(w, h, internalFormat, format, type, filter);
    let fbo2 = createFBO(w, h, internalFormat, format, type, filter);
    return {
      width: w, height: h,
      texelSizeX: fbo1.texelSizeX, texelSizeY: fbo1.texelSizeY,
      get read() { return fbo1; },
      get write() { return fbo2; },
      swap() { let t = fbo1; fbo1 = fbo2; fbo2 = t; },
    };
  }

  /* ── Shader helpers ── */
  function compileShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      console.warn('Shader compile error:', gl.getShaderInfoLog(s));
    return s;
  }

  function createProgram(vertSrc, fragSrc) {
    const p = gl.createProgram();
    gl.attachShader(p, compileShader(gl.VERTEX_SHADER, vertSrc));
    gl.attachShader(p, compileShader(gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS))
      console.warn('Program link error:', gl.getProgramInfoLog(p));

    // Auto-cache all uniform locations
    const uniforms = {};
    const count = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(p, i);
      uniforms[info.name] = gl.getUniformLocation(p, info.name);
    }
    return { program: p, uniforms };
  }

  /* ── Full-screen quad ── */
  const quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

  function bindQuad(attrib) {
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.vertexAttribPointer(attrib, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attrib);
  }

  function blit(target) {
    if (target) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.viewport(0, 0, target.width, target.height);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /* ================================================================
     GLSL SHADERS
  ================================================================ */

  const BASE_VERT = `
    precision highp float;
    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform vec2 texelSize;
    void main () {
      vUv = aPosition * 0.5 + 0.5;
      vL = vUv - vec2(texelSize.x, 0.0);
      vR = vUv + vec2(texelSize.x, 0.0);
      vT = vUv + vec2(0.0, texelSize.y);
      vB = vUv - vec2(0.0, texelSize.y);
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const SIMPLE_VERT = `
    precision highp float;
    attribute vec2 aPosition;
    varying vec2 vUv;
    void main () {
      vUv = aPosition * 0.5 + 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  /* Advection */
  const ADVECT_FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform vec2 dyeTexelSize;
    uniform float dt;
    uniform float dissipation;
    vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
      vec2 st = uv / tsize - 0.5;
      vec2 iuv = floor(st);
      vec2 fuv = fract(st);
      vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
      vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
      vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
      vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
      return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
    }
    void main () {
      vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
      vec4 result = dissipation * bilerp(uSource, coord, dyeTexelSize);
      float decay = 1.0 + dissipation * dt;
      gl_FragColor = result / decay;
    }
  `;

  /* Divergence */
  const DIVERGENCE_FRAG = `
    precision mediump float;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    void main () {
      float L = texture2D(uVelocity, vL).x;
      float R = texture2D(uVelocity, vR).x;
      float T = texture2D(uVelocity, vT).y;
      float B = texture2D(uVelocity, vB).y;
      vec2 C = texture2D(uVelocity, vUv).xy;
      if (vL.x < 0.0) { L = -C.x; }
      if (vR.x > 1.0) { R = -C.x; }
      if (vT.y > 1.0) { T = -C.y; }
      if (vB.y < 0.0) { B = -C.y; }
      float div = 0.5 * (R - L + T - B);
      gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
  `;

  /* Curl */
  const CURL_FRAG = `
    precision mediump float;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    void main () {
      float L = texture2D(uVelocity, vL).y;
      float R = texture2D(uVelocity, vR).y;
      float T = texture2D(uVelocity, vT).x;
      float B = texture2D(uVelocity, vB).x;
      float vorticity = R - L - T + B;
      gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
    }
  `;

  /* Vorticity confinement */
  const VORTICITY_FRAG = `
    precision highp float;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float curl;
    uniform float dt;
    void main () {
      float L = texture2D(uCurl, vL).x;
      float R = texture2D(uCurl, vR).x;
      float T = texture2D(uCurl, vT).x;
      float B = texture2D(uCurl, vB).x;
      float C = texture2D(uCurl, vUv).x;
      vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
      force /= length(force) + 0.0001;
      force *= curl * C;
      force.y *= -1.0;
      vec2 velocity = texture2D(uVelocity, vUv).xy;
      velocity += force * dt;
      velocity = min(max(velocity, -1000.0), 1000.0);
      gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
  `;

  /* Pressure */
  const PRESSURE_FRAG = `
    precision mediump float;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;
    void main () {
      float L = texture2D(uPressure, vL).x;
      float R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x;
      float B = texture2D(uPressure, vB).x;
      float C = texture2D(uPressure, vUv).x;
      float divergence = texture2D(uDivergence, vUv).x;
      float pressure = (L + R + B + T - divergence) * 0.25;
      gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
  `;

  /* Pressure gradient subtract */
  const GRADIENT_FRAG = `
    precision mediump float;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;
    void main () {
      float L = texture2D(uPressure, vL).x;
      float R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x;
      float B = texture2D(uPressure, vB).x;
      vec2 velocity = texture2D(uVelocity, vUv).xy;
      velocity.xy -= vec2(R - L, T - B);
      gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
  `;

  /* Splat — injects velocity/dye */
  const SPLAT_FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;
    void main () {
      vec2 p = vUv - point.xy;
      p.x *= aspectRatio;
      vec3 splat = exp(-dot(p, p) / radius) * color;
      vec3 base = texture2D(uTarget, vUv).xyz;
      gl_FragColor = vec4(base + splat, 1.0);
    }
  `;

  /* Display — renders dye with electric-blue color mapping */
  const DISPLAY_FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTexture;

    /* Maps dye density → electric blue / molten metal palette */
    vec3 moltenPalette(float t) {
      t = clamp(t, 0.0, 1.0);

      /* Deep void */
      vec3 c0 = vec3(0.02, 0.02, 0.06);
      /* Electric core blue */
      vec3 c1 = vec3(0.04, 0.10, 0.99);
      /* Bright cyan-white hot */
      vec3 c2 = vec3(0.30, 0.60, 1.00);
      /* Ice-white peak */
      vec3 c3 = vec3(0.85, 0.92, 1.00);

      if (t < 0.33) return mix(c0, c1, t / 0.33);
      if (t < 0.66) return mix(c1, c2, (t - 0.33) / 0.33);
      return mix(c2, c3, (t - 0.66) / 0.34);
    }

    void main () {
      vec3 dye = texture2D(uTexture, vUv).rgb;
      float lum = dot(dye, vec3(0.299, 0.587, 0.114));
      /* remap 0-1 with slight gamma lift */
      float t = pow(clamp(lum * 1.4, 0.0, 1.0), 0.72);
      vec3 col = moltenPalette(t);
      /* add a faint chromatic split on the blue channel for depth */
      float blue = texture2D(uTexture, vUv + vec2(0.001, 0.0)).b;
      col.b = mix(col.b, blue * 1.6, 0.15);
      /* Vignette */
      vec2 uv2 = vUv * 2.0 - 1.0;
      float vign = 1.0 - dot(uv2 * vec2(0.5, 0.7), uv2 * vec2(0.5, 0.7));
      vign = pow(clamp(vign, 0.0, 1.0), 0.5);
      col *= 0.15 + 0.85 * vign;
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  /* ── Compile programs ── */
  const advectProg   = createProgram(SIMPLE_VERT, ADVECT_FRAG);
  const divergeProg  = createProgram(BASE_VERT,   DIVERGENCE_FRAG);
  const curlProg     = createProgram(BASE_VERT,   CURL_FRAG);
  const vorticityProg= createProgram(BASE_VERT,   VORTICITY_FRAG);
  const pressureProg = createProgram(BASE_VERT,   PRESSURE_FRAG);
  const gradientProg = createProgram(BASE_VERT,   GRADIENT_FRAG);
  const splatProg    = createProgram(SIMPLE_VERT, SPLAT_FRAG);
  const displayProg  = createProgram(SIMPLE_VERT, DISPLAY_FRAG);

  /* ── Bind quad to all programs ── */
  [advectProg, divergeProg, curlProg, vorticityProg, pressureProg, gradientProg, splatProg, displayProg].forEach(p => {
    gl.useProgram(p.program);
    const loc = gl.getAttribLocation(p.program, 'aPosition');
    if (loc >= 0) bindQuad(loc);
  });

  /* ── FBOs ── */
  let velocity, dye, divergence, curl, pressure;

  function initFBOs() {
    const ratio = W / H;
    simW = Math.round(SIM_RESOLUTION * ratio);
    simH = SIM_RESOLUTION;
    dyeW = Math.round(DYE_RESOLUTION * ratio);
    dyeH = DYE_RESOLUTION;

    const rgba  = gl.RGBA;
    const rgba16 = gl.RGBA; // WebGL1 uses RGBA for both
    const fType = texType;
    const fFilter = filterType;

    if (velocity) {
      // Recreate with new sizes
      velocity  = createDoubleFBO(simW, simH, rgba, rgba, fType, fFilter);
      dye       = createDoubleFBO(dyeW, dyeH, rgba, rgba, fType, fFilter);
      divergence= createFBO(simW, simH, rgba, rgba, fType, gl.NEAREST);
      curl      = createFBO(simW, simH, rgba, rgba, fType, gl.NEAREST);
      pressure  = createDoubleFBO(simW, simH, rgba, rgba, fType, gl.NEAREST);
    } else {
      velocity  = createDoubleFBO(simW, simH, rgba, rgba, fType, fFilter);
      dye       = createDoubleFBO(dyeW, dyeH, rgba, rgba, fType, fFilter);
      divergence= createFBO(simW, simH, rgba, rgba, fType, gl.NEAREST);
      curl      = createFBO(simW, simH, rgba, rgba, fType, gl.NEAREST);
      pressure  = createDoubleFBO(simW, simH, rgba, rgba, fType, gl.NEAREST);
    }
  }

  /* ── Texture binding helper ── */
  function bindTexture(unit, tex) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    return unit;
  }

  /* ── Splat ── */
  function splat(x, y, dx, dy, color) {
    gl.useProgram(splatProg.program);
    gl.uniform1i(splatProg.uniforms['uTarget'], bindTexture(0, velocity.read.texture));
    gl.uniform1f(splatProg.uniforms['aspectRatio'], W / H);
    gl.uniform2f(splatProg.uniforms['point'], x / W, 1 - y / H);
    gl.uniform3f(splatProg.uniforms['color'], dx, -dy, 0);
    gl.uniform1f(splatProg.uniforms['radius'], CONFIG.SPLAT_RADIUS / 100);
    blit(velocity.write);
    velocity.swap();

    gl.uniform1i(splatProg.uniforms['uTarget'], bindTexture(0, dye.read.texture));
    gl.uniform3f(splatProg.uniforms['color'], color.r, color.g, color.b);
    gl.uniform1f(splatProg.uniforms['radius'], CONFIG.SPLAT_RADIUS / 100);
    blit(dye.write);
    dye.swap();
  }

  /* ── Simulation step ── */
  function step(dt) {
    gl.disable(gl.BLEND);

    /* Curl */
    gl.useProgram(curlProg.program);
    gl.uniform2f(curlProg.uniforms['texelSize'], velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(curlProg.uniforms['uVelocity'], bindTexture(0, velocity.read.texture));
    blit(curl);

    /* Vorticity */
    gl.useProgram(vorticityProg.program);
    gl.uniform2f(vorticityProg.uniforms['texelSize'], velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(vorticityProg.uniforms['uVelocity'], bindTexture(0, velocity.read.texture));
    gl.uniform1i(vorticityProg.uniforms['uCurl'],     bindTexture(1, curl.texture));
    gl.uniform1f(vorticityProg.uniforms['curl'], CONFIG.CURL);
    gl.uniform1f(vorticityProg.uniforms['dt'], dt);
    blit(velocity.write);
    velocity.swap();

    /* Divergence */
    gl.useProgram(divergeProg.program);
    gl.uniform2f(divergeProg.uniforms['texelSize'], velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(divergeProg.uniforms['uVelocity'], bindTexture(0, velocity.read.texture));
    blit(divergence);

    /* Clear pressure */
    gl.useProgram(pressureProg.program);
    gl.uniform2f(pressureProg.uniforms['texelSize'], velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(pressureProg.uniforms['uDivergence'], bindTexture(1, divergence.texture));
    for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(pressureProg.uniforms['uPressure'], bindTexture(0, pressure.read.texture));
      blit(pressure.write);
      pressure.swap();
    }

    /* Gradient subtract */
    gl.useProgram(gradientProg.program);
    gl.uniform2f(gradientProg.uniforms['texelSize'], velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gradientProg.uniforms['uPressure'], bindTexture(0, pressure.read.texture));
    gl.uniform1i(gradientProg.uniforms['uVelocity'], bindTexture(1, velocity.read.texture));
    blit(velocity.write);
    velocity.swap();

    /* Advect velocity */
    gl.useProgram(advectProg.program);
    gl.uniform2f(advectProg.uniforms['texelSize'], velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform2f(advectProg.uniforms['dyeTexelSize'], velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(advectProg.uniforms['uVelocity'], bindTexture(0, velocity.read.texture));
    gl.uniform1i(advectProg.uniforms['uSource'],   bindTexture(1, velocity.read.texture));
    gl.uniform1f(advectProg.uniforms['dt'], dt);
    gl.uniform1f(advectProg.uniforms['dissipation'], CONFIG.VELOCITY_DISSIPATION);
    blit(velocity.write);
    velocity.swap();

    /* Advect dye */
    gl.uniform2f(advectProg.uniforms['dyeTexelSize'], dye.texelSizeX, dye.texelSizeY);
    gl.uniform1i(advectProg.uniforms['uVelocity'], bindTexture(0, velocity.read.texture));
    gl.uniform1i(advectProg.uniforms['uSource'],   bindTexture(1, dye.read.texture));
    gl.uniform1f(advectProg.uniforms['dissipation'], CONFIG.DENSITY_DISSIPATION);
    blit(dye.write);
    dye.swap();
  }

  /* ── Display ── */
  function render() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.useProgram(displayProg.program);
    gl.uniform1i(displayProg.uniforms['uTexture'], bindTexture(0, dye.read.texture));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /* ── Config ── */
  const CONFIG = {
    VELOCITY_DISSIPATION: 0.18,
    DENSITY_DISSIPATION:  0.92,
    SPLAT_RADIUS:         0.28,
    CURL:                 28,
    SPLAT_FORCE:          6000,
    AUTO_SPLAT_INTERVAL:  700,  // ms between autonomous splats
  };

  /* ── Input tracking ── */
  const pointers = [];
  function createPointer() { return { id: -1, x: 0, y: 0, dx: 0, dy: 0, down: false, moved: false, color: randomColor() }; }
  const pointer = createPointer();
  pointers.push(pointer);

  /* Electric blue palette for splat colours */
  function randomColor() {
    const hue = 200 + Math.random() * 40; // 200-240°
    const sat = 0.9 + Math.random() * 0.1;
    const lum = 0.5 + Math.random() * 0.3;
    return hslToRgb(hue / 360, sat, lum);
  }

  function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) { r = g = b = l; } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1/6) return p + (q-p)*6*t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q-p)*(2/3-t)*6;
        return p;
      };
      const q = l < 0.5 ? l*(1+s) : l+s-l*s;
      const p = 2*l - q;
      r = hue2rgb(p, q, h+1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h-1/3);
    }
    // Bias heavily toward blue
    return { r: r * 0.3, g: g * 0.5, b: b * 1.5 };
  }

  /* ── Mouse / touch events ── */
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) * (W / rect.width);
    const ny = (e.clientY - rect.top)  * (H / rect.height);
    pointer.moved = pointer.down || true; // always react to hover
    pointer.dx = nx - pointer.x;
    pointer.dy = ny - pointer.y;
    pointer.x  = nx;
    pointer.y  = ny;
    pointer.down = true;
    pointer.color = randomColor();
  }, { passive: true });

  canvas.addEventListener('mouseleave', () => { pointer.down = false; pointer.moved = false; });
  canvas.addEventListener('mousedown',  () => { pointer.down = true; });
  canvas.addEventListener('mouseup',    () => { pointer.down = false; });

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    pointer.x  = (t.clientX - rect.left) * (W / rect.width);
    pointer.y  = (t.clientY - rect.top)  * (H / rect.height);
    pointer.dx = 0; pointer.dy = 0;
    pointer.down = true; pointer.moved = true;
    pointer.color = randomColor();
  }, { passive: false });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const nx = (t.clientX - rect.left) * (W / rect.width);
    const ny = (t.clientY - rect.top)  * (H / rect.height);
    pointer.dx = nx - pointer.x;
    pointer.dy = ny - pointer.y;
    pointer.x  = nx; pointer.y = ny;
    pointer.moved = true;
    pointer.color = randomColor();
  }, { passive: false });

  canvas.addEventListener('touchend', () => { pointer.down = false; pointer.moved = false; });

  /* ── Autonomous fluid motion ── */
  let autoSplatTimer = 0;
  function autoSplat(timestamp) {
    if (timestamp - autoSplatTimer < CONFIG.AUTO_SPLAT_INTERVAL) return;
    autoSplatTimer = timestamp;
    const x = W * (0.2 + Math.random() * 0.6);
    const y = H * (0.2 + Math.random() * 0.6);
    const angle = Math.random() * Math.PI * 2;
    const force = 800 + Math.random() * 1200;
    const col = randomColor();
    splat(x, y, Math.cos(angle) * force, Math.sin(angle) * force, col);
  }

  /* Initial seed — a few splats to "wake up" the fluid */
  function seedFluid() {
    const seeds = [
      { x: 0.25, y: 0.5,  dx:  1, dy:  0.4 },
      { x: 0.75, y: 0.5,  dx: -1, dy: -0.3 },
      { x: 0.5,  y: 0.25, dx:  0.3, dy: 1   },
      { x: 0.5,  y: 0.75, dx: -0.4, dy: -1  },
    ];
    seeds.forEach(s => {
      const f = CONFIG.SPLAT_FORCE * 0.6;
      splat(s.x * W, s.y * H, s.dx * f, s.dy * f, randomColor());
    });
  }

  /* ── Resize ── */
  function resize() {
    const displayW = canvas.clientWidth;
    const displayH = canvas.clientHeight;
    if (canvas.width !== displayW || canvas.height !== displayH) {
      canvas.width  = displayW;
      canvas.height = displayH;
      W = displayW; H = displayH;
      initFBOs();
      seedFluid();
    }
  }

  /* ── Main loop ── */
  let lastTime = null;

  function loop(timestamp) {
    requestAnimationFrame(loop);

    resize();
    if (!W || !H) return;

    const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.016) : 0.016;
    lastTime = timestamp;

    /* Inject user input */
    if (pointer.moved) {
      splat(pointer.x, pointer.y,
        pointer.dx * CONFIG.SPLAT_FORCE * dt,
        pointer.dy * CONFIG.SPLAT_FORCE * dt,
        pointer.color
      );
      pointer.moved = false;
    }

    /* Autonomous background motion */
    autoSplat(timestamp);

    step(dt);
    render();
  }

  /* Kick off */
  W = canvas.clientWidth;
  H = canvas.clientHeight;
  canvas.width  = W;
  canvas.height = H;
  initFBOs();
  seedFluid();
  requestAnimationFrame(loop);

})();
