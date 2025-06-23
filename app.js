zmen// Lazy loading pre lepší výkon
let framesAscii = [];
let framesUnicode = [];

// Asynchrónne načítanie rámcov
async function loadFrames() {
  const [asciiModule, unicodeModule] = await Promise.all([
    import('./frames.js'),
    import('./frames_unicode.js')
  ]);
  
  framesAscii = asciiModule.frames;
  framesUnicode = unicodeModule.frames;
  
  // Po načítaní rámcov inicializuj animáciu
  initializeAnimation();
}

const ascii = document.getElementById('ascii');
const canvas = document.getElementById('ascii-canvas');
const ctx = canvas.getContext('2d');
const selPalette = document.getElementById('palette');
const selStyle = document.getElementById('style');
const COLS  = 100;        // šírka obrázka v znakoch

// Jednotné FPS pre všetky prehliadače
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const FPS = 15;  // Vyššie FPS

/* ===== palety ===== */
const PALETTES = {
  "Orange Blue":     ['#FEAC5E','#C779D0','#4BC0C8','#FEAC5E'],
  "Pink Yellow":     ['#FCCB90','#D57EEB'],
  "Morning Fog":     ['#3D5688','#5373A1','#9DA3B7','#CBB6B0','#F9D69E','#F6BD73','#3D5688'],
  "Aurora":          ['#BF616A','#D08770','#EBCB8B','#A3BE8C','#B48EAD','#BF616A'],
  "Frost":           ['#8FBCBB','#88C0D0','#81A1C1','#5E81AC','#8FBCBB'],
  "Pastel":          ['#BFB2F3','#96CAF7','#9CDCAA','#E5E1AB','#F3C6A5','#F8A3A8','#BFB2F3'],
  "Rainbow":         ['#9C4F96','#FF6355','#FBA949','#FAE442','#8BD448','#2AA8F2','#9C4F96'],
  "Retro Waves":     ['#2E1B86','#7723AC','#B053CB','#FFA84C','#FED338','#FEFD00','#2E1B86'],
  "Summer Garden":   ['#53C296','#99D973','#FAE50D','#F1BA05','#DD6000','#CA1F34','#53C296'],
  "Neon Night":      ['#E64298','#F171A1','#3154DF','#F8F9AD','#A888FF','#8746F1','#E64298'],
  "Dark Elegance":   ['#393659','#5F4672','#C1685B','#D19B73','#DECDA6','#393659']
};
/* ================== */

/* dropdown */
Object.keys(PALETTES).forEach(p=>{
  selPalette.insertAdjacentHTML('beforeend',`<option>${p}</option>`);
});

/* helpers */
const hex2rgb = h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const lerp=(a,b,t)=>a+(b-a)*t;

// Cache pre farby - predpočítame všetky možné farby
let colorCache = new Map();

// Optimalizovaný cache s predpočítanými CSS stringmi
function generateColorCache() {
  colorCache.clear();
  const steps = COLS; // Zmenšené kroky pre lepší výkon
  
  for (let phase = 0; phase < steps; phase++) {
    for (let x = 0; x < COLS; x++) {
      const pos = (x + phase * 0.8) % COLS;
      const f = pos / (COLS - 1);
      const segCnt = rgbStops.length - 1;
      const s = f * segCnt;
      const i = Math.floor(s);
      const t = s - i;
      const c0 = rgbStops[i];
      const c1 = rgbStops[(i + 1) % rgbStops.length];
      const rgb = c0.map((v, k) => Math.round(lerp(v, c1[k], t)));
      colorCache.set(`${x}-${phase}`, `rgb(${rgb.join(',')})`);
    }
  }
}

// Získanie referencie na obrázok
const originalPhoto = document.getElementById('original-photo');

/* náhodný výber štýlu a palety pri načítaní */
const paletteNames = Object.keys(PALETTES);
const randomPalette = paletteNames[Math.floor(Math.random() * paletteNames.length)];
// Náhodný výber medzi ASCII, Unicode a Original (rovnaká šanca pre všetky tri)
const randomStyle = Math.random();
let initialStyle;

if (randomStyle < 0.4) {
  initialStyle = 'ascii';
} else if (randomStyle < 0.8) {
  initialStyle = 'unicode';
} else {
  initialStyle = 'original';
}

selPalette.value = randomPalette;
selStyle.value = initialStyle;

// Ak je vybraný originálny obrázok, deaktivuj výber palety
if (initialStyle === 'original') {
  selPalette.disabled = true;
  ascii.style.display = 'none';
  originalPhoto.style.display = 'block';
}

/* aktívna paleta */
let frames = [];
let stops = PALETTES[selPalette.value];
let rgbStops = stops.map(hex2rgb);

function initializeAnimation() {
  frames = initialStyle === 'unicode' ? framesUnicode : framesAscii;
  
  // Vygeneruj počiatočnú cache
  generateColorCache();
  
  // Inicializuj virtuálny DOM
  initializeVirtualDOM();
  
  // Používaj iba DOM rendering pre všetky prehliadače
  ascii.style.display = 'block';
  canvas.style.display = 'none';
  
  // Spusti animáciu
  requestAnimationFrame(loop);
}

// Event listenery pre zmenu štýlu a palety
// Optimalizovaná zmena palety s debounce
let paletteChangeTimeout;
selPalette.addEventListener('change',()=>{
  clearTimeout(paletteChangeTimeout);
  paletteChangeTimeout = setTimeout(() => {
    stops = PALETTES[selPalette.value];
    rgbStops = stops.map(hex2rgb);
    generateColorCache();
  }, 50); // 50ms debounce pre plynulejšiu zmenu
});

selStyle.addEventListener('change',()=>{
  const selectedStyle = selStyle.value;
  
  // Zobrazenie/skrytie elementov podľa vybraného štýlu
  if (selectedStyle === 'original') {
    ascii.style.display = 'none';
    canvas.style.display = 'none';
    originalPhoto.style.display = 'block';
    selPalette.disabled = true;
  } else {
    originalPhoto.style.display = 'none';
    selPalette.disabled = false;
    
    ascii.style.display = 'block';
    canvas.style.display = 'none';
    
    // Nastavenie správnych rámcov pre ASCII alebo Unicode
    frames = selectedStyle === 'ascii' ? framesAscii : framesUnicode;
    
    // Re-inicializuj virtuálny DOM pre nový štýl
    isInitialized = false;
    initializeVirtualDOM();
    
    // Resetovanie animácie pri zmene štýlu
    idx = 0;
    phase = 0;
  }
});

/* optimalizovaná farba podľa cache s interpoláciou */
const colorAt = (x, phase) => {
  const cacheKey = `${x}-${Math.floor(phase)}`;
  return colorCache.get(cacheKey) || colorCache.get(`${x}-0`);
};

// Canvas rendering pre Safari
let canvasInitialized = false;

function initCanvas() {
  if (!canvasInitialized && isSafari && frames.length > 0) {
    console.log('Initializing canvas for Safari');
    
    // Problém: \\n v stringoch nie sú skutočné newlines!
    const testFrame = frames[0].replace(/\\n/g, '\n');
    const lines = testFrame.split('\n');
    const lineCount = lines.length;
    const maxLineLength = Math.max(...lines.map(line => line.length));
    
    console.log(`Lines count: ${lineCount}, max length: ${maxLineLength}`);
    console.log('First few lines:', lines.slice(0, 3));
    
    const charWidth = 6.6;
    const lineHeight = 12;
    
    canvas.width = Math.max(maxLineLength * charWidth, 600);
    canvas.height = Math.max(lineCount * lineHeight, 400);
    
    canvas.style.margin = '32px';
    canvas.style.maxWidth = '700px';
    canvas.style.border = '1px solid red'; // Debug border
    
    ctx.font = '11px JetBrains Mono, Fira Code, monospace';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000000';
    
    console.log(`Canvas initialized: ${canvas.width}x${canvas.height}`);
    canvasInitialized = true;
  }
}

// Moderný rendering prístup s virtuálnym DOM
let virtualElements = [];
let isInitialized = false;

function initializeVirtualDOM() {
  if (!isInitialized && frames.length > 0) {
    const lines = frames[0].split('\\n');
    let totalChars = 0;
    
    lines.forEach(line => totalChars += line.length);
    
    // Predkompiluj DOM elementy
    virtualElements = [];
    for (let i = 0; i < totalChars; i++) {
      const span = document.createElement('span');
      virtualElements.push(span);
    }
    
    isInitialized = true;
  }
}

function render(frameIdx, phase) {
  if (!isInitialized) {
    initializeVirtualDOM();
    return;
  }
  
  const lines = frames[frameIdx].split('\\n');
  let spanIndex = 0;
  let globalX = 0;
  
  // Vyčisti a priprav fragment
  const fragment = document.createDocumentFragment();
  
  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      fragment.appendChild(document.createElement('br'));
    }
    
    for (let x = 0; x < line.length; x++) {
      const ch = line[x];
      const span = virtualElements[spanIndex] || document.createElement('span');
      
      // Optimalizované nastavenie obsahu
      if (ch === ' ') {
        span.textContent = '\u00A0'; // &nbsp; ako unicode
      } else {
        span.textContent = ch;
      }
      
      // Optimalizované nastavenie farby
      span.style.color = colorAt(globalX % COLS, Math.floor(phase));
      
      fragment.appendChild(span);
      spanIndex++;
      globalX++;
    }
  });
  
  // Jeden atomic DOM update
  ascii.innerHTML = '';
  ascii.appendChild(fragment);
}

function renderCanvas(frameIdx, phase) {
  if (!canvasInitialized || !frames.length) {
    if (frames.length > 0) {
      initCanvas();
    }
    return;
  }
  
  // Fix: nahraď \\n skutočnými newlines
  const frame = frames[frameIdx].replace(/\\n/g, '\n');
  const lines = frame.split('\n');
  const lineHeight = 12;
  const charWidth = 6.6;
  
  // Vyčisti canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  let globalX = 0;
  
  lines.forEach((line, lineIndex) => {
    const y = lineIndex * lineHeight;
    
    for (let x = 0; x < line.length; x++) {
      const ch = line[x];
      if (ch !== ' ') {
        const color = colorAt(globalX % COLS, Math.floor(phase));
        ctx.fillStyle = color;
        ctx.fillText(ch, x * charWidth, y);
      }
      globalX++;
    }
  });
}


/* vysokovýkonná animácia pre všetky prehliadače */
let idx = 0, phase = 0;
let lastTime = 0;
const frameInterval = 1000 / FPS;
const phaseStep = 0.3; // Obnovené farebné prechody

function loop(currentTime) {
  if (currentTime - lastTime >= frameInterval) {
    if (selStyle.value !== 'original' && frames.length > 0) {
      render(idx, phase);
      
      idx = (idx + 1) % frames.length;
      phase = (phase + phaseStep) % COLS;
    }
    lastTime = currentTime;
  }
  
  requestAnimationFrame(loop);
}

// Spusti načítanie rámcov
loadFrames();
