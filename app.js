import { frames as framesAscii } from './frames.js';
import { frames as framesUnicode } from './frames_unicode.js';

const ascii = document.getElementById('ascii');
const selPalette = document.getElementById('palette');
const selStyle = document.getElementById('style');
const COLS  = 100;        // šírka obrázka v znakoch
const FPS   = 12;

/* ===== palety ===== */
const PALETTES = {
  atlas:  ['#FEAC5E','#C779D0','#4BC0C8','#FEAC5E'],
  cristal:['#069A8E','#A1E3D8','#069A8E'],
  fruit:  ['#FCCB90','#D57EEB'],
  instagram:['#feda75','#fa7e1e','#d62976','#962fbf','#4f5bd5','#feda75'],
  mind:   ['#166BD0','#2992E9','#60BAFF','#CDE9FF','#133D8E','#166BD0'],
  morning:['#3D5688','#5373A1','#9DA3B7','#CBB6B0','#F9D69E','#F6BD73','#3D5688'],
  passion:['#F68306','#FF4D22','#DD1E1E','#F14069','#CD307D','#8F27A7','#F68306'],
  pastel: ['#BFB2F3','#96CAF7','#9CDCAA','#E5E1AB','#F3C6A5','#F8A3A8','#BFB2F3'],
  rainbow:['#9C4F96','#FF6355','#FBA949','#FAE442','#8BD448','#2AA8F2','#9C4F96'],
  retro:  ['#2E1B86','#7723AC','#B053CB','#FFA84C','#FED338','#FEFD00','#2E1B86'],
  summer: ['#53C296','#99D973','#FAE50D','#F1BA05','#DD6000','#CA1F34','#53C296'],
  teen:   ['#E64298','#F171A1','#3154DF','#F8F9AD','#A888FF','#8746F1','#E64298'],
  vice:   ['#393659','#5F4672','#C1685B','#D19B73','#DECDA6','#393659']
};
/* ================== */

/* dropdown */
Object.keys(PALETTES).forEach(p=>{
  selPalette.insertAdjacentHTML('beforeend',`<option>${p}</option>`);
});

/* helpers */
const hex2rgb = h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const lerp=(a,b,t)=>a+(b-a)*t;

/* náhodný výber štýlu a palety pri načítaní */
const paletteNames = Object.keys(PALETTES);
const randomPalette = paletteNames[Math.floor(Math.random() * paletteNames.length)];
const useUnicode = Math.random() < 0.5; // 50% šanca pre každý štýl

selPalette.value = randomPalette;
selStyle.value = useUnicode ? 'unicode' : 'ascii';

/* aktívna paleta */
let frames = useUnicode ? framesUnicode : framesAscii;
let stops = PALETTES[selPalette.value];
let rgbStops = stops.map(hex2rgb);

// Event listenery pre zmenu štýlu a palety
selPalette.addEventListener('change',()=>{
  stops = PALETTES[selPalette.value];
  rgbStops = stops.map(hex2rgb);
});

selStyle.addEventListener('change',()=>{
  frames = selStyle.value === 'ascii' ? framesAscii : framesUnicode;
  // Resetovanie animácie pri zmene štýlu
  idx = 0;
  phase = 0;
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
  ascii.innerHTML = render(frames[idx],phase);
  idx   = (idx+1)%frames.length;
  phase = (phase+1)%COLS;
  setTimeout(loop,1000/FPS);
})();
