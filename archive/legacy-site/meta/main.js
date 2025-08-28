let data = [];
let commits = [];
let selectedCommits = [];
let commitProgress = 100;
let timeScale;
let xScale, yScale, rScale;

let NUM_ITEMS = 100; 
let ITEM_HEIGHT = 100; 
let VISIBLE_COUNT = 10; 
let totalHeight = (NUM_ITEMS - 1) * ITEM_HEIGHT;
const scrollContainer = d3.select('#scroll-container');
const spacer = d3.select('#spacer');
spacer.style('height', `${totalHeight}px`);
const itemsContainer = d3.select('#items-container');
scrollContainer.on('scroll', () => {
  const scrollTop = scrollContainer.property('scrollTop');
  
  let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
  
  startIndex = Math.max(0, Math.min(startIndex, commits.length - VISIBLE_COUNT));
  
  renderItems(startIndex);
});

const width = 1000;
const height = 600;
const margin = { top: 10, right: 10, bottom: 30, left: 50 };
const usableArea = {
  top: margin.top,
  right: width - margin.right,
  bottom: height - margin.bottom,
  left: margin.left,
  width: width - margin.left - margin.right,
  height: height - margin.top - margin.bottom,
};

let brushSelection = null;

async function loadData() {
  data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  console.log("CSV Data Loaded: ", data);
  processCommits();
  displayStats();
  const minDate = d3.min(commits, (d) => d.datetime);
  const maxDate = d3.max(commits, (d) => d.datetime);

  timeScale = d3.scaleTime()
    .domain([minDate, maxDate])    
    .range([0, 100]);

  updateScatterplot(commits);
  updateTimeDisplay();
}

function processCommits() {
  commits = d3.groups(data, (d) => d.commit).map(([commit, lines]) => {
    let first = lines[0];
    let { author, date, time, timezone, datetime } = first;

    let ret = {
      id: commit,
      url: 'https://github.com/agrawalreva/portfolio/commit/' + commit,
      author,
      date,
      time,
      timezone,
      datetime,
      hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
      totalLines: lines.length,
    };

    Object.defineProperty(ret, 'lines', {
      value: lines,
      configurable: false,
      enumerable: false,
      writable: false,
    });

    return ret;
  });

  console.log("Processed Commits: ", commits);
}

function displayStats() {
  
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  dl.append('dt').html('Total <abbr title="Lines of Code">LOC</abbr>');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  dl.append('dt').text('Max file length (lines)');
  dl.append('dd').text(d3.max(data, (d) => d.line));

  dl.append('dt').text('Average line length (characters)');
  dl.append('dd').text(d3.mean(data, (d) => d.length).toFixed(2));

  dl.append('dt').text('Most active commit time');
  dl.append('dd').text(d3.greatest(d3.rollups(data, (v) => v.length, (d) => d.time), (d) => d[1])?.[0]);

  dl.append('dt').text('Number of files');
  dl.append('dd').text(d3.groups(data, (d) => d.file).length);

  dl.append('dt').text('Number of authors');
  dl.append('dd').text(d3.groups(data, (d) => d.author).length);

  dl.append('dt').text('Longest line length');
  dl.append('dd').text(d3.max(data, (d) => d.length));

  dl.append('dt').text('Deepest line (max depth)');
  dl.append('dd').text(d3.max(data, (d) => d.depth));

  dl.append('dt').text('Most common time of day for commits');
  dl.append('dd').text(d3.greatest(d3.rollups(data, (v) => v.length, (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })), (d) => d[1])?.[0]);
}

function updateScatterplot(filteredCommits) {
  
  d3.select('#chart').select('svg').remove();

  const sortedCommits = d3.sort(filteredCommits, (d) => -d.totalLines);

  const svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  
  const xDomain = d3.extent(sortedCommits, (d) => d.datetime);
  xScale = d3.scaleTime()
    .domain(xDomain)
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  const [minLines, maxLines] = d3.extent(sortedCommits, (d) => d.totalLines);
  rScale = d3.scaleSqrt()
    .domain([minLines || 0, maxLines || 0])
    .range([2, 30]);

  
  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);
  gridlines.call(
    d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width)
  );

  
  const xAxis = d3.axisBottom(xScale).ticks(10);
  svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  
  const yAxis = d3.axisLeft(yScale)
    .tickFormat((d) => {
      let hour = d % 24;
      return String(hour).padStart(2, '0') + ':00';
    });
  svg.append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  
  const dotsGroup = svg.append('g').attr('class', 'dots');
  dotsGroup.selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .style('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      updateTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', (event) => {
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipContent({});
      updateTooltipVisibility(false);
    });

  
  const brush = d3.brush()
    .on('start brush end', brushed);
  svg.call(brush);

  
  svg.selectAll('.dots, .overlay ~ *')
    .raise();
}

export function updateTimeDisplay() {
  const sliderEl = document.getElementById('timeSlider');
  
  if (!sliderEl) return; 

  commitProgress = Number(sliderEl.value);

  
  console.log("Slider value:", commitProgress); // Debug

  
  if (!timeScale) return; 
  const commitMaxTime = timeScale.invert(commitProgress);
  console.log("Computed commitMaxTime:", commitMaxTime); // Debug
  
  const timeEl = document.getElementById('selectedTime');
  if (timeEl) {
    timeEl.textContent = commitMaxTime.toLocaleString('en', {
      dateStyle: 'long',
      timeStyle: 'short'
    });
  }

  const filteredCommits = commits.filter(c => c.datetime <= commitMaxTime);
  console.log("Number of filtered commits:", filteredCommits.length); // Debug

  updateScatterplot(filteredCommits);

  selectedCommits = [];
  updateSelection();
  updateSelectionCount();
  updateLanguageBreakdown();
  updateFileLines(filteredCommits); 

}

function updateTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author');
    const lines = document.getElementById('commit-lines');
  
    if (!commit || Object.keys(commit).length === 0) return;
  
    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', { dateStyle: 'full' });
    time.textContent = commit.time;
    author.textContent = commit.author;
    lines.textContent = commit.totalLines;
  }
  
  function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
  }
  
  function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
  }
  
  function brushed(evt) {
    let selection = evt.selection;
  
    selectedCommits = !selection
      ? []
      : commits.filter((commit) => {
        let [[x0, y0], [x1, y1]] = selection;
        let cx = xScale(commit.date);
        let cy = yScale(commit.hourFrac);
        return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
        });
  
    updateSelection();
  }
  
  function isCommitSelected(commit) {
    return selectedCommits.includes(commit);
  }  
  
  function updateSelection() {
    d3.selectAll('circle')
      .classed('selected', (d) => isCommitSelected(d));
      
    updateSelectionCount();
    updateLanguageBreakdown();
  }
  
  
  function updateSelectionCount() {
    const countElement = document.getElementById('selection-count');
    countElement.textContent = `${selectedCommits.length || 'No'} commits selected`;
  }
  
  function updateLanguageBreakdown() {
    const container = document.getElementById('language-breakdown');
    if (!container) return;
    
    if (!selectedCommits.length) {
      container.innerHTML = '';
      return;
    }
  
    if (selectedCommits.length === 0) {
      container.innerHTML = '<dd>No commits selected</dd>';
      return;
    }
  
    const lines = selectedCommits.flatMap((d) => d.lines);
    const breakdown = d3.rollup(lines, (v) => v.length, (d) => d.type);
  
    container.innerHTML = '';
  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);
    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines (${formatted})</dd>
    `;
  }
}

function filterCommitsByTime(commitMaxTime) {
  return commits.filter((c) => c.datetime <= commitMaxTime);
}


const fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);

function updateFileLines(filteredCommits) {
  let lines = filteredCommits.flatMap((d) => d.lines);
  console.log("updateFileLines: total lines =", lines.length);
  
  let files = d3.groups(lines, (d) => d.file).map(([name, lines]) => ({
    name,
    lines
  }));

  
  files = d3.sort(files, (f) => -f.lines.length);
  console.log("updateFileLines: files array =", files);

  
  d3.select('.files').selectAll('div').remove();

  
  let filesContainer = d3.select('.files')
    .selectAll('div')
    .data(files)
    .enter()
    .append('div');

  
  filesContainer.append('dt')
    .html((d) => {
      return `
        <code>${d.name}</code>
        <small style="display:block; opacity:0.8;">
          ${d.lines.length} lines
        </small>
      `;
    });

  
  filesContainer.append('dd')
    .selectAll('div')
    .data((d) => d.lines)
    .enter()
    .append('div')
    .attr('class', 'line')
    .style('background', (line) => fileTypeColors(line.type));
}

function renderItems(startIndex) {
  let itemsContainer = d3.select('#items-container');
  itemsContainer.selectAll('div').remove();

  const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
  let newCommitSlice = commits.slice(startIndex, endIndex);
  console.log("Rendering items from index", startIndex, "to", endIndex, "IDs:", newCommitSlice.map(d => d.id)); // Debug
  
  updateScatterplot(newCommitSlice);
  updateFileLines(newCommitSlice);
  itemsContainer.selectAll('div')
    .data(newCommitSlice)
    .enter()
    .append('div')
    .attr('class', 'item')
    .style('position', 'absolute')
    .style('top', (_, idx) => `${idx * ITEM_HEIGHT}px`)
    .html((d, i) => `
      <p>
        On ${d.datetime.toLocaleString("en", {dateStyle: "full", timeStyle: "short"})}, I made
        <a href="${d.url || '#'}" target="_blank">
          ${i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}
        </a>. I edited ${d.totalLines} lines across ${d3.rollups(d.lines, v => v.length, e => e.file).length} files. Then I looked over all I had made, and I saw that it was very good.
      </p>
    `);
}
  
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
});
