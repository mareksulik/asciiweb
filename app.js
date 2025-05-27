import { frames as framesAscii } from './frames.js';
import { frames as framesUnicode } from './frames_unicode.js';

const ascii = document.getElementById('ascii');
const selPalette = document.getElementById('palette');
const selStyle = document.getElementById('style');
const COLS  = 100;        // šírka obrázka v znakoch
const FPS   = 12;

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

// Funkcia na pregenenerovanie cache pri zmene palety s jemnejšími krokmi
function generateColorCache() {
  colorCache.clear();
  // Používame jemnejšie kroky pre plynulejšie prechody
  const steps = COLS * 2; // Dvojnásobne viac krokov pre plynulejšie prechody
  
  for (let phase = 0; phase < steps; phase++) {
    for (let x = 0; x < COLS; x++) {
      const pos = (x + phase * 0.5) % COLS; // Jemnejší posun
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
let frames = initialStyle === 'unicode' ? framesUnicode : framesAscii;
let stops = PALETTES[selPalette.value];
let rgbStops = stops.map(hex2rgb);

// Vygeneruj počiatočnú cache
generateColorCache();

// Event listenery pre zmenu štýlu a palety
selPalette.addEventListener('change',()=>{
  stops = PALETTES[selPalette.value];
  rgbStops = stops.map(hex2rgb);
  generateColorCache(); // Regeneruj cache pri zmene palety
});

selStyle.addEventListener('change',()=>{
  const selectedStyle = selStyle.value;
  
  // Zobrazenie/skrytie elementov podľa vybraného štýlu
  if (selectedStyle === 'original') {
    ascii.style.display = 'none';
    originalPhoto.style.display = 'block';
    selPalette.disabled = true;
  } else {
    ascii.style.display = 'block';
    originalPhoto.style.display = 'none';
    selPalette.disabled = false;
    
    // Nastavenie správnych rámcov pre ASCII alebo Unicode
    frames = selectedStyle === 'ascii' ? framesAscii : framesUnicode;
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

/* optimalizovaný render s DocumentFragment */
function render(frame, phase) {
  const lines = frame.split('\\n');
  const fragment = document.createDocumentFragment();
  let globalX = 0; // Globálna pozícia naprieč všetkými riadkami
  
  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      fragment.appendChild(document.createElement('br'));
    }
    
    for (let x = 0; x < line.length; x++) {
      const ch = line[x];
      const span = document.createElement('span');
      
      if (ch === ' ') {
        span.innerHTML = '&nbsp;';
      } else {
        span.textContent = ch;
      }
      
      // Použiť globálnu pozíciu pre farbu
      span.style.color = colorAt(globalX % COLS, phase);
      fragment.appendChild(span);
      globalX++;
    }
  });
  
  return fragment;
}

/* animácia s jemnejším phase krokom ale rovnakým FPS */
let idx = 0, phase = 0;
let lastTime = 0;
const frameInterval = 1000 / FPS;
const phaseStep = 0.5; // Jemnejší krok pre plynulejší gradient

function loop(currentTime) {
  if (currentTime - lastTime >= frameInterval) {
    if (selStyle.value !== 'original') {
      // Vyčisť obsah a pridaj nový fragment
      ascii.innerHTML = '';
      ascii.appendChild(render(frames[idx], phase));
      
      idx = (idx + 1) % frames.length;
      phase = (phase + phaseStep) % (COLS * 2); // Cyklus cez všetky cache kroky
    }
    lastTime = currentTime;
  }
  
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
