// PARTICLES
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let W, H, pts = [];
function resize(){ W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
resize(); addEventListener('resize', resize);
const COLS = [[251,175,80],[200,120,240],[96,165,250],[248,113,113],[52,211,153]];
function Pt(){
  this.x=Math.random()*W; this.y=Math.random()*H;
  this.vx=(Math.random()-.5)*.22; this.vy=(Math.random()-.5)*.22;
  this.r=Math.random()*1.3+.3;
  this.c=COLS[Math.floor(Math.random()*COLS.length)];
  this.a=Math.random()*.28+.04;
}
Pt.prototype.step=function(){
  this.x+=this.vx; this.y+=this.vy;
  if(this.x<0)this.x=W; if(this.x>W)this.x=0;
  if(this.y<0)this.y=H; if(this.y>H)this.y=0;
};
for(let i=0;i<110;i++) pts.push(new Pt());
(function loop(){
  ctx.clearRect(0,0,W,H);
  pts.forEach(p=>{
    p.step();
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle=`rgba(${p.c[0]},${p.c[1]},${p.c[2]},${p.a})`;
    ctx.fill();
  });
  requestAnimationFrame(loop);
})();

// ── COLLAGE LIGHTBOX: DECLARE FIRST ────────────────────────────
let collageImages = [];
let currentImageIndex = 0;
let lbTouchStartX = 0;

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

function openLightbox(index) {
  if (!collageImages.length) return;
  currentImageIndex = index;
  updateLightboxImage();
  lightbox.classList.add('show');
  document.body.classList.add('lightbox-open');
}

function closeLightbox() {
  lightbox.classList.remove('show');
  document.body.classList.remove('lightbox-open');
}

function updateLightboxImage() {
  const img = collageImages[currentImageIndex];
  if (!img) return;
  lightboxImg.src = img.src;
  lightboxImg.alt = img.alt || `Photo ${currentImageIndex + 1}`;
}

function showNextImage() {
  if (!collageImages.length) return;
  currentImageIndex = (currentImageIndex + 1) % collageImages.length;
  updateLightboxImage();
}

function showPrevImage() {
  if (!collageImages.length) return;
  currentImageIndex = (currentImageIndex - 1 + collageImages.length) % collageImages.length;
  updateLightboxImage();
}

// ── SLIDES ─────────────────────────────────────────────────────
const slides = Array.from(document.querySelectorAll('#stage .slide'));
const TOTAL = slides.length;
let cur = 0, elapsed = 0, DURATION = 6500, raf = null;
const progWrap = document.getElementById('progress-wrap');
const counter = document.getElementById('counter');

// build progress bar segments
for(let i = 0; i < TOTAL; i++){
  const seg = document.createElement('div');
  seg.className = 'prog-seg';
  seg.id = 'seg'+i;
  const fill = document.createElement('div');
  fill.className = 'prog-fill';
  seg.appendChild(fill);
  progWrap.appendChild(seg);
}
function segs(){ return document.querySelectorAll('.prog-seg'); }

function goTo(n, skipReset){
  slides[cur].classList.remove('active');
  segs().forEach((s,i)=>{
    s.classList.remove('active');
    if(i < n){
      s.classList.add('done');
    } else {
      s.classList.remove('done');
      s.querySelector('.prog-fill').style.width='0%';
    }
  });
  cur = ((n % TOTAL) + TOTAL) % TOTAL;
  slides[cur].classList.add('active');
  counter.textContent = (cur+1)+' / '+TOTAL;
  const anim = slides[cur].querySelector('.card, .photo-frame');
  if(anim){
    anim.style.animation='none';
    void anim.offsetWidth;
    anim.style.animation='';
  }
  if(!skipReset) resetTimer();
}

function nextSlide(){
  if(cur === TOTAL-1){
    endSlides();
    return;
  }
  goTo(cur+1);
}

function prevSlide(){
  goTo(cur-1);
}

function resetTimer(){
  elapsed = 0;
  if(raf) cancelAnimationFrame(raf);
  const seg = segs()[cur];
  seg.classList.add('active');
  let last = performance.now();

  function tick(now){
    const dt = now-last;
    last=now;
    elapsed+=dt;
    seg.querySelector('.prog-fill').style.width = Math.min(elapsed/DURATION*100,100)+'%';
    if(elapsed >= DURATION){
      nextSlide();
      return;
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
}
resetTimer();

function endSlides(){
  if(raf) cancelAnimationFrame(raf);
  segs().forEach(s=>s.classList.add('done'));
  ['stage','arrows','nav','progress-wrap'].forEach(id=>{
    const el = document.getElementById(id);
    el.style.transition='opacity 1.2s ease';
    el.style.opacity='0';
  });
  document.getElementById('tap-prev').style.display='none';
  document.getElementById('tap-next').style.display='none';

  setTimeout(()=>{
    document.getElementById('scroll-page').classList.add('show');
    document.getElementById('stage').style.display='none';
    document.getElementById('arrows').style.display='none';
    setupCollage();
  }, 1200);
}

// keyboard for slides + lightbox
document.addEventListener('keydown', e=>{
  if (lightbox.classList.contains('show')) {
    if(e.key === 'Escape') closeLightbox();
    if(e.key === 'ArrowRight') showNextImage();
    if(e.key === 'ArrowLeft') showPrevImage();
    return;
  }

  if(e.key === 'ArrowRight' || e.key === ' ') nextSlide();
  if(e.key === 'ArrowLeft') prevSlide();
});

// swipe for slides
let tx = 0;
document.addEventListener('touchstart', e=>{
  tx = e.touches[0].clientX;
}, {passive:true});

document.addEventListener('touchend', e=>{
  if (lightbox.classList.contains('show')) return;
  const dx = e.changedTouches[0].clientX - tx;
  if(Math.abs(dx) > 38){
    dx < 0 ? nextSlide() : prevSlide();
  }
}, {passive:true});

// ── MUSIC ──────────────────────────────────────────────────────
const audio = document.getElementById('bgAudio');
audio.volume = 0.3;
let muted = true;

function toggleMusic(){
  muted = !muted;
  if(!muted){
    audio.play().catch(()=>{
      muted = true;
      renderMusicBtn();
    });
  } else {
    audio.pause();
  }
  renderMusicBtn();
}

let autoTried = false;
function tryPlay(){
  if(autoTried) return;
  autoTried = true;
  audio.play().then(()=>{
    muted=false;
    renderMusicBtn();
  }).catch(()=>{});
}
document.addEventListener('click', tryPlay, {once:true});
document.addEventListener('touchend', tryPlay, {once:true});

function renderMusicBtn(){
  const btn = document.getElementById('musicBtn');
  if(!muted){
    btn.classList.add('playing');
    btn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
  } else {
    btn.classList.remove('playing');
    btn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
  }
}

// ── COLLAGE SETUP ──────────────────────────────────────────────
function setupCollage(){
  const cells = document.querySelectorAll('.c-cell');
  collageImages = Array.from(document.querySelectorAll('.c-cell img'))
    .filter(img => img.getAttribute('src'));

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.classList.add('revealed');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  cells.forEach(c => io.observe(c));

  collageImages.forEach((img, index) => {
    img.addEventListener('click', () => openLightbox(index));
  });
}

// ── LIGHTBOX EVENTS ────────────────────────────────────────────
lightboxClose.addEventListener('click', closeLightbox);
lightboxNext.addEventListener('click', showNextImage);
lightboxPrev.addEventListener('click', showPrevImage);

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

lightbox.addEventListener('touchstart', (e) => {
  lbTouchStartX = e.touches[0].clientX;
}, { passive: true });

lightbox.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - lbTouchStartX;
  if (Math.abs(dx) > 40) {
    if (dx < 0) showNextImage();
    else showPrevImage();
  }
}, { passive: true });

// ── SCROLL REVEALS ─────────────────────────────────────────────
const revIO = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      if(e.target.classList.contains('letter')){
        e.target.querySelectorAll('p').forEach((p,i)=>
          setTimeout(()=>p.classList.add('visible'), i*120)
        );
      } else {
        e.target.classList.add('visible');
      }
    }
  });
},{threshold:0.1});

function animateCounter() {
    const counterEl = document.getElementById('distance-counter');
    if (!counterEl) return;

    const target = 6800;
    const duration = 3500;
    const startTime = performance.now();

    function updateCount(now) {
        const elapsed = now - startTime;
        let progress = Math.min(elapsed / duration, 1);
        
        progress = 1 - Math.pow(1 - progress, 3);

        const current = Math.floor(progress * target);
        counterEl.textContent = current.toLocaleString() + '+';

        if (progress < 1) {
            requestAnimationFrame(updateCount);
        } else {
            counterEl.textContent = '6,800+';
        }
    }

    requestAnimationFrame(updateCount);
}

const distanceSlide = document.getElementById('s1');
if (distanceSlide) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(animateCounter, 400);
                observer.disconnect();
            }
        });
    }, { threshold: 0.6 });

    observer.observe(distanceSlide);
}

const letter = document.querySelector('.letter');
const ft = document.getElementById('finalTitle');
const fn = document.getElementById('finalNote');
const fn2 = document.getElementById('finalNote2');

if(letter) revIO.observe(letter);
if(ft) revIO.observe(ft);
if(fn) revIO.observe(fn);
if(fn2) revIO.observe(fn2);

// ─── MOBILE HOLD TO PAUSE (CENTER ONLY) ─────────────────────────────────────────────

let isHolding = false;

const stage = document.getElementById('stage');

stage.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;

    const touchX = e.touches[0].clientX;
    const screenCenter = window.innerWidth / 2;
    const centerZone = window.innerWidth * 0.35;

    if (Math.abs(touchX - screenCenter) < centerZone) {
        isHolding = true;

        const currentSlide = slides[cur];
        if (currentSlide) {
            currentSlide.style.transition = 'transform 0.25s ease';
            currentSlide.style.transform = 'scale(0.97)';
        }

        if (raf) {
            cancelAnimationFrame(raf);
            raf = null;
        }
    }
}, { passive: true });

stage.addEventListener('touchend', () => {
    if (!isHolding) return;

    isHolding = false;

    const currentSlide = slides[cur];
    if (currentSlide) {
        currentSlide.style.transform = 'scale(1)';
    }

    resetTimer();
}, { passive: true });

stage.addEventListener('touchcancel', () => {
    if (isHolding) {
        isHolding = false;
        const currentSlide = slides[cur];
        if (currentSlide) currentSlide.style.transform = 'scale(1)';
        resetTimer();
    }
}, { passive: true });