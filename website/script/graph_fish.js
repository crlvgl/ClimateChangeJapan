// graph_fish.js
// SVG-based version of the fish catch animated chart. Exposes the same API as before:
// initFish(svgId), highlightFish(year), disposeFish()

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

let svgEl = null;
let svgRect = null;
let fish = [];
let selectedIndex = -1;
let hoverIndex = -1;
let rafId = null;

// element groups
let gGrid, gBars, gFish, gUI;

function mapValue(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

function clearChildren(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function resize() {
  if (!svgEl) return;
  svgRect = svgEl.getBoundingClientRect();
  // set viewBox to match current pixel size so 1 unit == 1px
  svgEl.setAttribute('viewBox', `0 0 ${Math.max(1, Math.floor(svgRect.width))} ${Math.max(1, Math.floor(svgRect.height))}`);
  generateFish();
}

function generateFish() {
  fish = [];
  if (!svgRect) svgRect = svgEl.getBoundingClientRect();
  const margin = svgRect.width * 0.08;
  const barWidth = (svgRect.width - 2 * margin) / data.length;
  const maxVal = Math.max(...data);

  // remove existing bar/fish elements and recreate groups
  clearChildren(gBars);
  clearChildren(gFish);

  // create bar rects
  for (let i = 0; i < data.length; i++) {
    const barHeight = mapValue(data[i], 0, maxVal, 0, svgRect.height - 200);
    const y = svgRect.height - 100 - barHeight;
    const x = margin + i * barWidth;
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', barWidth * 0.8);
    rect.setAttribute('height', barHeight);
    rect.setAttribute('fill', 'rgb(120,220,255)');
    rect.setAttribute('stroke', 'black');
    rect.setAttribute('stroke-width', '2');
    rect.dataset.index = String(i);
    gBars.appendChild(rect);

    // year labels every 5 years
    if (labels[i] % 5 === 0) {
      const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      lbl.setAttribute('x', x + barWidth * 0.4);
      lbl.setAttribute('y', svgRect.height - 80);
      lbl.setAttribute('fill', '#fff');
      lbl.setAttribute('font-size', '10');
      lbl.setAttribute('text-anchor', 'end');
      lbl.setAttribute('transform', `rotate(-60 ${x + barWidth * 0.4} ${svgRect.height - 80})`);
      lbl.textContent = labels[i];
      gBars.appendChild(lbl);
    }

    // compute fish for this bar
    const barTop = y;
    const barBottom = svgRect.height - 100;
    const numFish = Math.floor(mapValue(data[i], 0, maxVal, 1, 20));
    for (let j = 0; j < numFish; j++) {
      const fx = margin + i * barWidth + Math.random() * barWidth * 0.7;
      const baseY = barTop + 10 + Math.random() * (barBottom - barTop - 20);
      const f = {
        x: fx,
        baseY,
        amp: 3 + Math.random() * 6,
        speed: 0.02 + Math.random() * 0.12,
        phase: Math.random() * Math.PI * 2,
        el: null
      };
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', fx);
      text.setAttribute('y', baseY);
      text.setAttribute('fill', '#fff');
      text.setAttribute('font-size', '12');
      text.setAttribute('text-anchor', 'middle');
      text.textContent = '🐟';
      gFish.appendChild(text);
      f.el = text;
      fish.push(f);
    }
  }
}

function drawGrid() {
  clearChildren(gGrid);
  const margin = svgRect.width * 0.08;
  const maxVal = Math.max(...data);
  const step = 3000;
  for (let v = 0; v <= maxVal; v += step) {
    const y = mapValue(v, 0, maxVal, svgRect.height - 100, 100);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', margin - 5);
    line.setAttribute('y1', y);
    line.setAttribute('x2', svgRect.width - margin);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', 'rgba(255,255,255,0.9)');
    line.setAttribute('stroke-dasharray', '4 4');
    gGrid.appendChild(line);

    const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lbl.setAttribute('x', margin - 10);
    lbl.setAttribute('y', y);
    lbl.setAttribute('fill', '#fff');
    lbl.setAttribute('font-size', '12');
    lbl.setAttribute('text-anchor', 'end');
    lbl.setAttribute('dominant-baseline', 'middle');
    lbl.textContent = v.toFixed(0);
    gGrid.appendChild(lbl);
  }
}

function updateVisuals(frame = 0) {
  if (!svgEl) return;
  const margin = svgRect.width * 0.08;
  const barWidth = (svgRect.width - 2 * margin) / data.length;
  const maxVal = Math.max(...data);

  // update bar fills
  const rects = Array.from(gBars.querySelectorAll('rect'));
  for (const r of rects) {
    const i = Number(r.dataset.index);
    if (selectedIndex === -1) {
      if (i === hoverIndex) r.setAttribute('fill', 'rgb(80,200,240)'); else r.setAttribute('fill', 'rgb(120,220,255)');
      r.setAttribute('opacity', '1');
    } else if (i === selectedIndex) {
      r.setAttribute('fill', 'rgb(120,220,255)'); r.setAttribute('opacity', '1');
    } else {
      r.setAttribute('fill', 'rgba(120,220,255,0.43)'); r.setAttribute('opacity', '0.6');
    }
  }

  // update fish positions
  for (const f of fish) {
    const y = f.baseY + Math.sin(frame * f.speed + f.phase) * f.amp;
    f.el.setAttribute('y', String(y));
  }

  // update UI: selected value and vertical line
  clearChildren(gUI);
  if (selectedIndex !== -1) {
    const selectedValue = data[selectedIndex];
    const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    valueText.setAttribute('x', svgRect.width - margin - 240);
    valueText.setAttribute('y', 80);
    valueText.setAttribute('fill', '#fff');
    valueText.setAttribute('font-size', '14');
    valueText.setAttribute('text-anchor', 'end');
    valueText.textContent = `${selectedValue.toFixed(0)}k t`;
    gUI.appendChild(valueText);

    const x = margin + selectedIndex * barWidth + barWidth * 0.4;
    const vline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    vline.setAttribute('x1', x);
    vline.setAttribute('y1', 100);
    vline.setAttribute('x2', x);
    vline.setAttribute('y2', svgRect.height - 100);
    vline.setAttribute('stroke', 'rgb(255,100,100)');
    vline.setAttribute('stroke-width', '3');
    gUI.appendChild(vline);
  }

  rafId = requestAnimationFrame((t) => updateVisuals(frame + 1));
}

export function initFish(svgId) {
  svgEl = document.getElementById(svgId);
  if (!svgEl) return;
  // ensure this is treated as an SVG element
  if (!(svgEl instanceof SVGElement)) return;

  // create groups
  clearChildren(svgEl);
  gGrid = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  gBars = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  gFish = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  gUI = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  svgEl.appendChild(gGrid);
  svgEl.appendChild(gBars);
  svgEl.appendChild(gFish);
  svgEl.appendChild(gUI);

  // event handlers
  function onPointerMove(e) {
    const rect = svgEl.getBoundingClientRect();
    const margin = rect.width * 0.08;
    const barWidth = (rect.width - 2 * margin) / data.length;
    const x = e.clientX - rect.left;
    if (x > margin && x < rect.width - margin) {
      let idx = Math.round(mapValue(x, margin, rect.width - margin, 0, data.length - 1));
      idx = Math.min(Math.max(idx, 0), data.length - 1);
      hoverIndex = idx;
    } else {
      hoverIndex = -1;
    }
  }

  svgEl.addEventListener('pointermove', onPointerMove);
  svgEl.addEventListener('pointerleave', () => { hoverIndex = -1; });

  window.addEventListener('resize', resize);
  resize();
  drawGrid();
  updateVisuals(0);
}

export function highlightFish(year) {
  const idx = labels.indexOf(+year);
  if (idx >= 0) selectedIndex = idx; else selectedIndex = -1;
}

export function disposeFish() {
  if (rafId) cancelAnimationFrame(rafId);
  window.removeEventListener('resize', resize);
  if (svgEl) {
    try { svgEl.removeEventListener('pointermove'); } catch (e) {}
    try { svgEl.removeEventListener('pointerleave'); } catch (e) {}
    clearChildren(svgEl);
    svgEl = null;
  }
}
