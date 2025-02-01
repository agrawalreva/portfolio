import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../projects/projects.json');

const projectsContainer = document.querySelector('.projects');

const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `Projects (${projects.length})`;
console.log("Fetched Projects:", projects);
renderProjects(projects, projectsContainer, 'h2');
