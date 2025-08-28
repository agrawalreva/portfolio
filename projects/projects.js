import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { fetchJSON, renderProjects } from '../src/js/global.js';

let projects = [];
let filteredProjects = [];
let selectedYear = null;

const projectsContainer = document.getElementById('projects-container');
const svg = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');

const arcGenerator = d3.arc().innerRadius(0).outerRadius(45);
const colors = d3.scaleOrdinal(d3.schemeTableau10);

async function initializeProjects() {
    try {
        projects = await fetchJSON('projects.json');
        filteredProjects = [...projects];
        renderPieChart();
        renderProjectsList();
    } catch (error) {
        console.error('Failed to load projects:', error);
        projectsContainer.innerHTML = '<p>Failed to load projects. Please try again later.</p>';
    }
}

function renderPieChart() {
    svg.selectAll('path').remove();
    legend.selectAll('li').remove();

    const yearData = d3.rollups(
        projects,
        (v) => v.length,
        (d) => d.year
    );

    const pieData = yearData.map(([year, count]) => ({
        year,
        count,
        value: count
    }));

    const pie = d3.pie().value(d => d.value);
    const arcData = pie(pieData);

    // Add slices with animations
    svg.selectAll('path')
        .data(arcData)
        .enter()
        .append('path')
        .attr('d', arcGenerator)
        .attr('fill', (d, i) => colors(i))
        .attr('class', d => selectedYear === d.data.year ? 'selected' : '')
        .style('opacity', 0)
        .transition()
        .duration(800)
        .delay((d, i) => i * 100)
        .style('opacity', 1)
        .on('end', function() {
            d3.select(this).on('click', function(event, d) {
                handleYearSelection(d.data.year);
            });
        });

    // Add legend
    legend.selectAll('li')
        .data(pieData)
        .enter()
        .append('li')
        .attr('class', d => `legend-item ${selectedYear === d.year ? 'selected' : ''}`)
        .style('--color', (d, i) => colors(i))
        .html(d => `
            <span class="swatch" style="background-color: ${colors(pieData.indexOf(d))}"></span>
            <span>${d.year} <em>(${d.count})</em></span>
        `)
        .on('click', function(event, d) {
            handleYearSelection(d.year);
        });

    // Add center text
    svg.selectAll('.center-text').remove();
    svg.append('text')
        .attr('class', 'center-text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', 'var(--color-text)')
        .text(`${projects.length} Projects`);
}

function handleYearSelection(year) {
    selectedYear = selectedYear === year ? null : year;
    updateFilteredProjects();
    renderPieChart();
    renderProjectsList();
}

function updateFilteredProjects() {
    let filtered = [...projects];

    // Apply year filter
    if (selectedYear) {
        filtered = filtered.filter(project => project.year === selectedYear);
    }

    // Apply search filter
    const searchQuery = document.querySelector('.searchBar').value.toLowerCase();
    if (searchQuery) {
        filtered = filtered.filter(project => {
            const searchText = [
                project.title,
                project.description,
                project.category,
                ...(project.technologies || [])
            ].join(' ').toLowerCase();
            return searchText.includes(searchQuery);
        });
    }

    filteredProjects = filtered;
}

function renderProjectsList() {
    if (!projectsContainer) return;

    projectsContainer.innerHTML = '';
    
    if (filteredProjects.length === 0) {
        projectsContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                <p>No projects found matching your criteria.</p>
                <button onclick="clearFilters()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--color-accent); color: white; border: none; border-radius: var(--radius); cursor: pointer;">Clear Filters</button>
            </div>
        `;
        return;
    }

    filteredProjects.forEach(project => {
        const article = document.createElement('article');
        article.className = 'project-card';

        const techTags = project.technologies ? 
            project.technologies.map(tech => `<span>${tech}</span>`).join('') : '';

        article.innerHTML = `
            <h3>${project.title}</h3>
            <img src="${project.image}" alt="${project.title}" loading="lazy">
            <p>${project.description}</p>
            <div class="project-year">${project.year}</div>
            <div class="project-tech">${techTags}</div>
        `;

        projectsContainer.appendChild(article);
    });
}

// Search functionality
const searchInput = document.querySelector('.searchBar');
const clearButton = document.querySelector('.clear-button');

searchInput.addEventListener('input', () => {
    updateFilteredProjects();
    renderProjectsList();
});

clearButton.addEventListener('click', () => {
    searchInput.value = '';
    selectedYear = null;
    updateFilteredProjects();
    renderPieChart();
    renderProjectsList();
});

// Global function for clear filters button
window.clearFilters = function() {
    searchInput.value = '';
    selectedYear = null;
    updateFilteredProjects();
    renderPieChart();
    renderProjectsList();
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeProjects); 