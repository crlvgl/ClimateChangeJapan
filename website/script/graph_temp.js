// graph_temp.js
// Renders sea surface temperature changes into given SVG and exposes a highlight function

const data = [
  { year: 1979, temp: -0.16 }, { year: 1980, temp: -0.59 },
  { year: 1981, temp: -1.11 }, { year: 1982, temp: -0.58 },
  { year: 1983, temp: -0.37 }, { year: 1984, temp: -0.78 },
  { year: 1985, temp: -0.56 }, { year: 1986, temp: -0.96 },
  { year: 1987, temp: -0.61 }, { year: 1988, temp: -0.32 },
  { year: 1989, temp: -0.38 }, { year: 1990, temp: 0.02 },
  { year: 1991, temp: -0.18 }, { year: 1992, temp: -0.44 },
  { year: 1993, temp: -0.67 }, { year: 1994, temp: 0.00 },
  { year: 1995, temp: -0.31 }, { year: 1996, temp: -0.58 },
  { year: 1997, temp: -0.13 }, { year: 1998, temp: 0.56 },
  { year: 1999, temp: 0.27 }, { year: 2000, temp: 0.06 },
  { year: 2001, temp: 0.28 }, { year: 2002, temp: -0.15 },
  { year: 2003, temp: -0.17 }, { year: 2004, temp: 0.11 },
  { year: 2005, temp: -0.13 }, { year: 2006, temp: -0.25 },
  { year: 2007, temp: 0.15 }, { year: 2008, temp: 0.06 },
  { year: 2009, temp: -0.10 }, { year: 2010, temp: 0.17 },
  { year: 2011, temp: -0.39 }, { year: 2012, temp: -0.11 },
  { year: 2013, temp: 0.08 }, { year: 2014, temp: -0.23 },
  { year: 2015, temp: -0.06 }, { year: 2016, temp: 0.53 },
  { year: 2017, temp: 0.35 }, { year: 2018, temp: 0.19 },
  { year: 2019, temp: 0.50 }, { year: 2020, temp: 0.58 },
  { year: 2021, temp: 0.74 }, { year: 2022, temp: 0.62 },
  { year: 2023, temp: 1.10 }
];

let svg; let x, y, width, height, margin;

export function initTemp(svgId) {
  svg = d3.select('#' + svgId);
  // remove any existing contents
  svg.selectAll('*').remove();

  margin = { top: 36, right: 20, bottom: 36, left: 44 };
  const rect = svg.node().getBoundingClientRect();
  width = rect.width - margin.left - margin.right;
  height = rect.height - margin.top - margin.bottom;

  if (width <= 0) width = 300;
  if (height <= 0) height = 150;

  const g = svg
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  x = d3.scaleBand().domain(data.map(d => d.year)).range([0, width]).padding(0.12);
  const yMax = d3.max(data, d => Math.abs(d.temp)) * 1.2;
  y = d3.scaleLinear().domain([-yMax, yMax]).range([height, 0]);

  const color = d3.scaleSequential().domain([yMax, -yMax]).interpolator(d3.interpolateRdBu);

  g.append('g')
    .attr('transform', `translate(0,${height/2})`)
    .call(d3.axisBottom(x).tickValues(x.domain().filter((d, i) => !(i % 2))))
    .selectAll('text')
    .attr('transform', 'rotate(-45)').style('text-anchor', 'end');

  g.append('g').call(d3.axisLeft(y));

  g.append('g')
    .attr('class', 'grid')
    .call(d3.axisLeft(y).tickSize(-width).tickFormat(''))
    .attr('stroke-opacity', 0.2);

  // tooltip
  const tooltip = d3.select('body').selectAll('.tooltip').data([0]);
  tooltip.exit().remove();
  tooltip.enter().append('div').attr('class', 'tooltip').style('opacity', 0);

  g.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'sea-bar')
    .attr('x', d => x(d.year))
    .attr('width', x.bandwidth())
    .attr('y', d => d.temp >= 0 ? y(d.temp) : y(0))
    .attr('height', d => Math.abs(y(d.temp) - y(0)))
    .attr('fill', d => color(d.temp))
    .on('mouseover', (event, d) => {
      tooltip.style('opacity', 1)
        .html(`<b>${d.year}</b><br/>${d.temp.toFixed(2)} °C`)
        .style('left', (event.pageX + 8) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', () => tooltip.style('opacity', 0));

  g.append('text')
    .attr('x', width / 2).attr('y', -10)
    .attr('class', 'title')
    .text('Sea Surface Temperature Changes (1979–2023)');

  // axis labels
  g.append('text').attr('x', width / 2).attr('y', height + 40).attr('text-anchor', 'middle').text('Year');
  g.append('text').attr('transform', 'rotate(-90)').attr('x', -height / 2).attr('y', -34).attr('text-anchor', 'middle').text('Sea Temperature (°C)');

  // tooltip
  const tooltip2 = d3.select('body').selectAll('.tooltip').data([0]);
  tooltip2.exit().remove();
  tooltip2.enter().append('div').attr('class', 'tooltip').style('opacity', 0);
}

export function highlightTemp(year) {
  if (!svg) return;
  const yInt = +year;
  svg.selectAll('.sea-bar').classed('selected', false);
  svg.selectAll('.sea-bar').filter(d => d.year === yInt).classed('selected', true).raise();
}
