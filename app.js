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

// Získanie referencie na obrázok
const originalPhoto = document.getElementById('original-photo');

/* náhodný výber štýlu a palety pri načítaní */
const paletteNames = Object.keys(PALETTES);
const randomPalette = paletteNames[Math.floor(Math.random() * paletteNames.length)];
// Náhodný výber medzi ASCII, Unicode a Original (rovnaká šanca pre všetky tri)
const randomStyle = Math.random();
let initialStyle;

if (randomStyle < 0.33) {
  initialStyle = 'ascii';
} else if (randomStyle < 0.66) {
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

// Event listenery pre zmenu štýlu a palety
selPalette.addEventListener('change',()=>{
  stops = PALETTES[selPalette.value];
  rgbStops = stops.map(hex2rgb);
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

/* farba podľa stĺpca+fázy */
const colorAt=(x,phase)=>{
  const pos=(x+phase)%COLS, f=pos/(COLS-1);
  const segCnt=rgbStops.length-1, s=f*segCnt, i=Math.floor(s), t=s-i;
  const c0=rgbStops[i], c1=rgbStops[(i+1)%rgbStops.length];
  const rgb=c0.map((v,k)=>Math.round(lerp(v,c1[k],t)));
  return`rgb(${rgb})`;
};

/* render jediného frame-u */
function render(frame,phase){
  return frame.split('\\n').map(line=>{
    let row='';
    for(let x=0;x<line.length;x++){
      const ch=line[x]===' '?'&nbsp;':line[x];
      row += `<span style="color:${colorAt(x,phase)}">${ch}</span>`;
    }
    return row;
  }).join('<br>');
}

/* animácia */
let idx=0,phase=0;
(function loop(){
  // Generuj animáciu len ak nie je vybraný originálny obrázok
  if (selStyle.value !== 'original') {
    ascii.innerHTML = render(frames[idx],phase);
    idx = (idx+1)%frames.length;
    phase = (phase+1)%COLS;
  }
  setTimeout(loop,1000/FPS);
})();
