let data = [];
let commits = [];
let xScale, yScale, rScale;

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

  displayStats();
  createScatterplot();
  brushSelector();
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
  processCommits();
  
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

function createScatterplot() {
    const svg = d3
      .select('#chart')
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('overflow', 'visible');
  
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);

    xScale = d3.scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([usableArea.left, usableArea.right])
        .nice();

    yScale = d3.scaleLinear()
        .domain([0, 24])
        .range([usableArea.bottom, usableArea.top]);

    rScale = d3.scaleSqrt()
        .domain(d3.extent(commits, (d) => d.totalLines))
        .range([2, 30]);
  
    const gridlines = svg.append('g')
      .attr('class', 'gridlines')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
  
    const dots = svg.append('g').attr('class', 'dots');
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  
    dots.selectAll('circle')
      .data(commits)
      .join('circle')
      .attr('cx', (d) => xScale(d.datetime))
      .attr('cy', (d) => yScale(d.hourFrac))
      .attr('r', (d) => rScale(d.totalLines))
      .attr('fill', 'steelblue')
      .style('fill-opacity', 0.7)
      .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1);
        updateTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
      })
      .on('mouseleave', function () {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipContent({});
        updateTooltipVisibility(false);
      });
  
    svg.append('g')
      .attr('transform', `translate(0, ${usableArea.bottom})`)
      .call(d3.axisBottom(xScale));
  
    svg.append('g')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(d3.axisLeft(yScale).tickFormat((d) => String(d % 24).padStart(2, '0') + ':00'));
}

function brushSelector() {
    const svg = d3.select('svg');
    const brush = d3.brush().on('start brush end', brushed);
    
    svg.append('g').attr('class', 'brush').call(brush);
    d3.select(svg.node()).selectAll('.dots, .overlay ~ *').raise();
  }
  
  function brushed(event) {
    brushSelection = event.selection;
    updateSelection();
  }
  
  function isCommitSelected(commit) {
    if (!brushSelection) return false;
    
    const [[x0, y0], [x1, y1]] = brushSelection;
    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);
  
    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
  }
  
  function updateSelection() {
    d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
    updateSelectionCount();
    updateLanguageBreakdown();
  }
  
  function updateSelectionCount() {
    const selectedCommits = brushSelection ? commits.filter(isCommitSelected) : [];
    const countElement = document.getElementById('selection-count');
    countElement.textContent = `${selectedCommits.length || 'No'} commits selected`;
  }
  
  function updateLanguageBreakdown() {
    const selectedCommits = brushSelection ? commits.filter(isCommitSelected) : [];
    const container = document.getElementById('language-breakdown');
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);
    const breakdown = d3.rollup(lines, (v) => v.length, (d) => d.type);
    container.innerHTML = '';
    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
      container.innerHTML += `<dt>${language}</dt><dd>${count} lines (${formatted})</dd>`;
    }
  }
  

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
});
