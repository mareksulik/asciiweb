import { frames } from './frames.js';

const pre  = document.getElementById('ascii');
const cols = 100;
const FPS  = 12;

// Atlas palette closed loop
const stops = ['#FEAC5E', '#C779D0', '#4BC0C8', '#FEAC5E'];

// --- helpers ---
function hexToRgb(hex) {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  return m ? [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)] : [0,0,0];
}
const rgbStops = stops.map(hexToRgb);

const lerp = (a,b,t)=> a + (b-a)*t;

function colorAt(x, phase){
  const pos  = (x + phase) % cols;
  const frac = pos / (cols - 1);

  const segCount = rgbStops.length - 1;        // 3
  const f   = frac * segCount;                 // 0..3
  const seg = Math.floor(f) % rgbStops.length; // safe wrap
  const t   = f - Math.floor(f);               // 0..1 within segment

  const c0 = rgbStops[seg];
  const c1 = rgbStops[(seg + 1) % rgbStops.length];

  const r = Math.round(lerp(c0[0], c1[0], t));
  const g = Math.round(lerp(c0[1], c1[1], t));
  const b = Math.round(lerp(c0[2], c1[2], t));
  return `rgb(${r},${g},${b})`;
}

// --- render loop ---
let frameIndex = 0;
let phase = 0;

function render(frame){
  const lines = frame.split('\n');
  let html = '';
  for(let y=0; y<lines.length; y++){
    const line = lines[y];
    for(let x=0; x<line.length; x++){
      const ch = line[x] === ' ' ? '&nbsp;' : line[x];
      html += `<span style="color:${colorAt(x,phase)}">${ch}</span>`;
    }
    html += '\n';
  }
  return html;
}

function tick(){
  pre.innerHTML = render(frames[frameIndex]);
  frameIndex = (frameIndex + 1) % frames.length;
  phase = (phase + 1) % cols;
  setTimeout(tick, 1000 / FPS);
}
tick();
