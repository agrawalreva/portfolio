import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../projects/projects.json');

const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `Projects (${projects.length})`;
renderProjects(projects, projectsContainer, 'h2');

const svg = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');

const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
const colors = d3.scaleOrdinal(d3.schemeTableau10);

let selectedIndex = -1;

function renderPieChart(projectsGiven) {
    svg.selectAll('path').remove();
    legend.selectAll('li').remove();

    let rolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year
    );

    let data = rolledData.map(([year, count]) => {
        return { value: count, label: year };
    });

    let sliceGenerator = d3.pie().value((d) => d.value);
    let arcData = sliceGenerator(data);
    let arcs = arcData.map((d) => arcGenerator(d));

    arcs.forEach((arc, i) => {
        svg.append('path')
            .attr('d', arc)
            .attr('fill', colors(i))
            .attr('class', selectedIndex === i ? 'selected' : '')
            .on('click', () => {
                selectedIndex = selectedIndex === i ? -1 : i;
                updateFilteredProjects(projectsGiven);
                renderPieChart(projectsGiven);
            });
    });

    data.forEach((d, i) => {
        legend.append('li')
            .attr('style', `--color: ${colors(i)}`)
            .attr('class', `legend-item ${selectedIndex === i ? 'selected' : ''}`)
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
            .on('click', () => {
                selectedIndex = selectedIndex === i ? -1 : i;
                updateFilteredProjects(projectsGiven);
                renderPieChart(projectsGiven);
            });
    });
}

function updateFilteredProjects(projectsGiven) {
    let filteredProjects = projectsGiven;

    const searchInput = document.querySelector('.searchBar');
    const query = searchInput.value.toLowerCase();
    if (query) {
        filteredProjects = filteredProjects.filter((project) => {
            let values = Object.values(project).join('\n').toLowerCase();
            return values.includes(query);
        });
    }

    if (selectedIndex !== -1) {
        const selectedYear = d3.rollups(
            projectsGiven,
            (v) => v.length,
            (d) => d.year
        )[selectedIndex][0];
        filteredProjects = filteredProjects.filter((project) => project.year === selectedYear);
    }

    renderProjects(filteredProjects, projectsContainer, 'h2');
}

renderPieChart(projects);

let query = '';
const searchInput = document.querySelector('.searchBar');
const clearButton = document.querySelector('.clear-button');

searchInput.addEventListener('input', () => {
    updateFilteredProjects(projects); 
    renderPieChart(projects);
});

clearButton.addEventListener('click', () => {
    searchInput.value = ''; 
    query = '';

    renderProjects(projects, projectsContainer, 'h2');
    renderPieChart(projects);
});