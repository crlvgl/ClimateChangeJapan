// graph_fish.js
// Module that renders the fishCatch animated chart into a canvas and exposes highlight function

const data = [
  10590.4, 11121.8, 11318.7, 11388.1, 11967.3, 12815.9, 12171.3, 12738.9,
  12464.6, 12784.7, 11913.5, 11051.8, 9977.7, 9265.6, 8706.8, 8102.6, 7488.6,
  7417.1, 7410.7, 6684.3, 6626, 6384.1, 6125.7, 5880, 6083.147, 5775.474,
  5764.54, 5734.975, 5719.928, 5592.327, 5432.011, 5312.687, 4765.972,
  4853.093, 4773.695, 4765.523, 4630.717, 4368.234, 4306.399, 4427.393,
  4203.664, 4235.905, 4157.811, 3916.956, 3829.822
];

const labels = [
  1979, 1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990,
  1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002,
  2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014,
  2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023
];

let canvas, ctx;
let fish = [];
let selectedIndex = -1;
let hoverIndex = -1;
let rafId;

function mapValue(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

function resize() {
  if (!canvas) return;
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  generateFish();
}

function generateFish() {
  fish = [];
  const margin = canvas.width * 0.08 / devicePixelRatio;
  const barWidth = (canvas.width / devicePixelRatio - 2 * margin) / data.length;
  const maxVal = Math.max(...data);

  for (let i = 0; i < data.length; i++) {
    const barHeight = mapValue(data[i], 0, maxVal, 0, canvas.height / devicePixelRatio - 200);
    const barTop = canvas.height / devicePixelRatio - 100 - barHeight;
    const barBottom = canvas.height / devicePixelRatio - 100;
    // produce fewer, smaller and slightly slower fish
    const numFish = Math.floor(mapValue(data[i], 0, maxVal, 1, 20));

    for (let j = 0; j < numFish; j++) {
      fish.push({
        x: margin + i * barWidth + Math.random() * barWidth * 0.7,
        baseY: barTop + 10 + Math.random() * (barBottom - barTop - 20),
        amp: 3 + Math.random() * 6, // smaller vertical swim amplitude
        speed: 0.02 + Math.random() * 0.12, // slightly slower
        phase: Math.random() * Math.PI * 2
      });
    }
  }
}

function drawAxis(margin, maxVal) {
  const canvasW = canvas.width / devicePixelRatio;
  const canvasH = canvas.height / devicePixelRatio;
  ctx.strokeStyle = '#666';
  ctx.fillStyle = '#333';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const step = 3000;

  for (let v = 0; v <= maxVal; v += step) {
    const y = mapValue(v, 0, maxVal, canvasH - 100, 100);
    ctx.beginPath();
    ctx.moveTo(margin - 5, y);
    ctx.lineTo(canvasW - margin, y);
    ctx.stroke();
    ctx.fillText(v.toFixed(0), margin - 10, y);
  }
}

function drawBars(margin, barWidth, maxVal) {
  const canvasW = canvas.width / devicePixelRatio;
  const canvasH = canvas.height / devicePixelRatio;
  for (let i = 0; i < data.length; i++) {
    const barHeight = mapValue(data[i], 0, maxVal, 0, canvasH - 200);
    const y = canvasH - 100 - barHeight;
    const x = margin + i * barWidth;

    // When there's no slider-selected index, use hoverIndex for a subtle hover visual
    if (selectedIndex === -1) {
      if (i === hoverIndex) {
        ctx.fillStyle = 'rgb(80,200,240)';
      } else {
        ctx.fillStyle = 'rgb(120,220,255)';
      }
    } else if (i === selectedIndex) {
      ctx.fillStyle = 'rgb(120,220,255)';
    } else {
      ctx.fillStyle = 'rgba(200,200,200,0.4)';
    }

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, barWidth * 0.8, barHeight);
    ctx.strokeRect(x, y, barWidth * 0.8, barHeight);

    // year label
    ctx.save();
    ctx.translate(x + barWidth * 0.4, canvasH - 80);
    ctx.rotate(-Math.PI / 3);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#222';
    ctx.font = '10px sans-serif';
    ctx.fillText(labels[i], 0, 0);
    ctx.restore();
  }
}

function drawFish(frame) {
  // smaller fish glyph so the visualization is less crowded
  ctx.font = '12px serif';
  for (const f of fish) {
    const y = f.baseY + Math.sin(frame * f.speed + f.phase) * f.amp;
    ctx.fillText('🐟', f.x, y);
  }
}

function drawText(margin, maxVal) {
  const canvasW = canvas.width / devicePixelRatio;
  const canvasH = canvas.height / devicePixelRatio;
  ctx.fillStyle = '#333';
  ctx.font = '16px sans-serif';
  ctx.save();
  ctx.translate(margin - 70, canvasH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText("Fish catch (1000t)", 0, 0);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillText('Year', canvasW / 2, canvasH - 40);

  ctx.font = '18px sans-serif';
}

function loop(frame = 0) {
  if (!canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const margin = canvas.width * 0.08 / devicePixelRatio;
  const barWidth = (canvas.width / devicePixelRatio - 2 * margin) / data.length;
  const maxVal = Math.max(...data);

  drawAxis(margin, maxVal);
  drawBars(margin, barWidth, maxVal);
  drawFish(frame);
  drawText(margin, maxVal);

  if (selectedIndex !== -1) {
    const selectedYear = labels[selectedIndex];
    const selectedValue = data[selectedIndex];
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    const canvasW = canvas.width / devicePixelRatio;
    ctx.fillText(`Year: ${selectedYear}, Fish Catch: ${selectedValue.toFixed(0)}000t`, canvasW - margin - 240, 80);

    ctx.strokeStyle = 'rgb(255,100,100)';
    ctx.lineWidth = 3;
    const x = margin + selectedIndex * barWidth + barWidth * 0.4;
    ctx.beginPath();
    ctx.moveTo(x, 100);
    ctx.lineTo(x, canvas.height / devicePixelRatio - 100);
    ctx.stroke();
  }

  rafId = requestAnimationFrame(() => loop(frame + 1));
}

export function initFish(canvasId) {
  canvas = document.getElementById(canvasId);
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  window.addEventListener('resize', resize);
  resize();
  // pointer hover to update selection by mouse (optional)
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const margin = rect.width * 0.08;
    const barWidth = (rect.width - 2 * margin) / data.length;
    const x = e.clientX - rect.left;
    if (x > margin && x < rect.width - margin) {
      let idx = Math.round(mapValue(x, margin, rect.width - margin, 0, data.length - 1));
      idx = Math.min(Math.max(idx, 0), data.length - 1);
      // only update hover visual — do NOT move the indicator line
      hoverIndex = idx;
    }
  });
  canvas.addEventListener('mouseleave', () => { hoverIndex = -1; });
  loop();
}

export function highlightFish(year) {
  const idx = labels.indexOf(+year);
  if (idx >= 0) selectedIndex = idx; else selectedIndex = -1;
}

export function disposeFish() {
  cancelAnimationFrame(rafId);
  window.removeEventListener('resize', resize);
}
