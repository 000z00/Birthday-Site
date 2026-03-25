/* ============================================================
   BIRTHDAY SITE — script.js
   "A Timeline of Surviving You"
   Handles:
     • Hero canvas gradient animation + particle generation
     • "Enter the Timeline" loader sequence
     • GSAP + ScrollTrigger scroll animations
     • Friendship stat counters
     • Envelope modal open/close
     • Confetti on finale section scroll
============================================================ */

'use strict';

/* ──────────────────────────────────────────────────────────
   1) HERO CANVAS — animated gradient blobs
────────────────────────────────────────────────────────── */
(function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, blobs;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  /* Three slowly-drifting radial gradient blobs */
  function createBlobs() {
    blobs = [
      { x: W * 0.2, y: H * 0.3, r: W * 0.35, vx: 0.22, vy: 0.18, hue: 210 }, // blue
      { x: W * 0.8, y: H * 0.6, r: W * 0.3, vx: -0.18, vy: 0.22, hue: 30 }, // orange
      { x: W * 0.5, y: H * 0.8, r: W * 0.25, vx: 0.12, vy: -0.2, hue: 270 }, // purple
    ];
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);

    /* Dark base */
    ctx.fillStyle = '#0f0f14';
    ctx.fillRect(0, 0, W, H);

    /* Draw each blob */
    blobs.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;

      /* Bounce off edges */
      if (b.x < -b.r || b.x > W + b.r) b.vx *= -1;
      if (b.y < -b.r || b.y > H + b.r) b.vy *= -1;

      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      grad.addColorStop(0, `hsla(${b.hue}, 80%, 55%, 0.12)`);
      grad.addColorStop(0.5, `hsla(${b.hue}, 70%, 45%, 0.05)`);
      grad.addColorStop(1, 'hsla(0, 0%, 0%, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(animate);
  }

  resize();
  createBlobs();

  /* FIX 5 — Pause animation loop when hero is off-screen to prevent memory leak */
  let animFrameId = null;
  let isAnimating = false;

  function startAnim() {
    if (isAnimating) return;
    isAnimating = true;
    (function loop() {
      if (!isAnimating) return;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0f0f14';
      ctx.fillRect(0, 0, W, H);
      blobs.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < -b.r || b.x > W + b.r) b.vx *= -1;
        if (b.y < -b.r || b.y > H + b.r) b.vy *= -1;
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        grad.addColorStop(0, `hsla(${b.hue}, 80%, 55%, 0.12)`);
        grad.addColorStop(0.5, `hsla(${b.hue}, 70%, 45%, 0.05)`);
        grad.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });
      animFrameId = requestAnimationFrame(loop);
    })();
  }

  function stopAnim() {
    isAnimating = false;
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
  }

  /* Use IntersectionObserver — start when visible, pause when scrolled away */
  const heroEl = document.getElementById('hero');
  if (heroEl && 'IntersectionObserver' in window) {
    const heroObs = new IntersectionObserver(
      ([entry]) => { entry.isIntersecting ? startAnim() : stopAnim(); },
      { threshold: 0 }
    );
    heroObs.observe(heroEl);
  } else {
    startAnim(); /* Fallback for browsers without IntersectionObserver */
  }

  window.addEventListener('resize', () => { resize(); createBlobs(); });
})();


/* ──────────────────────────────────────────────────────────
   2) HERO PARTICLES — floating dots
────────────────────────────────────────────────────────── */
(function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const COUNT = 30;
  const colors = ['#4da6ff', '#a8d8ff', '#c9a96e', '#ffffff'];

  for (let i = 0; i < COUNT; i++) {
    const dot = document.createElement('div');
    dot.classList.add('particle');

    const size = Math.random() * 4 + 1.5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const duration = (Math.random() * 8 + 6).toFixed(1);
    const delay = -(Math.random() * 8).toFixed(1);
    const tx = (Math.random() * 60 - 30).toFixed(0);
    const ty = (Math.random() * 80 - 40).toFixed(0);

    dot.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      left: ${Math.random() * 100}%;
      top:  ${Math.random() * 100}%;
      --duration: ${duration}s;
      --delay:    ${delay}s;
      --tx: ${tx}px;
      --ty: ${ty}px;
    `;

    container.appendChild(dot);
  }
})();


/* ──────────────────────────────────────────────────────────
   3) LOADER SEQUENCE
   Triggered by the "Enter the Timeline" button.
────────────────────────────────────────────────────────── */
const btn = document.getElementById('btn-enter');
const loaderSection = document.getElementById('loader');
const timelineSection = document.getElementById('timeline');

/* FIX 2 — Guard so the loader sequence only ever runs once */
let loaderStarted = false;

if (btn && loaderSection) {
  btn.addEventListener('click', () => {
    if (loaderStarted) return;  /* Ignore repeated clicks */
    loaderStarted = true;

    /* Scroll to loader */
    loaderSection.scrollIntoView({ behavior: 'smooth' });

    /* Delay running the sequence until loader is in view */
    setTimeout(runLoaderSequence, 600);
  });
}

function runLoaderSequence() {
  const years = document.querySelectorAll('.loader-year');
  const status1 = document.getElementById('loader-status-1');
  const status2 = document.getElementById('loader-status-2');

  let delay = 600;
  const step = 400;

  /* Reveal each year one by one — FIX 6: read from data-year (single source of truth) */
  years.forEach(y => {
    setTimeout(() => {
      /* Use data-year as the authoritative label */
      if (y.dataset.year) y.textContent = y.dataset.year;
      y.classList.add('visible');
    }, delay);
    delay += step;
  });

  /* "Friendship database found." */
  setTimeout(() => {
    if (status1) status1.classList.add('visible');
  }, delay + 400);

  /* "Opening timeline..." */
  setTimeout(() => {
    if (status2) status2.classList.add('visible');
  }, delay + 1000);

  /* Auto-scroll to timeline */
  setTimeout(() => {
    if (timelineSection) {
      timelineSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, delay + 1900);
}


/* ──────────────────────────────────────────────────────────
   4) GSAP SCROLL ANIMATIONS
   Uses GSAP + ScrollTrigger if available,
   falls back to IntersectionObserver.
────────────────────────────────────────────────────────── */
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  /* ─── Memory block text panels ─── */
  document.querySelectorAll('.memory-text-wrap').forEach(el => {
    gsap.from(el, {
      y: 30,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });
  });

  /* ─── Memory images — subtle parallax zoom ─── */
  document.querySelectorAll('.memory-image-wrap').forEach(el => {
    gsap.fromTo(el,
      { scale: 1.05 },
      {
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
      }
    );
  });

  /* ─── Stats section heading ─── */
  gsap.from('.stats-heading, .stats-sub', {
    opacity: 0,
    y: 30,
    stagger: 0.15,
    duration: 0.9,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.stats-section',
      start: 'top 70%',
    },
  });

  /* ─── Stat cards ─── */
  document.querySelectorAll('.stat-card').forEach((card, i) => {
    gsap.from(card, {
      opacity: 0,
      y: 40,
      duration: 0.7,
      delay: i * 0.12,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.stats-grid',
        start: 'top 72%',
      },
    });
  });

  /* ─── Transition section ─── */
  gsap.from('.transition-text', {
    opacity: 0,
    y: 40,
    duration: 1,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.transition-section',
      start: 'top 65%',
    },
  });

  /* ─── Letters heading ─── */
  gsap.from('.letters-heading, .letters-sub', {
    opacity: 0,
    y: 25,
    stagger: 0.12,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.letters-section',
      start: 'top 70%',
    },
  });

  /* ─── Envelope cards stagger ─── */
  gsap.from('.envelope-card', {
    opacity: 0,
    y: 35,
    scale: 0.97,
    stagger: 0.1,
    duration: 0.7,
    ease: 'back.out(1.4)',
    scrollTrigger: {
      trigger: '.letters-grid',
      start: 'top 72%',
    },
  });

  /* ─── Finale section ─── */
  gsap.from('.finale-badge', {
    opacity: 0,
    scale: 0.9,
    duration: 0.8,
    ease: 'back.out(1.5)',
    scrollTrigger: {
      trigger: '.finale-section',
      start: 'top 65%',
    },
  });

  gsap.from('.finale-title, .finale-message, .finale-signatures, .finale-video-placeholder', {
    opacity: 0,
    y: 30,
    stagger: 0.18,
    duration: 0.9,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.finale-section',
      start: 'top 60%',
      onEnter: () => launchConfetti(),
    },
  });

} else {
  /* ─── FALLBACK: IntersectionObserver ─── */
  const allFade = document.querySelectorAll(
    '.memory-text-wrap, .stat-card, .transition-text, .envelope-card, .fade-in-element'
  );

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible', 'in-view');
        }
      });
    },
    { threshold: 0.15 }
  );

  allFade.forEach(el => observer.observe(el));

  /* Confetti trigger via IO on finale */
  const finaleObs = new IntersectionObserver(
    entries => {
      if (entries[0].isIntersecting) launchConfetti();
    },
    { threshold: 0.3 }
  );

  const finale = document.getElementById('finale');
  if (finale) finaleObs.observe(finale);
}


/* ──────────────────────────────────────────────────────────
   5) STAT COUNTER ANIMATIONS
   Counts up from 0 → target when section is in view.
────────────────────────────────────────────────────────── */
function animateCounter(el) {
  if (el.dataset.animated) return;  // run only once
  el.dataset.animated = 'true';

  const target = parseInt(el.dataset.target, 10);
  const duration = 1800; // ms
  const start = performance.now();

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const value = Math.round(easeOutQuart(progress) * target);
    el.textContent = value.toLocaleString();
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

/* Observe stat numbers */
const statNumbers = document.querySelectorAll('.stat-number[data-target]');
const statsObs = new IntersectionObserver(
  entries => {
    entries.forEach(e => {
      if (e.isIntersecting) animateCounter(e.target);
    });
  },
  { threshold: 0.5 }
);
statNumbers.forEach(n => statsObs.observe(n));


/* ──────────────────────────────────────────────────────────
   6) "OPEN THE LETTERS" BUTTON
   Smooth scroll to letters section.
────────────────────────────────────────────────────────── */
const btnLetters = document.getElementById('btn-letters');
const lettersSection = document.getElementById('letters');

if (btnLetters && lettersSection) {
  btnLetters.addEventListener('click', () => {
    lettersSection.scrollIntoView({ behavior: 'smooth' });
  });
}


/* ──────────────────────────────────────────────────────
   7) LETTER DATA
   Single-narrator: one message per letter.
   Edit the text inside each letter here.
   Each entry: title, image, senderName, message
───────────────────────────────────────────────────── */
const letterData = [
  {
    num: '01',
    title: 'Remember This Day',
    image: 'images/letter1.jpg',
    senderName: 'Rishabh',        // ✏️ Replace with your name
    message: "Tanish the day you went up to the hill top with me that day; you,me and mahek. Bhai hilltop has never been that beautiful ever again",
  },
  {
    num: '02',
    title: 'The Good Moments',
    image: 'images/letter2.jpg',
    senderName: 'Rishabh',
    message: "Objectively, I don't even know what happened that day but damm boy you don't smile like that very often.",
  },
  {
    num: '03',
    title: 'One of Your Favorite Memories',
    image: 'images/letter3.jpg',
    senderName: 'Rishabh',
    message: "biradar how can we forget the trip with your sisters, bhai just imagine going with mine is making me shiver,... but I know one thing you fucking you enjoyed it.",
  },
  {
    num: '04',
    title: 'The Time You Helped Me',
    image: 'images/letter5.jpg',
    senderName: 'Rishabh',
    message: "Bhai jaan this things can't go without santosh in them, Never met the guy but know one thing, He was there for you when I couldn't be so that itself gives respect from my side.",
  },
  {
    num: '05',
    title: "Why I'm Still Your Friend",
    image: 'images/letter4.jpg',
    senderName: 'Rishabh',
    message: "And Here you are my boi(damm tu aacha dhik rha hai), Listen Thank you for trustng me enough about everything, I know tune abhi bhi muje bhohat kuch nhi bataya hai and waiting tu khud muje bata dega so aaram se take time I m here.",
  },
  {
    num: '06',
    title: 'Open on Your Birthday',
    image: 'images/WhatsApp Image 2026-03-25 at 12.31.47.jpeg',
    senderName: 'Rishabh',
    message: "Happy Birthday.\n\nYou've survived another full orbit around the sun — somehow. I'm genuinely proud of you, even when I don't say it.\n\nToday is yours. I hope it's full of the people and things that actually make you happy. You deserve that more than you think.\n\nLife would genuinely be boring without you.\n\n— Rishabh",
  },
];


/* ──────────────────────────────────────────────────────────
   8) ENVELOPE MODAL
────────────────────────────────────────────────────────── */
const overlay = document.getElementById('modal-overlay');
const modalBox = document.getElementById('modal-box');
const closeBtn = document.getElementById('modal-close');
const modalInner = document.getElementById('modal-inner');

/* Build modal HTML from letter data — single narrator */
function buildModalContent(index) {
  const letter = letterData[index - 1];
  if (!letter) return;

  /* Convert newlines in message to <br> tags for HTML display */
  const messageHtml = (letter.message || '').replace(/\n/g, '<br />');

  modalInner.innerHTML = `
    <div class="modal-header">
      <span class="modal-letter-num">Letter ${letter.num}</span>
      <h2 class="modal-title" id="modal-title-label">${letter.title}</h2>
    </div>

    <div class="modal-img-wrap">
      <img
        src="${letter.image}"
        alt="${letter.title}"
        class="modal-letter-img"
      />
      <div class="modal-img-placeholder">
        <span>📷</span>
        <p>${letter.image}</p>
      </div>
    </div>

    <div class="modal-messages">
      <div class="modal-message from-f1">
        <span class="modal-author f1">${letter.senderName || '[Your Name]'}</span>
        <p>${messageHtml}</p>
      </div>
    </div>
  `;

  /* Attach load/error listeners AFTER innerHTML is set — inline onload
     attributes inside innerHTML do not fire reliably in all browsers. */
  const modalImg = modalInner.querySelector('.modal-letter-img');
  const modalPlaceholder = modalInner.querySelector('.modal-img-placeholder');
  if (modalImg) {
    const showImg = () => {
      modalImg.classList.add('loaded');
      if (modalPlaceholder) modalPlaceholder.style.display = 'none';
    };
    const hideImg = () => {
      modalImg.style.display = 'none';
    };
    /* If already cached and complete, fire immediately */
    if (modalImg.complete && modalImg.naturalWidth > 0) {
      showImg();
    } else {
      modalImg.addEventListener('load', showImg);
      modalImg.addEventListener('error', hideImg);
    }
  }
}

/* Open modal */
function openModal(letterIndex) {
  buildModalContent(letterIndex);
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  /* Scroll modal to top */
  if (modalBox) modalBox.scrollTop = 0;
}

/* Close modal */
function closeModal() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

/* FIX 3 — Attach click AND keyboard events to envelope cards */
document.querySelectorAll('.envelope-card').forEach(card => {
  /* Click */
  card.addEventListener('click', () => {
    const letterNum = parseInt(card.dataset.letter, 10);
    openModal(letterNum);
  });

  /* Keyboard: Enter or Space activates the card (matches native button behaviour) */
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();  /* Stop Space from scrolling the page */
      const letterNum = parseInt(card.dataset.letter, 10);
      openModal(letterNum);
    }
  });
});

/* Close on X button */
if (closeBtn) closeBtn.addEventListener('click', closeModal);

/* Close on overlay click (outside modal box) */
if (overlay) {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });
}

/* Close on Escape key */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});


/* ──────────────────────────────────────────────────────────
   9) CONFETTI ANIMATION
   Canvas-based particle confetti on finale reveal.
────────────────────────────────────────────────────────── */
let confettiFired = false;

function launchConfetti() {
  if (confettiFired) return;
  confettiFired = true;

  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const COLORS = [
    '#4da6ff', '#ff944d', '#c9a96e', '#ffffff',
    '#ff6b6b', '#5efce8', '#a78bfa', '#fbbf24',
  ];

  const SHAPES = ['circle', 'square', 'triangle'];

  /* Create confetti pieces */
  const pieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    w: Math.random() * 10 + 5,
    h: Math.random() * 6 + 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    speed: Math.random() * 3 + 1.5,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.12,
    drift: (Math.random() - 0.5) * 1.5,
    opacity: Math.random() * 0.5 + 0.5,
    life: 1,
  }));

  let animId;

  function drawPiece(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.globalAlpha = p.opacity * p.life;
    ctx.fillStyle = p.color;

    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 'square') {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    } else {
      /* Triangle */
      ctx.beginPath();
      ctx.moveTo(0, -p.h);
      ctx.lineTo(p.w / 2, p.h / 2);
      ctx.lineTo(-p.w / 2, p.h / 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let allDone = true;

    pieces.forEach(p => {
      p.y += p.speed;
      p.x += p.drift;
      p.angle += p.spin;

      /* Fade out near bottom */
      if (p.y > canvas.height * 0.7) {
        p.life -= 0.015;
      }

      if (p.life > 0) {
        allDone = false;
        drawPiece(p);
      }
    });

    if (!allDone) {
      animId = requestAnimationFrame(tick);
    }
  }

  tick();

  /* Auto-stop after 6 seconds */
  setTimeout(() => cancelAnimationFrame(animId), 6000);
}


/* ──────────────────────────────────────────────────────────
   10) MEMORY IMAGE PARALLAX SCROLL (CSS img zoom)
   Applies to real images if loaded.
────────────────────────────────────────────────────────── */
document.querySelectorAll('.memory-img').forEach(img => {
  function onImageLoaded() {
    img.classList.add('loaded');
    img.style.display = 'block';
    /* Hide placeholder once image loads */
    const placeholder = img.nextElementSibling;
    if (placeholder && placeholder.classList.contains('memory-img-placeholder')) {
      placeholder.style.display = 'none';
    }
  }

  img.addEventListener('load', onImageLoaded);

  /* FIX 1 — Handle cached images: 'load' may never fire if the browser
     already has the image cached. Manually trigger if already complete. */
  if (img.complete && img.naturalWidth > 0) {
    onImageLoaded();
  }
});


/* ──────────────────────────────────────────────────────────
   11) SMOOTH SCROLL POLYFILL for anchor links (fallback)
────────────────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});


/* ──────────────────────────────────────────────────────────
   12) RESIZE HANDLER — confetti canvas resize
────────────────────────────────────────────────────────── */
window.addEventListener('resize', () => {
  const canvas = document.getElementById('confetti-canvas');
  if (canvas && confettiFired) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
});


/* ──────────────────────────────────────────────────────────
   13) INLINE VIDEO PLAYER 🎥
   Plays a continuous looping video playlist in Section 7.
────────────────────────────────────────────────────────── */
(function initInlineVideo() {

  /* ── 📋 VIDEO PLAYLIST — add/remove videos here ── */
  const videoPlaylist = [
    'videos/WhatsApp Video 2026-03-18 at 12.08.48.mp4',
    'videos/WhatsApp Video 2026-03-18 at 13.14.13.mp4',
    'videos/WhatsApp Video 2026-03-18 at 13.15.22.mp4',
    'videos/WhatsApp Video 2026-03-18 at 19.44.58.mp4',
    'videos/WhatsApp Video 2026-03-18 at 19.45.32.mp4',
    'videos/WhatsApp Video 2026-03-18 at 19.48.02.mp4',
  ];

  let currentIndex = 0;

  /* ── Element refs ── */
  const videoEl = document.getElementById('video-player');
  const prevBtn = document.getElementById('video-prev');
  const nextBtn = document.getElementById('video-next');
  const counterEl = document.getElementById('video-counter');

  if (!videoEl) return; // guard

  /* ── Load & play a video by index ── */
  function loadVideo(index) {
    currentIndex = ((index % videoPlaylist.length) + videoPlaylist.length) % videoPlaylist.length;
    videoEl.src = videoPlaylist[currentIndex];
    videoEl.load();
    videoEl.play().catch(() => {
      /* Autoplay blocked — video will wait for user interaction */
    });
    updateCounter();
  }

  /* ── Update the counter ── */
  function updateCounter() {
    if (counterEl) {
      counterEl.textContent = `${currentIndex + 1} / ${videoPlaylist.length}`;
    }
  }

  /* ── When current video ends → play next (loops infinitely) ── */
  videoEl.addEventListener('ended', () => {
    loadVideo(currentIndex + 1);
  });

  /* ── Start playing first video ── */
  loadVideo(0);

  /* ── Prev button ── */
  if (prevBtn) prevBtn.addEventListener('click', () => loadVideo(currentIndex - 1));

  /* ── Next button ── */
  if (nextBtn) nextBtn.addEventListener('click', () => loadVideo(currentIndex + 1));

})();
