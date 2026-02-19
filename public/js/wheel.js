// ========================
// PRIZE WHEEL v5 — HỒN VIỆT (TRỐNG ĐỒNG ĐÔNG SƠN)
// ========================
const prizes = [
  { name: '100 Lương Thảo', weight: 30, color: '#5D4037' },
  { name: '200 Lương Thảo', weight: 20, color: '#4E342E' },
  { name: '300 Lương Thảo', weight: 20, color: '#3E2723' },
  { name: '400 Lương Thảo', weight: 10, color: '#4E342E' },
  { name: '500 Lương Thảo', weight: 10, color: '#3E2723' },
  { name: '1 Lượt Chiêu Mộ', weight: 10, color: '#263238' }
];

// Palette Đông Sơn (Bronze, Gold, Red Earth)
const PALETTE = {
  bronzeDeep: '#261C14',
  bronzeMid:  '#5D4037',
  gold:       '#FFC107',
  goldLight:  '#FFF9C4',
  red:        '#B71C1C',
  bg:         '#121212'
};

const totalWeight = prizes.reduce((s,p)=>s+p.weight, 0);
let segments = [];
let cur = 0;
const ARC = 360 / prizes.length; // degrees per segment (visual only - all equal)

prizes.forEach(p => {
  segments.push({ 
    ...p, 
    startAngle: cur, 
    endAngle: cur + ARC, 
    sweepAngle: ARC
  });
  cur += ARC;
});

// Init rotation: offset by half a segment so segment 0 is CENTERED at the top pointer.
// Pointer is at visual top (270 deg). Segment mid lands at top when:
//   midSeg - 90 + rot = 270  →  rot = 360 - midSeg
// mid of segment 0 = ARC/2, so initialRot = 360 - ARC/2
let wheelRot = (360 - ARC / 2 + 360) % 360;
let isSpinning = false;
let wCanvas, wCtx;

function initWheel() {
  wCanvas = document.getElementById('wheelCanvas');
  if (!wCanvas) return;
  wCtx = wCanvas.getContext('2d');

  const dpr = window.devicePixelRatio || 1;
  const rect = wCanvas.getBoundingClientRect();
  wCanvas.width  = rect.width * dpr;
  wCanvas.height = rect.height * dpr;
  wCtx.scale(dpr, dpr);

  drawWheel(wheelRot);
}

function drawPattern(ctx, cx, cy, radius, count) {
   for(let i=0; i<count; i++) {
     ctx.save();
     ctx.translate(cx, cy);
     ctx.rotate((i * 360/count * Math.PI)/180);
     ctx.beginPath();
     ctx.arc(0, -radius, 2, 0, Math.PI*2);
     ctx.fillStyle = 'rgba(255,193,7,0.4)';
     ctx.fill();
     ctx.restore();
   }
}

function drawWheel(rotation) {
  if(!wCanvas || !wCtx) return;
  const ctx = wCtx;
  const W = wCanvas.width / (window.devicePixelRatio||1);
  const H = wCanvas.height / (window.devicePixelRatio||1);
  const cx = W / 2, cy = H / 2;
  const R = Math.min(cx, cy) - 15;

  ctx.clearRect(0, 0, W, H);
  
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotation * Math.PI) / 180);

  // 1. Outer Rim (Vòng ngoài cùng - Hoa văn kỉ hà)
  const rimGrad = ctx.createRadialGradient(0,0, R-25, 0,0, R);
  rimGrad.addColorStop(0, PALETTE.bronzeDeep);
  rimGrad.addColorStop(0.5, '#795548');
  rimGrad.addColorStop(1, PALETTE.bronzeDeep);
  
  ctx.beginPath(); ctx.arc(0,0, R, 0, Math.PI*2);
  ctx.fillStyle = rimGrad; ctx.fill();
  
  // Draw patterns 
  drawPattern(ctx, 0, 0, R-10, 48);

  // 2. Main Segments
  const R_inner = R - 25;
  segments.forEach((seg, idx) => {
    const sRad = (seg.startAngle - 90) * Math.PI / 180;
    const eRad = (seg.endAngle   - 90) * Math.PI / 180;
    
    // Wedge
    ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0, R_inner, sRad, eRad); ctx.closePath();
    
    // Gradient for metallic look
    const g = ctx.createRadialGradient(0,0,0, 0,0, R_inner);
    if(seg.color === '#BF360C') {
       g.addColorStop(0, '#D84315'); g.addColorStop(1, '#8D1515');
    } else {
       // Alternating colors for non-special segments
       // For odd number of segments, we need a 3rd variation or accept overlap
       // Let's use 3 tones for odd count: Deep, Mid, Light
       const tone = idx % 3;
       if(tone === 0) { g.addColorStop(0, '#5D4037'); g.addColorStop(1, '#3E2723'); }
       else if(tone === 1) { g.addColorStop(0, '#795548'); g.addColorStop(1, '#4E342E'); }
       else { g.addColorStop(0, '#8D6E63'); g.addColorStop(1, '#5D4037'); }
    }
    
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = '#D7CCC8'; ctx.lineWidth = 1; ctx.stroke();

    // Text placement
    ctx.save();
    const mid = (sRad + eRad) / 2;
    ctx.rotate(mid);
    ctx.textAlign = 'center';
    
    // Text
    ctx.font = 'bold 15px "Be Vietnam Pro", sans-serif';
    ctx.fillStyle = PALETTE.gold;
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
    
    // Place text centered in the available space
    // Move text slightly further out to use the space left by icons
    const dist = R_inner * 0.68;
    ctx.fillText(seg.name, dist, 5);
    
    ctx.restore();
  });

  // 3. Center Star (Ngôi sao 12 cánh giữa trống đồng)
  const rStar = R * 0.28;
  ctx.beginPath(); ctx.arc(0,0, rStar, 0, Math.PI*2);
  const centerFill = ctx.createRadialGradient(0,0,0, 0,0,rStar);
  centerFill.addColorStop(0, PALETTE.gold);
  centerFill.addColorStop(1, PALETTE.bronzeMid);
  ctx.fillStyle = centerFill; ctx.fill();
  
  // Star/Sun shape
  ctx.fillStyle = PALETTE.bronzeDeep;
  ctx.beginPath();
  const starPoints = 12; // 12 cánh mặt trời
  const innerR = rStar * 0.3;
  const outerR = rStar * 0.8;
  for(let i=0; i<starPoints*2; i++) {
     const rad = (i * Math.PI) / starPoints; // 12 points -> 24 steps
     // Actually use rotate context for simpler drawing
     const r = (i%2===0) ? outerR : innerR;
     ctx.lineTo(Math.cos(rad)*r, Math.sin(rad)*r);
  }
  ctx.closePath();
  ctx.fill();
  
  ctx.restore(); // End rotation
  
  // 4. Pointer (Kim chỉ - Mũi tên Lạc Việt) static at top
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.moveTo(0, -R + 5);
  ctx.lineTo(-12, -R - 20);
  ctx.lineTo(12, -R - 20);
  ctx.closePath();
  ctx.fillStyle = PALETTE.red;
  ctx.shadowColor = 'black'; ctx.shadowBlur = 6;
  ctx.fill();
  ctx.restore();
}

function spinWheel() {
  if (isSpinning) return;
  isSpinning = true;

  const btn = document.getElementById('spinBtn');
  if(btn) btn.disabled = true;

  // Pick winner using weighted probability (does NOT affect visual slice size)
  const selected = getWeightedRandom();

  // === SPIN MATH ===
  // Each segment mid is at: selected.startAngle + ARC/2
  // A segment center is at the top pointer when:
  //   midSeg - 90 + rot ≡ 270  (mod 360)
  //   rot ≡ (360 - midSeg)     (mod 360)
  const midSeg = selected.startAngle + ARC / 2;
  const targetMod = (360 - midSeg + 360) % 360;

  // How many degrees to add to current wheelRot to reach targetMod
  const curMod = ((wheelRot % 360) + 360) % 360;
  let extra = (targetMod - curMod + 360) % 360;
  if (extra < 60) extra += 360; // guarantee at least 60° of final movement

  const spins = 5 + Math.floor(Math.random() * 3); // 5-7 full rotations
  const totalRot = spins * 360 + extra;

  const startRot = wheelRot;
  const dur = 5000 + Math.random() * 1500;
  const t0 = performance.now();

  function frame(now) {
    const p = Math.min((now - t0) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 4); // easeOutQuart
    const rot = startRot + totalRot * ease;
    drawWheel(((rot % 360) + 360) % 360);

    if (p < 1) {
      requestAnimationFrame(frame);
    } else {
      // Store exact final position so next spin starts cleanly
      wheelRot = ((rot % 360) + 360) % 360;
      isSpinning = false;
      showPrize(selected);
    }
  }

  requestAnimationFrame(frame);
}

function getWeightedRandom() {
  const r = Math.random() * totalWeight;
  let cum = 0;
  for (const s of segments) { cum += s.weight; if (r <= cum) return s; }
  return segments[segments.length-1];
}

function showPrize(p) {
  const popup = document.getElementById('prizePopup');
  const nameEl = document.getElementById('prizeName');
  const descEl = document.getElementById('prizeDesc');
  
  if(nameEl) nameEl.textContent = p.name;
  if(descEl) descEl.textContent = 'Hãy ghi nhận phần thưởng và quay lại bàn cờ!';
  
  if(popup) popup.classList.add('show');
  createConfetti();
}

function createConfetti() {
   const colors = ['#FFD700', '#B71C1C', '#FFF9C4'];
   for(let i=0; i<60; i++) {
     const c = document.createElement('div');
     c.className = 'confetti'; // Needs css
     c.style.position = 'fixed';
     c.style.left = Math.random()*100 + 'vw';
     c.style.top = '-20px';
     c.style.width = (Math.random()*8+4)+'px';
     c.style.height = c.style.width;
     c.style.background = colors[Math.floor(Math.random()*colors.length)];
     c.style.transition = `top ${2+Math.random()*3}s ease-in, transform 3s linear`;
     c.style.zIndex = 10000;
     c.style.borderRadius = '50%';
     document.body.appendChild(c);
     
     // Animate
     setTimeout(() => {
        c.style.top = '110vh';
        c.style.transform = `rotate(${Math.random()*360}deg)`;
     }, 50);
     setTimeout(() => c.remove(), 5000);
   }
}

// Global hook
window.initWheel = initWheel;
window.spinWheel = spinWheel;
window.addEventListener('resize', initWheel);
