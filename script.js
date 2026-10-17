/* ============================================================
   高清茹·作品集 — 三屏推进式切换
   屏1(打印) → 撕纸飘离 → 屏2(水墨+星光) → 平缓淡入 → 屏3(目录)
   ============================================================ */
const video = document.querySelector('#openingVideo');
const trigger = document.querySelector('#printTrigger');
const tearTrigger = document.querySelector('#tearTrigger');
const mediaStage = document.querySelector('#mediaStage');
const particleField = document.querySelector('#particleField');
const resumeSharpener = document.querySelector('#resumeSharpener');
const backBtn = document.querySelector('#backBtn');
const stageDots = document.querySelectorAll('#stageDots .dot');

let hasStarted = false;
let stage = 0; // 0 屏1 / 1 屏2 / 2 屏3 / 3 屏4(项目1)
let locked = false;

/* ---------------- 撕纸音效：撕开的瞬间播放"嘶啦"声 ---------------- */
let tearAudioCtx = null;
function playTearSound() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!tearAudioCtx) tearAudioCtx = new Ctx();
    if (tearAudioCtx.state === 'suspended') tearAudioCtx.resume();
    const ctx = tearAudioCtx;
    const now = ctx.currentTime;
    // 白噪声 buffer
    const len = Math.floor(ctx.sampleRate * 0.9);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    // 声源
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    // 带通滤波，扫频从高到低模拟撕纸
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(4200, now);
    bp.frequency.exponentialRampToValueAtTime(900, now + 0.7);
    // 增益：快速爆发后衰减
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.55, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    src.connect(bp).connect(gain).connect(ctx.destination);
    src.start(now);
    src.stop(now + 0.95);
  } catch (e) { /* 音效失败不影响转场 */ }
}

/* ---------------- 打印按钮粒子 ---------------- */
function buildParticles() {
  const fragment = document.createDocumentFragment();
  const total = 34;
  for (let index = 0; index < total; index += 1) {
    const particle = document.createElement('span');
    const angle = (Math.PI * 2 * index) / total;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    particle.className = 'fire-particle';
    particle.style.setProperty('--x0', `${50 + cos * 34}%`);
    particle.style.setProperty('--y0', `${50 + sin * 26}%`);
    particle.style.setProperty('--x1', `${50 + cos * (64 + (index % 4) * 4)}%`);
    particle.style.setProperty('--y1', `${50 + sin * (49 + (index % 3) * 4)}%`);
    particle.style.setProperty('--delay', `${(index % 9) * -0.115}s`);
    fragment.appendChild(particle);
  }
  particleField.appendChild(fragment);
}

function updateSharpResume() {
  if (!Number.isFinite(video.duration) || video.duration <= 0) return;
  const showAt = Math.max(0, video.duration - 0.6);
  const isComplete = video.currentTime >= showAt;
  resumeSharpener.classList.toggle('is-visible', isComplete);
}

function setBodyStage(next) {
  document.body.classList.remove('stage-open', 'stage-designer', 'stage-contents', 'stage-project1');
  const cls = next === 0 ? 'stage-open' : next === 1 ? 'stage-designer' : next === 2 ? 'stage-contents' : 'stage-project1';
  document.body.classList.add(cls);
  stageDots.forEach((dot, i) => dot.classList.toggle('is-on', i === next));
}

/* ---------------- 屏1 → 屏2：播放打印视频，结束后翻页掀起 ---------------- */
async function playOriginalVideo() {
  if (hasStarted || locked) return;
  hasStarted = true;
  locked = true;
  trigger.classList.add('is-energized');

  window.setTimeout(async () => {
    mediaStage.classList.add('is-playing');
    trigger.classList.remove('is-energized');
    video.currentTime = 0;

    try {
      await video.play();
    } catch (error) {
      hasStarted = false;
      locked = false;
      mediaStage.classList.remove('is-playing');
      trigger.style.opacity = '1';
      trigger.style.pointerEvents = 'auto';
      return;
    }

    // 视频播完 → 简历已浮现 → 显示"点击撕开作品集"提示，解除锁定等用户点击
    video.addEventListener('ended', () => {
      video.pause();
      updateSharpResume();
      locked = false;
      showTearTrigger();
    }, { once: true });
  }, 280);
}

/* 打印完成后显示"点击撕开"提示按钮 */
function showTearTrigger() {
  tearTrigger.classList.add('is-visible');
  tearTrigger.classList.add('is-pulsing');
}

function openContentsAfterTear() {
  if (locked) return;
  locked = true;
  tearTrigger.classList.remove('is-visible', 'is-pulsing');
  setBodyStage(2);
  document.body.classList.add('is-tearing');
  stage = 2;
  playTearSound();
  window.setTimeout(() => {
    document.body.classList.remove('is-tearing');
    locked = false;
  }, 1650);
}

/* 重置屏2 水墨动画，使其在重复进入时重新播放 */
function resetStageTwoAnimations() {
  const selectors = ['.designer-base', '.designer-ink', '.ink-wash'];
  selectors.forEach((sel) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
  });
}

/* ---------------- 屏2 → 屏3：平缓淡入 ---------------- */
function goToContents() {
  if (locked || stage !== 1) return;
  locked = true;
  setBodyStage(2);
  stage = 2;
  window.setTimeout(() => { locked = false; }, 900);
}

/* ---------------- 屏3 → 屏4：目录滚到底继续下滑进入第一个项目 ---------------- */
function goToProject1() {
  if (locked || stage !== 2) return;
  locked = true;
  setBodyStage(3);
  stage = 3;
  const p1 = document.querySelector('#stageProject1');
  if (p1) p1.scrollTop = 0;
  window.setTimeout(() => { locked = false; }, 1100);
}

/* 屏3 滚动触底检测：目录滚动到底部后继续向下滚，进入第一个项目 */
function setupContentsScrollLink() {
  const contents = document.querySelector('#stageContents');
  if (!contents) return;
  // 全局滚轮：当处于屏3 且已滚到底时，继续向下滚则进入屏4。
  // 挂在 window 上，确保鼠标位于任何位置都能触发衔接。
  window.addEventListener('wheel', (e) => {
    if (document.body.classList.contains('stage-contents') && e.deltaY > 0) {
      const atBottom = contents.scrollHeight - contents.scrollTop - contents.clientHeight < 40;
      if (atBottom) {
        e.preventDefault();
        goToProject1();
      }
    }
  }, { passive: false });
}

/* ---------------- 返回上一屏 ---------------- */
function goBack() {
  if (locked) return;
  if (stage === 3) {
    // 屏4 → 屏3：回到目录顶部
    setBodyStage(2);
    stage = 2;
    const contents = document.querySelector('#stageContents');
    if (contents) contents.scrollTop = 0;
    window.setTimeout(() => { locked = false; }, 700);
  } else if (stage === 2) {
    // 目录直接返回打印首页；蝴蝶过渡页已移除。
    hasStarted = false;
    setBodyStage(0);
    stage = 0;
    mediaStage.classList.remove('is-playing');
    resumeSharpener.classList.remove('is-visible');
    tearTrigger.classList.remove('is-visible', 'is-pulsing');
    video.pause();
    video.currentTime = 0;
  } else if (stage === 1) {
    // 回到屏1：复位打印流程，可重新播放
    hasStarted = false;
    setBodyStage(0);
    stage = 0;
    mediaStage.classList.remove('is-playing');
    resumeSharpener.classList.remove('is-visible');
    tearTrigger.classList.remove('is-visible', 'is-pulsing');
    video.pause();
    video.currentTime = 0;
  }
}

buildParticles();
trigger.addEventListener('click', playOriginalVideo);
tearTrigger.addEventListener('click', openContentsAfterTear);
video.addEventListener('timeupdate', updateSharpResume);
video.addEventListener('seeked', updateSharpResume);
backBtn.addEventListener('click', goBack);
setupContentsScrollLink();

/* ---------------- 光标尾迹 ---------------- */
function setupCursorTrail() {
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const canvas = document.querySelector('#cursorTrail');
  const context = canvas.getContext('2d');
  const dots = [];
  let width = 0;
  let height = 0;
  let ratio = 1;
  let raf = 0;

  function resize() {
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    for (let index = dots.length - 1; index >= 0; index -= 1) {
      const dot = dots[index];
      dot.x += dot.vx;
      dot.y += dot.vy;
      dot.vy += 0.012;
      dot.life -= 0.026;
      dot.size *= .982;

      if (dot.life <= 0) { dots.splice(index, 1); continue; }

      context.beginPath();
      context.fillStyle = `rgba(${dot.color}, ${Math.max(0, dot.life)})`;
      context.shadowColor = `rgba(${dot.glow}, ${dot.life * .7})`;
      context.shadowBlur = 8;
      context.arc(dot.x, dot.y, Math.max(.4, dot.size), 0, Math.PI * 2);
      context.fill();
    }
    raf = dots.length ? requestAnimationFrame(draw) : 0;
  }

  window.addEventListener('pointermove', (event) => {
    const palette = [
      ['17, 20, 28', '52, 74, 255'],
      ['36, 49, 255', '87, 105, 255'],
      ['255, 255, 255', '255, 255, 255']
    ];
    for (let index = 0; index < 3; index += 1) {
      const selected = palette[Math.floor(Math.random() * palette.length)];
      dots.push({
        x: event.clientX + (Math.random() - .5) * 7,
        y: event.clientY + (Math.random() - .5) * 7,
        vx: (Math.random() - .5) * .8,
        vy: (Math.random() - .5) * .55,
        size: .8 + Math.random() * 2.2,
        life: .68 + Math.random() * .28,
        color: selected[0],
        glow: selected[1]
      });
    }
    if (!raf) raf = requestAnimationFrame(draw);
  }, { passive: true });

  window.addEventListener('resize', resize, { passive: true });
  resize();
}

/* ---------------- 星光撒落（屏2 / 屏3）/ 暖色细闪（屏4） ---------------- */
function setupSparkCanvas(canvas) {
  const context = canvas.getContext('2d');
  const section = canvas.closest('.stage');
  const isDark = section.classList.contains('stage--contents');
  const isP1 = section.classList.contains('stage--project1');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sparks = [];
  let width = 0;
  let height = 0;
  let ratio = 1;
  let raf = 0;

  function createSpark(fromTop = false) {
    // 屏3 是"下雪"效果：雪点更慢、更柔和、密度更高，持续飘落
    if (isDark) {
      return {
        x: Math.random() * width,
        y: fromTop ? -Math.random() * height * .3 : Math.random() * height,
        speed: reducedMotion ? .2 : .35 + Math.random() * .55,
        radius: .6 + Math.random() * 1.7,
        length: 3 + Math.random() * 8,
        alpha: .28 + Math.random() * .62,
        phase: Math.random() * Math.PI * 2,
        drift: (Math.random() - .5) * .14,
        warm: Math.random() > .9
      };
    }
    // 屏4 是暖色细闪：柔和暖金/珊瑚光点
    if (isP1) {
      return {
        x: Math.random() * width,
        y: fromTop ? -Math.random() * height * .25 : Math.random() * height,
        speed: reducedMotion ? .2 : .4 + Math.random() * .8,
        radius: .7 + Math.random() * 2.1,
        length: 5 + Math.random() * 18,
        alpha: .22 + Math.random() * .66,
        phase: Math.random() * Math.PI * 2,
        drift: (Math.random() - .5) * .16,
        warm: Math.random() > .7
      };
    }
    return {
      x: Math.random() * width,
      // 从上方缓缓撒落（屏2 要求星光从上方往下撒）
      y: fromTop ? -Math.random() * height * .25 : Math.random() * height,
      speed: reducedMotion ? .2 : .45 + Math.random() * .95,
      radius: .7 + Math.random() * 2.3,
      length: 6 + Math.random() * 26,
      alpha: .2 + Math.random() * .78,
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() - .5) * .18,
      warm: Math.random() > .78
    };
  }

  function rebuild() {
    sparks.length = 0;
    // 屏3 下雪密度更高，覆盖整个滚动浏览过程
    const amount = isDark
      ? (window.innerWidth < 700 ? 150 : 320)
      : (window.innerWidth < 700 ? 96 : 210);
    for (let index = 0; index < amount; index += 1) sparks.push(createSpark());
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    rebuild();
  }

  function draw(time) {
    context.clearRect(0, 0, width, height);
    // 仅当当前屏激活时绘制
    const on = document.body.classList.contains('stage-designer')
      || (isDark && document.body.classList.contains('stage-contents'))
      || (isP1 && document.body.classList.contains('stage-project1'));

    if (on) {
      sparks.forEach((spark) => {
        spark.y += spark.speed;
        spark.x += spark.drift;
        spark.phase += .035;

        if (spark.y > height + spark.length || spark.x < -10 || spark.x > width + 10) {
          Object.assign(spark, createSpark(true));
        }

        const twinkle = .46 + Math.sin(spark.phase + time * .0016) * .4;
        const alpha = Math.max(.06, spark.alpha * twinkle);
        // 屏4 用暖色细闪
        let color;
        if (isP1) color = spark.warm ? '241, 154, 136' : '200, 94, 115';
        else color = spark.warm ? '224, 199, 144' : (isDark ? '242, 246, 255' : '230, 226, 214');
        const gradient = context.createLinearGradient(spark.x, spark.y - spark.length, spark.x, spark.y + spark.length);
        gradient.addColorStop(0, `rgba(${color}, 0)`);
        gradient.addColorStop(.62, `rgba(${color}, ${alpha * .34})`);
        gradient.addColorStop(1, `rgba(${color}, ${alpha})`);

        context.beginPath();
        context.strokeStyle = gradient;
        context.lineWidth = Math.max(.7, spark.radius * .6);
        context.moveTo(spark.x, spark.y - spark.length);
        context.lineTo(spark.x, spark.y);
        context.stroke();

        context.beginPath();
        context.fillStyle = `rgba(${color}, ${alpha})`;
        context.shadowColor = `rgba(${color}, ${alpha * 1.1})`;
        context.shadowBlur = 10;
        context.arc(spark.x, spark.y, spark.radius, 0, Math.PI * 2);
        context.fill();
        // 光晕点，让细闪更有体积感
        context.beginPath();
        context.fillStyle = `rgba(${color}, ${alpha * .26})`;
        context.arc(spark.x, spark.y, spark.radius * 2.6, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
      });
    }

    raf = requestAnimationFrame(draw);
  }

  new ResizeObserver(resize).observe(canvas);
  resize();
  requestAnimationFrame(draw);
}

setupCursorTrail();
document.querySelectorAll('[data-spark-canvas], [data-p1-sparks]').forEach(setupSparkCanvas);

/* ============================================================
   屏4 · 灯灯星尘互动影像：从海报采样暖色粒子，
   鼠标靠近把粒子推开，离开后弹簧复原。原生 Canvas 2D。
   ============================================================ */
function setupP1Particles() {
  const stage = document.querySelector('#p1ParticleStage');
  const canvas = document.querySelector('#p1ParticleCanvas');
  if (!stage || !canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let particles = [];
  let W = 0, H = 0, dpr = 1;
  let raf = 0;
  let visible = false;
  const mouse = { x: -9999, y: -9999, active: false };
  const RADIUS = 110;   // 排斥半径
  const REPEL = 3.2;    // 排斥强度

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    const rect = stage.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedFromImage();
  }

  /* 从 poster 采样暖色粒子 */
  function seedFromImage() {
    const img = new Image();
    img.onload = () => {
      try {
        const sc = document.createElement('canvas');
        const sw = 360, sh = Math.round(360 * H / Math.max(W, 1));
        sc.width = sw; sc.height = sh;
        const c = sc.getContext('2d', { willReadFrequently: true });
        c.drawImage(img, 0, 0, sw, sh);
        const data = c.getImageData(0, 0, sw, sh).data;
        const candidates = [];
        for (let y = 1; y < sh - 1; y += 1) {
          for (let x = 1; x < sw - 1; x += 1) {
            const o = (y * sw + x) * 4;
            const r = data[o] / 255, g = data[o + 1] / 255, b = data[o + 2] / 255;
            const light = r * .299 + g * .587 + b * .114;
            const warm = Math.max(0, r - b) * .7;
            if (Math.random() < Math.max(0, light - .12) * .8 + warm * .3) {
              candidates.push({
                hx: x / sw * W,
                hy: y / sh * H,
                x: 0, y: 0,
                vx: 0, vy: 0,
                size: 0.8 + Math.random() * 1.8,
                color: `rgb(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)})`
              });
            }
          }
        }
        particles = candidates.sort(() => Math.random() - .5).slice(0, reduced ? 1800 : 3800);
        particles.forEach(p => { p.x = p.hx; p.y = p.hy; });
      } catch { seedProcedural(); }
    };
    img.onerror = seedProcedural;
    img.src = 'assets/project1-light-poster.jpg';
  }

  function seedProcedural() {
    particles = Array.from({ length: reduced ? 1500 : 3000 }, () => {
      const colors = ['#f7e8da', '#f2c4c4', '#e9a66f', '#fff7dc', '#dd7f91'];
      const hx = Math.random() * W, hy = Math.random() * H;
      return { hx, hy, x: hx, y: hy, vx: 0, vy: 0, size: .8 + Math.random() * 1.8, color: colors[Math.floor(Math.random() * colors.length)] };
    });
  }

  function frame() {
    raf = 0;
    if (!visible || document.hidden || !particles.length) return;
    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      // 弹簧回原位
      let fx = (p.hx - p.x) * .06;
      let fy = (p.hy - p.y) * .06;
      // 鼠标排斥
      if (mouse.active) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < RADIUS && dist > 0.01) {
          const force = (1 - dist / RADIUS) * REPEL;
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }
      }
      p.vx = (p.vx + fx) * .86;
      p.vy = (p.vy + fy) * .86;
      p.x += p.vx;
      p.y += p.vy;

      const speed = Math.hypot(p.vx, p.vy);
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = .55 + Math.min(.45, speed * .12);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    raf = requestAnimationFrame(frame);
  }

  function start() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); }

  stage.addEventListener('pointermove', (e) => {
    const rect = stage.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
    stage.classList.add('has-interacted');
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { mouse.active = false; mouse.x = -9999; mouse.y = -9999; });

  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible) start();
  }, { threshold: 0.08 }).observe(stage);

  new ResizeObserver(resize).observe(stage);
  resize();
}

setupP1Particles();

/* 允许通过锚点直接打开第一个项目的指定章节，便于分享与复查。 */
const projectHashes = ['#project1', '#chapter1', '#filmTitle', '#particleTitle', '#ipTitle', '#productTitle', '#chapter2', '#project2Frame', '#chapter3', '#project3Frame', '#chapter4', '#project4Frame', '#chapter5', '#project5Frame', '#chapter6', '#project6Frame', '#chapter7', '#project7Frame', '#chapter8', '#project8Frame', '#chapter9', '#project9Frame'];
if (projectHashes.includes(window.location.hash)) {
  stage = 3;
  setBodyStage(3);
  if (window.location.hash !== '#project1') {
    requestAnimationFrame(() => {
      const target = document.querySelector(window.location.hash);
      if (target) target.scrollIntoView({ block: 'start' });
    });
  }
}

/* 所有嵌入项目都由外层唯一的滚动轴控制，不再使用 iframe 局部滚动。 */
(function setupGlobalProjectScroll() {
  const scroller = document.querySelector('#stageProject1');
  const hosts = [...document.querySelectorAll('[data-project-host]')];
  if (!scroller || !hosts.length) return;

  let syncFrame = 0;
  const syncEmbeddedProjects = () => {
    syncFrame = 0;
    const viewport = scroller.clientHeight;
    hosts.forEach((host) => {
      const frame = host.querySelector('iframe');
      if (!frame?.contentWindow) return;
      const range = Math.max(0, host.offsetHeight - viewport);
      const localTop = Math.max(0, Math.min(range, scroller.scrollTop - host.offsetTop));
      frame.contentWindow.postMessage({ type: 'portfolio-global-scroll', scrollTop: localTop }, '*');
    });
  };

  const requestSync = () => {
    if (!syncFrame) syncFrame = requestAnimationFrame(syncEmbeddedProjects);
  };

  scroller.addEventListener('scroll', requestSync, { passive: true });
  window.addEventListener('resize', requestSync, { passive: true });

  window.addEventListener('message', (event) => {
    if (!event.data || typeof event.data !== 'object') return;
    const host = hosts.find((item) => item.querySelector('iframe')?.contentWindow === event.source);
    if (!host) return;

    if (event.data.type === 'project-scroll-metrics') {
      const height = Number(event.data.height);
      if (Number.isFinite(height) && height > 0) {
        host.style.height = `${Math.max(scroller.clientHeight, Math.ceil(height))}px`;
        requestSync();
      }
      return;
    }

    if (event.data.type === 'project-global-wheel') {
      const deltaY = Number(event.data.deltaY);
      if (Number.isFinite(deltaY) && document.body.classList.contains('stage-project1')) {
        scroller.scrollBy({ top: deltaY, left: 0, behavior: 'auto' });
      }
      return;
    }

    if (event.data.type === 'project-local-scroll-request') {
      const localTop = Number(event.data.localTop);
      if (Number.isFinite(localTop) && document.body.classList.contains('stage-project1')) {
        scroller.scrollTo({ top: host.offsetTop + Math.max(0, localTop), left: 0, behavior: 'smooth' });
      }
    }
  });

  requestSync();
})();

/* 右侧可拖动的全局滚动竖线，与作品集唯一滚动轴同步。 */
(function setupGlobalScrollbar() {
  const scroller = document.querySelector('#stageProject1');
  const bar = document.querySelector('#globalScrollbar');
  const track = document.querySelector('#globalScrollTrack');
  const thumb = document.querySelector('#globalScrollThumb');
  if (!scroller || !bar || !track || !thumb) return;

  let dragging = false;
  let grabOffset = 0;

  const metrics = () => {
    const trackHeight = track.clientHeight;
    const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const thumbHeight = Math.max(52, trackHeight * (scroller.clientHeight / Math.max(scroller.scrollHeight, 1)));
    const travel = Math.max(0, trackHeight - thumbHeight);
    return { trackHeight, maxScroll, thumbHeight, travel };
  };

  const render = () => {
    const { maxScroll, thumbHeight, travel } = metrics();
    const progress = maxScroll ? scroller.scrollTop / maxScroll : 0;
    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translateY(${travel * progress}px)`;
    thumb.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
  };

  const moveToPointer = (clientY) => {
    const rect = track.getBoundingClientRect();
    const { maxScroll, travel, thumbHeight } = metrics();
    const top = Math.max(0, Math.min(travel, clientY - rect.top - grabOffset));
    scroller.scrollTop = travel ? (top / travel) * maxScroll : 0;
    thumb.style.height = `${thumbHeight}px`;
  };

  thumb.addEventListener('pointerdown', (event) => {
    dragging = true;
    grabOffset = event.clientY - thumb.getBoundingClientRect().top;
    thumb.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  thumb.addEventListener('pointermove', (event) => {
    if (dragging) moveToPointer(event.clientY);
  });
  thumb.addEventListener('pointerup', (event) => {
    dragging = false;
    thumb.releasePointerCapture(event.pointerId);
  });
  thumb.addEventListener('pointercancel', () => { dragging = false; });
  track.addEventListener('pointerdown', (event) => {
    if (event.target === thumb) return;
    grabOffset = thumb.getBoundingClientRect().height / 2;
    moveToPointer(event.clientY);
  });
  thumb.addEventListener('keydown', (event) => {
    const steps = { ArrowUp: -80, ArrowDown: 80, PageUp: -scroller.clientHeight * .85, PageDown: scroller.clientHeight * .85 };
    if (event.key in steps) {
      event.preventDefault();
      scroller.scrollBy({ top: steps[event.key], behavior: 'auto' });
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      scroller.scrollTop = event.key === 'Home' ? 0 : scroller.scrollHeight;
    }
  });

  scroller.addEventListener('scroll', render, { passive: true });
  new ResizeObserver(render).observe(scroller);
  new MutationObserver(render).observe(scroller, { subtree: true, attributes: true, attributeFilter: ['style'] });
  render();
})();

/* ============================================================
   屏4 · 首屏交互：红发小女孩视频随鼠标左右 scrub（视线跟随），
   SVG 蝴蝶跟随鼠标移动。参考小女孩网页首屏。
   ============================================================ */
(function setupP1Hero() {
  const hero = document.querySelector('#p1Hero');
  const video = document.querySelector('#p1HeroVideo');
  const butterfly = document.querySelector('#p1HeroButterfly');
  if (!hero || !video) return;

  let ready = false;
  let currentTime = 0, targetTime = 0;
  // 鼠标左右位置映射到的视频时间范围（秒）
  const LOOK = { left: 0.4, center: 3.5, right: 6.7 };

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function smoothstep(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function mapPointerToTime(clientX) {
    const n = clientX / window.innerWidth;
    const eased = smoothstep(n);
    return LOOK.left + (LOOK.right - LOOK.left) * eased;
  }

  function initVideo() {
    if (!video.duration || !isFinite(video.duration)) return;
    currentTime = Math.min(LOOK.center, video.duration - 0.1);
    targetTime = currentTime;
    try { video.currentTime = currentTime; } catch (e) {}
    video.pause();
    ready = true;
  }
  if (video.readyState >= 1) initVideo();
  else video.addEventListener('loadedmetadata', initVideo, { once: true });

  // 蝴蝶缓动跟随
  let bx = window.innerWidth / 2, by = window.innerHeight / 2, btx = bx, bty = by, tilt = 0;

  function render() {
    const prevBx = bx;
    bx += (btx - bx) * .14;
    by += (bty - by) * .14;
    const vx = bx - prevBx;
    tilt += (clamp(vx * 1.6, -16, 16) - tilt) * .16;
    butterfly.style.transform = `translate(${bx}px, ${by}px) translate(-50%,-50%) rotate(${tilt}deg)`;

    if (ready) {
      const d = targetTime - currentTime;
      currentTime += d * .14;
      if (Math.abs(d) > 0.004 && video.readyState >= 2) {
        try { video.currentTime = currentTime; } catch (e) {}
      }
    }
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  window.addEventListener('pointermove', (e) => {
    if (!document.body.classList.contains('stage-project1')) return;
    hero.classList.add('is-interacting');
    btx = e.clientX; bty = e.clientY;
    // 鼠标相对屏4 滚动容器的位置 → 映射视频时间
    const rect = hero.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    targetTime = mapPointerToTime(relX / Math.max(rect.width, 1) * window.innerWidth);
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', () => {
    targetTime = LOOK.center;
    hero.classList.remove('is-interacting');
  });
})();
