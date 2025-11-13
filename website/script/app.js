import { initThree, initGroups, updateGroupLabels, createCubes, modelLoadedPromise, numGroups } from './threeScene.js';
import { initFish, highlightFish } from './graph_fish.js';
import { initTemp, highlightTemp } from './graph_temp.js';

// D3 + UI app module
// Note: D3 is included globally via a <script> tag in the HTML (d3.v7)

initThree('three-container');

// D3 graph variables
const svg = d3.select('#graph');
const width = svg.node().clientWidth;
const height = svg.node().clientHeight;
const margin = { top: 20, right: 30, bottom: 30, left: 40 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

let xScale, yScale, line, focusCircle, pathElem, xAxisGroup, yAxisGroup, g;
let csvData = [];

const groupSpecies = ['Tuna fish', 'Horse mackerel', 'Sardines', 'Bonito', 'Salmon', 'Mackerel', 'Saury', 'Sea bream', 'Yellowtail', 'Cuttlefish', 'Octopus', 'Prawns', 'Short-necked clams', 'Oysters', 'Scallops'];

function buildGraph(dataRows) {
    g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    xScale = d3.scaleLinear().domain(d3.extent(dataRows, d => d.Year)).range([0, innerWidth]);
    const primary = groupSpecies[0];
    yScale = d3.scaleLinear().domain([0, d3.max(dataRows, d => d[primary])]).range([innerHeight, 0]);
    line = d3.line().x(d => xScale(d.Year)).y(d => yScale(d[primary]));
    pathElem = g.append('path').datum(dataRows).attr('fill', 'none').attr('stroke', '#0077ff').attr('stroke-width', 2).attr('d', line);
    xAxisGroup = g.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(xScale).tickFormat(d3.format('d')));
    yAxisGroup = g.append('g').call(d3.axisLeft(yScale));
    focusCircle = g.append('circle').attr('r', 5).attr('fill', 'red').style('opacity', 0);
}

const slider = document.getElementById('year-slider');
const yearLabel = document.getElementById('year-label');

function updateVisualization(year) {
    yearLabel.textContent = year;
    const point = csvData.find(d => d.Year === +year);
    if (point && xScale && yScale) {
        focusCircle.attr('cx', xScale(point.Year)).attr('cy', yScale(point[groupSpecies[0]])).style('opacity', 1);
    }

    // highlight the other graphs
    try { highlightFish(year); } catch (e) { /* ignore */ }
    try { highlightTemp(year); } catch (e) { /* ignore */ }

    const minYear = csvData.length ? d3.min(csvData, d => d.Year) : 2000;
    const maxYear = csvData.length ? d3.max(csvData, d => d.Year) : 2025;
    const maxCubes = 100;
    const yearFraction = (year - minYear) / Math.max(1, (maxYear - minYear));
    const cubeCount = Math.max(5, Math.floor(maxCubes * (1 - yearFraction)));

    const groupValues = [];
    for (let gi = 0; gi < numGroups; gi++) {
        const species = groupSpecies[gi] || groupSpecies[0];
        const val = point ? (+point[species] || 0) : 0;
        groupValues.push(val);
    }

    initGroups(groupValues[0] || 0);
    updateGroupLabels(groupValues.map(v => String(v)));
    createCubes(cubeCount);
}

slider.addEventListener('input', e => { updateVisualization(+e.target.value); });

// Load CSV and initialize graph + slider
d3.csv('data/EstimatedFishPricesByYear.csv', d => {
    const parsed = { Year: +d.Year };
    Object.keys(d).forEach(k => { if (k === 'Year') return; parsed[k] = d[k] === undefined || d[k] === '' ? 0 : +d[k]; });
    return parsed;
}).then(rows => {
    csvData = rows;
    if (!csvData || csvData.length === 0) { console.warn('CSV loaded but empty.'); return; }
    buildGraph(csvData);
    // initialize the other graphs after DOM is ready
    try { initFish('fishChart'); } catch (e) { console.warn('initFish failed', e); }
    try { initTemp('seaTempSvg'); } catch (e) { console.warn('initTemp failed', e); }
    const minY = d3.min(csvData, d => d.Year);
    const maxY = d3.max(csvData, d => d.Year);
    slider.min = minY; slider.max = maxY; slider.value = minY;
    updateVisualization(+slider.value);
    // also refresh after model loads so GLTF-based instances show properly
    modelLoadedPromise.then(() => { updateVisualization(+slider.value); });
}).catch(err => { console.error('Failed to load CSV:', err); });
